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
use fast_react_core::{
    ContextHandle, ContextValueHandle, FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle,
    StateHandle, UpdateQueueHandle,
};
#[cfg(test)]
use fast_react_core::{FiberTypeHandle, StateNodeHandle};
#[cfg(test)]
use fast_react_core::{HookListId, HookQueueId, HookUpdateId};
use fast_react_host_config::HostTypes;

#[cfg(test)]
use crate::UpdateId;
#[cfg(test)]
use crate::begin_work::{
    BeginWorkError, BeginWorkRequest, UnsupportedOffscreenChildShapeRecord,
    unsupported_offscreen_begin_work_record, unsupported_suspense_begin_work_record,
};
#[cfg(test)]
use crate::context::{
    ContextProviderUpdateConsumerOrder, ContextProviderUpdateDependencyPath,
    ContextProviderUpdateLaneGateError, ContextProviderUpdateSingleConsumerLaneRecord,
    ContextProviderUpdateSingleConsumerLaneRequest, ContextProviderUpdateTwoConsumerLaneRecord,
    ContextProviderUpdateTwoConsumerLaneRequest,
    record_context_provider_update_single_consumer_lane_gate,
    record_context_provider_update_two_consumer_lane_gate,
};
#[cfg(test)]
use crate::root_commit::HostRootMutationApplyRecordKind;
use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootStateStoreError, RootElementHandle,
    RootRenderExitStatus, RootSchedulerCallbackHandle, UpdateQueueError, WorkInProgressError,
    begin_work::{
        NestedContextProviderBeginWorkError, NestedContextProviderBeginWorkRecord,
        NestedContextProviderBeginWorkRequest, NestedContextProviderUseContextBeginWorkRecord,
        begin_work_nested_context_provider_child,
        begin_work_nested_context_provider_use_context_child,
    },
    create_host_root_work_in_progress,
    function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextRenderStore,
        FunctionComponentInvoker,
    },
};
#[cfg(test)]
use crate::{
    HostRootCommitRecord,
    begin_work::{
        ContextProviderBeginWorkError, ContextProviderBeginWorkRecord,
        ContextProviderBeginWorkRequest, ContextProviderUseContextBeginWorkRecord,
        ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
        ContextProviderUseContextSingleChildBeginWorkRecord,
        FunctionComponentBeginWorkBailoutBlockerError,
        FunctionComponentBeginWorkBailoutBlockerRecord,
        FunctionComponentSingleChildBeginWorkRecord, FunctionComponentUseStateBeginWorkRecord,
        HostRootOneLevelChildSet, HostRootOneLevelChildSetBeginWorkError,
        HostRootOneLevelChildSetBeginWorkRecord, HostRootOneLevelChildSetEntry,
        HostRootOneLevelChildSetKind, NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
        UnsupportedActivityChildShapeKind, UnsupportedOffscreenChildShapeKind,
        UnsupportedSuspenseChildShapeKind, UnsupportedSuspenseListChildShapeKind,
        UnsupportedThenableIdentityClass, UnsupportedThenableRetryQueueKind,
        begin_work_context_provider_child, begin_work_context_provider_use_context_child,
        begin_work_context_provider_use_context_single_child,
        begin_work_context_provider_use_context_single_child_for_complete_traversal,
        begin_work_function_component_bailout_blocker_for_test,
        begin_work_function_component_use_context, begin_work_host_root_one_level_child_set,
        begin_work_nested_context_provider_two_consumer_use_context_children,
        begin_work_reconcile_function_component_single_child, begin_work_with_use_state,
    },
    complete_work::{
        ContextProviderStackRestorationError, ContextProviderStackRestorationPhase,
        ContextProviderStackRestorationRecord, HostRootOneLevelChildSetCompletionError,
        HostRootOneLevelChildSetCompletionRecord, OffscreenRevealCommitMetadataError,
        OffscreenRevealCommitMetadataRecord, OffscreenVisibilityTransitionCompleteWorkBlockerError,
        OffscreenVisibilityTransitionCompleteWorkBlockerRecord, complete_context_provider_for_test,
        complete_host_root_one_level_child_set_for_test,
        complete_offscreen_visibility_transition_blocker_for_test,
        offscreen_reveal_commit_metadata_for_test, unwind_context_provider_for_test,
    },
    function_component::{
        FunctionComponentContextChangePropagationError,
        FunctionComponentContextChangePropagationRecord,
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
        mount_test_function_component_single_host_child_work, mount_test_host_sibling_work,
        mount_test_host_work,
    },
    root_commit::{
        HostRootContextProviderUpdateCommitHandoffErrorForCanary,
        HostRootContextProviderUpdateCommitHandoffRecordForCanary,
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
        record_context_provider_update_two_consumer_commit_handoff_for_canary,
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

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootCompleteWorkHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    root_child: Option<FiberId>,
    root_child_tag: Option<FiberTag>,
    root_child_count: usize,
    last_root_child: Option<FiberId>,
    last_root_child_tag: Option<FiberTag>,
    completed_child: Option<FiberId>,
    completed_child_tag: Option<FiberTag>,
    completed_child_count: usize,
    last_completed_child: Option<FiberId>,
    last_completed_child_tag: Option<FiberTag>,
    render_lanes: Lanes,
    resulting_element: RootElementHandle,
    detached_instance_count: usize,
    detached_text_count: usize,
}

#[cfg(test)]
impl HostRootCompleteWorkHandoffRecord {
    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn root_child(self) -> Option<FiberId> {
        self.root_child
    }

    #[must_use]
    const fn root_child_tag(self) -> Option<FiberTag> {
        self.root_child_tag
    }

    #[must_use]
    const fn root_child_count(self) -> usize {
        self.root_child_count
    }

    #[must_use]
    const fn last_root_child(self) -> Option<FiberId> {
        self.last_root_child
    }

    #[must_use]
    const fn last_root_child_tag(self) -> Option<FiberTag> {
        self.last_root_child_tag
    }

    #[must_use]
    const fn completed_child(self) -> Option<FiberId> {
        self.completed_child
    }

    #[must_use]
    const fn completed_child_tag(self) -> Option<FiberTag> {
        self.completed_child_tag
    }

    #[must_use]
    const fn completed_child_count(self) -> usize {
        self.completed_child_count
    }

    #[must_use]
    const fn last_completed_child(self) -> Option<FiberId> {
        self.last_completed_child
    }

    #[must_use]
    const fn last_completed_child_tag(self) -> Option<FiberTag> {
        self.last_completed_child_tag
    }

    #[must_use]
    const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    const fn resulting_element(self) -> RootElementHandle {
        self.resulting_element
    }

    #[must_use]
    const fn detached_instance_count(self) -> usize {
        self.detached_instance_count
    }

    #[must_use]
    const fn detached_text_count(self) -> usize {
        self.detached_text_count
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootCompleteWorkHandoffError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    HostWork(HostWorkError),
    ExistingRootChildUnsupported {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    RenderPhaseWorkMismatch {
        root: FiberRootId,
        expected: Option<FiberId>,
        actual: FiberId,
    },
    RenderPhaseLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    RenderPhaseNotCompleted {
        root: FiberRootId,
        status: RootRenderExitStatus,
    },
    UnexpectedExistingRootChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl Display for HostRootCompleteWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::HostWork(error) => Display::fmt(error, formatter),
            Self::ExistingRootChildUnsupported {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} already has child {} ({:?}); private direct host complete-work handoff only admits an empty HostRoot child list",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::RenderPhaseWorkMismatch {
                root,
                expected,
                actual,
            } => {
                if let Some(expected) = expected {
                    write!(
                        formatter,
                        "root {} render phase recorded work fiber slot {}, complete-work handoff requested fiber slot {}",
                        root.raw(),
                        expected.slot().get(),
                        actual.slot().get()
                    )
                } else {
                    write!(
                        formatter,
                        "root {} has no recorded render phase work for complete-work handoff requested fiber slot {}",
                        root.raw(),
                        actual.slot().get()
                    )
                }
            }
            Self::RenderPhaseLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} render phase lanes {:?} do not match complete-work handoff lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::RenderPhaseNotCompleted { root, status } => write!(
                formatter,
                "root {} render phase must be completed before complete-work handoff, found {:?}",
                root.raw(),
                status
            ),
            Self::UnexpectedExistingRootChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} already has child {} with tag {:?}; private host complete-work handoff only admits a fresh root child",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootCompleteWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::HostWork(error) => Some(error),
            Self::ExistingRootChildUnsupported { .. }
            | Self::RenderPhaseWorkMismatch { .. }
            | Self::RenderPhaseLanesMismatch { .. }
            | Self::RenderPhaseNotCompleted { .. }
            | Self::UnexpectedExistingRootChild { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<FiberRootStoreError> for HostRootCompleteWorkHandoffError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for HostRootCompleteWorkHandoffError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError> for HostRootCompleteWorkHandoffError {
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<HostWorkError> for HostRootCompleteWorkHandoffError {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootCompleteWorkCommitHandoffRecord {
    complete_work: HostRootCompleteWorkHandoffRecord,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    placement_apply_diagnostics: Vec<HostRootPlacementApplyDiagnosticForCanary>,
    host_operation_count_after_complete_work: usize,
    host_operation_count_after_commit: usize,
}

#[cfg(test)]
impl HostRootCompleteWorkCommitHandoffRecord {
    #[must_use]
    const fn complete_work(&self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    #[must_use]
    const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }

    #[must_use]
    const fn finished_work_handoff(&self) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    fn placement_apply_diagnostics(&self) -> &[HostRootPlacementApplyDiagnosticForCanary] {
        &self.placement_apply_diagnostics
    }

    #[must_use]
    const fn host_operation_count_after_complete_work(&self) -> usize {
        self.host_operation_count_after_complete_work
    }

    #[must_use]
    const fn host_operation_count_after_commit(&self) -> usize {
        self.host_operation_count_after_commit
    }

    #[must_use]
    const fn host_operations_unchanged_by_commit(&self) -> bool {
        self.host_operation_count_after_complete_work == self.host_operation_count_after_commit
    }

    #[must_use]
    const fn public_render_blocked(&self) -> bool {
        true
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootCompleteWorkCommitHandoffError {
    CompleteWork(HostRootCompleteWorkHandoffError),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
}

#[cfg(test)]
impl Display for HostRootCompleteWorkCommitHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
        }
    }
}

#[cfg(test)]
impl Error for HostRootCompleteWorkCommitHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::CompleteWork(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
        }
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError> for HostRootCompleteWorkCommitHandoffError {
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootCompleteWorkCommitHandoffError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootRenderFinishedWorkCommitMetadataHandoffRecord {
    root: FiberRootId,
    previous_current: FiberId,
    finished_work: FiberId,
    render_lanes: Lanes,
    root_finished_work_before_handoff: Option<FiberId>,
    root_finished_lanes_before_handoff: Lanes,
    root_finished_work_after_handoff: Option<FiberId>,
    root_finished_lanes_after_handoff: Lanes,
    pending_commit: HostRootFinishedWorkPendingCommitRecordForCanary,
}

#[cfg(test)]
impl HostRootRenderFinishedWorkCommitMetadataHandoffRecord {
    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn previous_current(self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    const fn root_finished_work_before_handoff(self) -> Option<FiberId> {
        self.root_finished_work_before_handoff
    }

    #[must_use]
    const fn root_finished_lanes_before_handoff(self) -> Lanes {
        self.root_finished_lanes_before_handoff
    }

    #[must_use]
    const fn root_finished_work_after_handoff(self) -> Option<FiberId> {
        self.root_finished_work_after_handoff
    }

    #[must_use]
    const fn root_finished_lanes_after_handoff(self) -> Lanes {
        self.root_finished_lanes_after_handoff
    }

    #[must_use]
    const fn pending_commit(self) -> HostRootFinishedWorkPendingCommitRecordForCanary {
        self.pending_commit
    }

    #[must_use]
    fn records_completed_render_as_root_finished_work(self) -> bool {
        self.root_finished_work_after_handoff == Some(self.finished_work)
            && self.root_finished_lanes_after_handoff == self.render_lanes
            && self.pending_commit.root_finished_work() == Some(self.finished_work)
            && self.pending_commit.root_finished_lanes() == self.render_lanes
            && self.pending_commit.records_root_finished_work()
    }

    #[must_use]
    const fn host_mutation_blocked(self) -> bool {
        true
    }

    #[must_use]
    const fn public_root_rendering_blocked(self) -> bool {
        true
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootRenderFinishedWorkCommitMetadataHandoffError {
    FiberRootStore(FiberRootStoreError),
    RenderPhaseWorkMismatch {
        root: FiberRootId,
        expected: Option<FiberId>,
        actual: FiberId,
    },
    RenderPhaseLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
    RenderPhaseNotCompleted {
        root: FiberRootId,
        status: RootRenderExitStatus,
    },
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
}

#[cfg(test)]
impl Display for HostRootRenderFinishedWorkCommitMetadataHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::RenderPhaseWorkMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} completed render expected work {:?} before finished-work metadata handoff, found fiber slot {}",
                root.raw(),
                expected.map(|fiber| fiber.slot().get()),
                actual.slot().get()
            ),
            Self::RenderPhaseLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} completed render lanes {:?} do not match finished-work metadata handoff lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::RenderPhaseNotCompleted { root, status } => write!(
                formatter,
                "root {} render phase must be completed before finished-work metadata handoff, found {:?}",
                root.raw(),
                status
            ),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
        }
    }
}

#[cfg(test)]
impl Error for HostRootRenderFinishedWorkCommitMetadataHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
            Self::RenderPhaseWorkMismatch { .. }
            | Self::RenderPhaseLanesMismatch { .. }
            | Self::RenderPhaseNotCompleted { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<FiberRootStoreError> for HostRootRenderFinishedWorkCommitMetadataHandoffError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootRenderFinishedWorkCommitMetadataHandoffError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

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
fn handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    handoff_order: usize,
) -> Result<
    HostRootRenderFinishedWorkCommitMetadataHandoffRecord,
    HostRootRenderFinishedWorkCommitMetadataHandoffError,
> {
    validate_completed_host_root_render_for_finished_work_commit_metadata_handoff(store, render)?;

    let root_id = render.root();
    let (root_finished_work_before_handoff, root_finished_lanes_before_handoff) = {
        let root = store.root(root_id)?;
        (root.finished_work(), root.finished_lanes())
    };
    {
        let root = store.root_mut(root_id)?;
        root.record_finished_work_for_canary(render.finished_work(), render.render_lanes());
    }
    let pending_commit =
        record_host_root_finished_work_pending_commit_for_canary(store, render, handoff_order)?;
    let root = store.root(root_id)?;

    Ok(HostRootRenderFinishedWorkCommitMetadataHandoffRecord {
        root: root_id,
        previous_current: render.current(),
        finished_work: render.finished_work(),
        render_lanes: render.render_lanes(),
        root_finished_work_before_handoff,
        root_finished_lanes_before_handoff,
        root_finished_work_after_handoff: root.finished_work(),
        root_finished_lanes_after_handoff: root.finished_lanes(),
        pending_commit,
    })
}

#[cfg(test)]
fn validate_completed_host_root_render_for_finished_work_commit_metadata_handoff<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), HostRootRenderFinishedWorkCommitMetadataHandoffError> {
    let root_id = render.root();
    let scheduling = store.root(root_id)?.scheduling();

    if scheduling.work_in_progress() != Some(render.work_in_progress()) {
        return Err(
            HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseWorkMismatch {
                root: root_id,
                expected: scheduling.work_in_progress(),
                actual: render.work_in_progress(),
            },
        );
    }

    if scheduling.work_in_progress_root_render_lanes() != render.render_lanes() {
        return Err(
            HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseLanesMismatch {
                root: root_id,
                expected: scheduling.work_in_progress_root_render_lanes(),
                actual: render.render_lanes(),
            },
        );
    }

    if scheduling.render_exit_status() != RootRenderExitStatus::Completed {
        return Err(
            HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseNotCompleted {
                root: root_id,
                status: scheduling.render_exit_status(),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
fn handoff_completed_host_root_render_to_test_complete_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
) -> Result<HostRootCompleteWorkHandoffRecord, HostRootCompleteWorkHandoffError> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    validate_host_root_has_no_existing_child_for_complete_work_handoff(store, render)?;

    let host_work = mount_test_host_work(store, host, render, source)?;
    host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        render.resulting_element(),
        &host_work,
    )
}

#[cfg(test)]
fn handoff_completed_host_root_render_to_test_complete_work_and_commit(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
) -> Result<HostRootCompleteWorkCommitHandoffRecord, HostRootCompleteWorkCommitHandoffError> {
    let complete_work =
        handoff_completed_host_root_render_to_test_complete_work(store, host, render, source)?;
    let host_operation_count_after_complete_work = host.operations().len();
    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store, render, 1, 2,
        )?;
    let host_operation_count_after_commit = host.operations().len();
    let placement_apply_diagnostics = finished_work_handoff
        .commit()
        .host_root_placement_apply_diagnostics_for_canary();

    Ok(HostRootCompleteWorkCommitHandoffRecord {
        complete_work,
        finished_work_handoff,
        placement_apply_diagnostics,
        host_operation_count_after_complete_work,
        host_operation_count_after_commit,
    })
}

#[cfg(test)]
fn handoff_completed_host_root_render_to_test_complete_work_for_siblings(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    source_children: &[RootElementHandle],
) -> Result<HostRootCompleteWorkHandoffRecord, HostRootCompleteWorkHandoffError> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    validate_empty_host_root_child_list_for_complete_work_handoff(store, render)?;

    let host_work = mount_test_host_sibling_work(store, host, render, source, source_children)?;
    host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        render.resulting_element(),
        &host_work,
    )
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootOneLevelChildSetCompleteWorkHandoffRecord {
    begin_work: HostRootOneLevelChildSetBeginWorkRecord,
    child_set_completion: HostRootOneLevelChildSetCompletionRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
}

#[cfg(test)]
impl HostRootOneLevelChildSetCompleteWorkHandoffRecord {
    #[must_use]
    fn begin_work(&self) -> &HostRootOneLevelChildSetBeginWorkRecord {
        &self.begin_work
    }

    #[must_use]
    const fn child_set_completion(&self) -> HostRootOneLevelChildSetCompletionRecord {
        self.child_set_completion
    }

    #[must_use]
    const fn complete_work(&self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    #[must_use]
    const fn kind(&self) -> HostRootOneLevelChildSetKind {
        self.begin_work.kind()
    }

    #[must_use]
    const fn root_element(&self) -> RootElementHandle {
        self.begin_work.root_element()
    }

    #[must_use]
    const fn child_count(&self) -> usize {
        self.begin_work.child_count()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootOneLevelChildSetCompleteWorkHandoffError {
    CompleteWork(HostRootCompleteWorkHandoffError),
    BeginWork(HostRootOneLevelChildSetBeginWorkError),
    ChildSetCompletion(HostRootOneLevelChildSetCompletionError),
    RootElementMismatch {
        render_element: RootElementHandle,
        child_set_element: RootElementHandle,
    },
    MissingTestRootElement {
        element: RootElementHandle,
    },
}

#[cfg(test)]
impl Display for HostRootOneLevelChildSetCompleteWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::BeginWork(error) => Display::fmt(error, formatter),
            Self::ChildSetCompletion(error) => Display::fmt(error, formatter),
            Self::RootElementMismatch {
                render_element,
                child_set_element,
            } => write!(
                formatter,
                "HostRoot render produced element {}, but private one-level child-set handoff was given element {}",
                render_element.raw(),
                child_set_element.raw()
            ),
            Self::MissingTestRootElement { element } => write!(
                formatter,
                "private one-level child-set handoff references missing test host element {}",
                element.raw()
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootOneLevelChildSetCompleteWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::CompleteWork(error) => Some(error),
            Self::BeginWork(error) => Some(error),
            Self::ChildSetCompletion(error) => Some(error),
            Self::RootElementMismatch { .. } | Self::MissingTestRootElement { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError> for HostRootOneLevelChildSetCompleteWorkHandoffError {
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<HostRootOneLevelChildSetBeginWorkError>
    for HostRootOneLevelChildSetCompleteWorkHandoffError
{
    fn from(error: HostRootOneLevelChildSetBeginWorkError) -> Self {
        Self::BeginWork(error)
    }
}

#[cfg(test)]
impl From<HostRootOneLevelChildSetCompletionError>
    for HostRootOneLevelChildSetCompleteWorkHandoffError
{
    fn from(error: HostRootOneLevelChildSetCompletionError) -> Self {
        Self::ChildSetCompletion(error)
    }
}

#[cfg(test)]
fn handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    child_set: &HostRootOneLevelChildSet,
) -> Result<
    HostRootOneLevelChildSetCompleteWorkHandoffRecord,
    HostRootOneLevelChildSetCompleteWorkHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    if render.resulting_element() != child_set.root_element() {
        return Err(
            HostRootOneLevelChildSetCompleteWorkHandoffError::RootElementMismatch {
                render_element: render.resulting_element(),
                child_set_element: child_set.root_element(),
            },
        );
    }
    validate_empty_host_root_child_list_for_complete_work_handoff(store, render)?;
    let begin_work = begin_work_host_root_one_level_child_set(child_set)?;
    for &element in begin_work.children() {
        if source.root(element).is_none() {
            return Err(
                HostRootOneLevelChildSetCompleteWorkHandoffError::MissingTestRootElement {
                    element,
                },
            );
        }
    }

    let host_work =
        mount_test_host_sibling_work(store, host, render, source, begin_work.children())
            .map_err(HostRootCompleteWorkHandoffError::from)?;
    let child_set_completion = complete_host_root_one_level_child_set_for_test(
        store.fiber_arena_mut(),
        render.work_in_progress(),
        begin_work.child_count(),
    )?;
    let complete_work = host_root_complete_work_handoff_record_from_host_work(
        store,
        render,
        render.resulting_element(),
        &host_work,
    )?;

    Ok(HostRootOneLevelChildSetCompleteWorkHandoffRecord {
        begin_work,
        child_set_completion,
        complete_work,
    })
}

#[cfg(test)]
fn validate_host_root_has_no_existing_child_for_complete_work_handoff(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), HostRootCompleteWorkHandoffError> {
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;

    if let Some(child) = validated.child {
        return Err(
            HostRootCompleteWorkHandoffError::UnexpectedExistingRootChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child,
                tag: validated
                    .child_tag
                    .expect("validated child preflight must report a tag"),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
fn host_root_complete_work_handoff_record_from_host_work(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    resulting_element: RootElementHandle,
    host_work: &HostWorkResult,
) -> Result<HostRootCompleteWorkHandoffRecord, HostRootCompleteWorkHandoffError> {
    let root_child = host_work.root_child();
    let root_child_tag = optional_fiber_tag(store, root_child)?;
    let last_root_child = host_work.root_children().last().copied();
    let last_root_child_tag = optional_fiber_tag(store, last_root_child)?;
    let completed_child = host_work.completed_child();
    let completed_child_tag = optional_fiber_tag(store, completed_child)?;
    let last_completed_child = host_work.completed_children().last().copied();
    let last_completed_child_tag = optional_fiber_tag(store, last_completed_child)?;

    Ok(HostRootCompleteWorkHandoffRecord {
        root: host_work.root(),
        host_root_work_in_progress: host_work.work_in_progress(),
        root_child,
        root_child_tag,
        root_child_count: host_work.root_child_count(),
        last_root_child,
        last_root_child_tag,
        completed_child,
        completed_child_tag,
        completed_child_count: host_work.completed_child_count(),
        last_completed_child,
        last_completed_child_tag,
        render_lanes: render.render_lanes(),
        resulting_element,
        detached_instance_count: host_work.detached_instance_count(),
        detached_text_count: host_work.detached_text_count(),
    })
}

#[cfg(test)]
fn validate_empty_host_root_child_list_for_complete_work_handoff(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), HostRootCompleteWorkHandoffError> {
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    if let Some(child) = validated.child {
        return Err(
            HostRootCompleteWorkHandoffError::ExistingRootChildUnsupported {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child,
                tag: validated
                    .child_tag
                    .expect("validated HostRoot child carries a tag"),
            },
        );
    }

    Ok(())
}

#[cfg(test)]
fn optional_fiber_tag(
    store: &FiberRootStore<RecordingHost>,
    fiber: Option<FiberId>,
) -> Result<Option<FiberTag>, HostRootCompleteWorkHandoffError> {
    Ok(fiber
        .map(|fiber| store.fiber_arena().get(fiber).map(|node| node.tag()))
        .transpose()?)
}

#[cfg(test)]
fn validate_completed_host_root_render_for_complete_work_handoff(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), HostRootCompleteWorkHandoffError> {
    let root_id = render.root();
    let scheduling = store.root(root_id)?.scheduling();

    if scheduling.work_in_progress() != Some(render.work_in_progress()) {
        return Err(HostRootCompleteWorkHandoffError::RenderPhaseWorkMismatch {
            root: root_id,
            expected: scheduling.work_in_progress(),
            actual: render.work_in_progress(),
        });
    }

    if scheduling.work_in_progress_root_render_lanes() != render.render_lanes() {
        return Err(HostRootCompleteWorkHandoffError::RenderPhaseLanesMismatch {
            root: root_id,
            expected: scheduling.work_in_progress_root_render_lanes(),
            actual: render.render_lanes(),
        });
    }

    if scheduling.render_exit_status() != RootRenderExitStatus::Completed {
        return Err(HostRootCompleteWorkHandoffError::RenderPhaseNotCompleted {
            root: root_id,
            status: scheduling.render_exit_status(),
        });
    }

    Ok(())
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
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootContextProviderUseContextCompleteWorkHandoffRequest {
    context: ContextHandle,
    value: ContextValueHandle,
}

#[cfg(test)]
impl HostRootContextProviderUseContextCompleteWorkHandoffRequest {
    #[must_use]
    const fn new(context: ContextHandle, value: ContextValueHandle) -> Self {
        Self { context, value }
    }

    #[must_use]
    const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    const fn value(self) -> ContextValueHandle {
        self.value
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootContextProviderUseContextCompleteWorkHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    provider: FiberId,
    function_component: FiberId,
    begin_work: ContextProviderUseContextSingleChildBeginWorkRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
}

#[cfg(test)]
impl HostRootContextProviderUseContextCompleteWorkHandoffRecord {
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
    const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    const fn begin_work(self) -> ContextProviderUseContextSingleChildBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    const fn complete_work(self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    #[must_use]
    const fn child_element(self) -> RootElementHandle {
        self.begin_work.child_element()
    }

    #[must_use]
    const fn child_tag(self) -> FiberTag {
        self.begin_work.child_tag()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootContextProviderUseContextCompleteWorkHandoffError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    ContextProvider(ContextProviderBeginWorkError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    CompletedChildTagMismatch {
        expected: FiberTag,
        actual: Option<FiberTag>,
    },
}

#[cfg(test)]
impl Display for HostRootContextProviderUseContextCompleteWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::ContextProvider(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private context complete-work handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private context complete-work handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::CompletedChildTagMismatch { expected, actual } => write!(
                formatter,
                "private context-provider complete-work handoff resolved {:?}, but complete-work produced {:?}",
                expected, actual
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootContextProviderUseContextCompleteWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::ContextProvider(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. }
            | Self::CompletedChildTagMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootContextProviderUseContextCompleteWorkHandoffError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderBeginWorkError>
    for HostRootContextProviderUseContextCompleteWorkHandoffError
{
    fn from(error: ContextProviderBeginWorkError) -> Self {
        Self::ContextProvider(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootContextProviderUseContextCompleteWorkHandoffError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootContextProviderUseContextPropagationGateRequest {
    context: ContextHandle,
    previous_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
}

#[cfg(test)]
impl HostRootContextProviderUseContextPropagationGateRequest {
    #[must_use]
    const fn new(
        context: ContextHandle,
        previous_value: ContextValueHandle,
        next_value: ContextValueHandle,
        propagation_lanes: Lanes,
    ) -> Self {
        Self {
            context,
            previous_value,
            next_value,
            propagation_lanes,
        }
    }

    #[must_use]
    const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    const fn previous_value(self) -> ContextValueHandle {
        self.previous_value
    }

    #[must_use]
    const fn next_value(self) -> ContextValueHandle {
        self.next_value
    }

    #[must_use]
    const fn propagation_lanes(self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    const fn change(self) -> ContextValueChange {
        ContextValueChange::new(self.context, self.previous_value, self.next_value)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootContextProviderUseContextPropagationGateRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    provider: FiberId,
    function_component: FiberId,
    begin_work: ContextProviderUseContextBeginWorkRecord,
    propagation: FunctionComponentContextChangePropagationRecord,
}

#[cfg(test)]
impl HostRootContextProviderUseContextPropagationGateRecord {
    #[must_use]
    const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn provider(&self) -> FiberId {
        self.provider
    }

    #[must_use]
    const fn function_component(&self) -> FiberId {
        self.function_component
    }

    #[must_use]
    const fn begin_work(&self) -> ContextProviderUseContextBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    const fn propagation(&self) -> &FunctionComponentContextChangePropagationRecord {
        &self.propagation
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootNestedContextProviderTwoConsumerPropagationGateRequest {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
    next_value: ContextValueHandle,
    propagation_lanes: Lanes,
}

#[cfg(test)]
impl HostRootNestedContextProviderTwoConsumerPropagationGateRequest {
    #[must_use]
    #[allow(
        clippy::too_many_arguments,
        reason = "test propagation request constructor mirrors the two-provider evidence shape"
    )]
    const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        render_lanes: Lanes,
        outer_context: ContextHandle,
        outer_value: ContextValueHandle,
        inner_context: ContextHandle,
        inner_value: ContextValueHandle,
        next_value: ContextValueHandle,
        propagation_lanes: Lanes,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            render_lanes,
            outer_context,
            outer_value,
            inner_context,
            inner_value,
            next_value,
            propagation_lanes,
        }
    }

    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }

    #[must_use]
    const fn next_value(self) -> ContextValueHandle {
        self.next_value
    }

    #[must_use]
    const fn propagation_lanes(self) -> Lanes {
        self.propagation_lanes
    }

    #[must_use]
    const fn change(self) -> ContextValueChange {
        ContextValueChange::new(self.inner_context, self.inner_value, self.next_value)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootNestedContextProviderTwoConsumerPropagationGateRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    outer_provider: FiberId,
    inner_provider: FiberId,
    first_function_component: FiberId,
    second_function_component: FiberId,
    begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    first_propagation: FunctionComponentContextChangePropagationRecord,
    second_propagation: FunctionComponentContextChangePropagationRecord,
}

#[cfg(test)]
impl HostRootNestedContextProviderTwoConsumerPropagationGateRecord {
    #[must_use]
    const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(&self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn outer_provider(&self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    const fn inner_provider(&self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    const fn first_function_component(&self) -> FiberId {
        self.first_function_component
    }

    #[must_use]
    const fn second_function_component(&self) -> FiberId {
        self.second_function_component
    }

    #[must_use]
    const fn begin_work(&self) -> NestedContextProviderTwoConsumerUseContextBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    const fn first_propagation(&self) -> &FunctionComponentContextChangePropagationRecord {
        &self.first_propagation
    }

    #[must_use]
    const fn second_propagation(&self) -> &FunctionComponentContextChangePropagationRecord {
        &self.second_propagation
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootContextProviderUseContextPropagationGateError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    ContextProvider(ContextProviderBeginWorkError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    Propagation(FunctionComponentContextChangePropagationError),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootContextProviderUseContextPropagationGateError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderBeginWorkError> for HostRootContextProviderUseContextPropagationGateError {
    fn from(error: ContextProviderBeginWorkError) -> Self {
        Self::ContextProvider(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootContextProviderUseContextPropagationGateError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentContextChangePropagationError>
    for HostRootContextProviderUseContextPropagationGateError
{
    fn from(error: FunctionComponentContextChangePropagationError) -> Self {
        Self::Propagation(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootNestedContextProviderTwoConsumerPropagationGateError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    NestedContextProvider(Box<NestedContextProviderBeginWorkError>),
    CompleteWork(HostRootCompleteWorkHandoffError),
    Propagation(FunctionComponentContextChangePropagationError),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl Display for HostRootNestedContextProviderTwoConsumerPropagationGateError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::NestedContextProvider(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::Propagation(error) => Display::fmt(error, formatter),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private nested multi-consumer context propagation",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private nested multi-consumer context propagation, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootNestedContextProviderTwoConsumerPropagationGateError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::NestedContextProvider(error) => Some(error.as_ref()),
            Self::CompleteWork(error) => Some(error),
            Self::Propagation(error) => Some(error),
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootNestedContextProviderTwoConsumerPropagationGateError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<NestedContextProviderBeginWorkError>
    for HostRootNestedContextProviderTwoConsumerPropagationGateError
{
    fn from(error: NestedContextProviderBeginWorkError) -> Self {
        Self::NestedContextProvider(Box::new(error))
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootNestedContextProviderTwoConsumerPropagationGateError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<FunctionComponentContextChangePropagationError>
    for HostRootNestedContextProviderTwoConsumerPropagationGateError
{
    fn from(error: FunctionComponentContextChangePropagationError) -> Self {
        Self::Propagation(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootContextProviderUseContextCompleteUnwindTraversalRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    provider: FiberId,
    function_component: FiberId,
    begin_work: ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
    stack_depth_after_begin: usize,
    stack_depth_after_host_child_complete: usize,
    provider_complete: ContextProviderStackRestorationRecord,
    complete_work: HostRootCompleteWorkHandoffRecord,
}

#[cfg(test)]
impl HostRootContextProviderUseContextCompleteUnwindTraversalRecord {
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
    const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    const fn begin_work(self) -> ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    const fn stack_depth_after_begin(self) -> usize {
        self.stack_depth_after_begin
    }

    #[must_use]
    const fn stack_depth_after_host_child_complete(self) -> usize {
        self.stack_depth_after_host_child_complete
    }

    #[must_use]
    const fn provider_complete(self) -> ContextProviderStackRestorationRecord {
        self.provider_complete
    }

    #[must_use]
    const fn complete_work(self) -> HostRootCompleteWorkHandoffRecord {
        self.complete_work
    }

    #[must_use]
    const fn child_element(self) -> RootElementHandle {
        self.begin_work.child_element()
    }

    #[must_use]
    const fn child_tag(self) -> FiberTag {
        self.begin_work.child_tag()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootContextProviderUpdateRenderCommitTraversalRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    provider: FiberId,
    function_component: FiberId,
    begin_work: ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
    provider_update: ContextProviderUpdateSingleConsumerLaneRecord,
    stack_depth_after_begin: usize,
    stack_depth_after_provider_update: usize,
    stack_depth_after_host_child_complete: usize,
    provider_complete: ContextProviderStackRestorationRecord,
    complete_commit: HostRootCompleteWorkCommitHandoffRecord,
}

#[cfg(test)]
impl HostRootContextProviderUpdateRenderCommitTraversalRecord {
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
    const fn provider(&self) -> FiberId {
        self.provider
    }

    #[must_use]
    const fn function_component(&self) -> FiberId {
        self.function_component
    }

    #[must_use]
    const fn begin_work(&self) -> ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    const fn provider_update(&self) -> ContextProviderUpdateSingleConsumerLaneRecord {
        self.provider_update
    }

    #[must_use]
    const fn stack_depth_after_begin(&self) -> usize {
        self.stack_depth_after_begin
    }

    #[must_use]
    const fn stack_depth_after_provider_update(&self) -> usize {
        self.stack_depth_after_provider_update
    }

    #[must_use]
    const fn stack_depth_after_host_child_complete(&self) -> usize {
        self.stack_depth_after_host_child_complete
    }

    #[must_use]
    const fn provider_complete(&self) -> ContextProviderStackRestorationRecord {
        self.provider_complete
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
    const fn child_element(&self) -> RootElementHandle {
        self.begin_work.child_element()
    }

    #[must_use]
    const fn child_tag(&self) -> FiberTag {
        self.begin_work.child_tag()
    }

    #[must_use]
    const fn host_operations_unchanged_by_commit(&self) -> bool {
        self.complete_commit.host_operations_unchanged_by_commit()
    }

    #[must_use]
    const fn public_context_compatibility_blocked(&self) -> bool {
        true
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
struct HostRootNestedContextProviderUpdateRenderCommitHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    original_root_element: RootElementHandle,
    outer_provider: FiberId,
    inner_provider: FiberId,
    first_function_component: FiberId,
    second_function_component: FiberId,
    begin_work: NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    provider_update: ContextProviderUpdateTwoConsumerLaneRecord,
    finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
    context_update_commit_handoff: HostRootContextProviderUpdateCommitHandoffRecordForCanary,
}

#[cfg(test)]
impl HostRootNestedContextProviderUpdateRenderCommitHandoffRecord {
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
    const fn outer_provider(&self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    const fn inner_provider(&self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    const fn first_function_component(&self) -> FiberId {
        self.first_function_component
    }

    #[must_use]
    const fn second_function_component(&self) -> FiberId {
        self.second_function_component
    }

    #[must_use]
    const fn begin_work(&self) -> NestedContextProviderTwoConsumerUseContextBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    const fn provider_update(&self) -> ContextProviderUpdateTwoConsumerLaneRecord {
        self.provider_update
    }

    #[must_use]
    const fn finished_work_handoff(&self) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        &self.finished_work_handoff
    }

    #[must_use]
    const fn context_update_commit_handoff(
        &self,
    ) -> &HostRootContextProviderUpdateCommitHandoffRecordForCanary {
        &self.context_update_commit_handoff
    }

    #[must_use]
    const fn commit(&self) -> &HostRootCommitRecord {
        self.finished_work_handoff.commit()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootContextProviderUseContextCompleteUnwindTraversalError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    ContextProvider(ContextProviderBeginWorkError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    ProviderStackRestoration(ContextProviderStackRestorationError),
    ProviderStackUnwindAfterCompleteWorkError {
        complete_error: Box<HostRootCompleteWorkHandoffError>,
        unwind_error: Box<ContextProviderStackRestorationError>,
    },
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    CompletedChildTagMismatch {
        expected: FiberTag,
        actual: Option<FiberTag>,
    },
}

#[cfg(test)]
impl Display for HostRootContextProviderUseContextCompleteUnwindTraversalError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::ContextProvider(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::ProviderStackRestoration(error) => Display::fmt(error, formatter),
            Self::ProviderStackUnwindAfterCompleteWorkError {
                complete_error,
                unwind_error,
            } => write!(
                formatter,
                "private context-provider complete traversal failed ({complete_error}) and provider unwind also failed: {unwind_error}"
            ),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private provider complete/unwind traversal",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private provider complete/unwind traversal, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::CompletedChildTagMismatch { expected, actual } => write!(
                formatter,
                "private context-provider complete/unwind traversal resolved {:?}, but complete-work produced {:?}",
                expected, actual
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootContextProviderUseContextCompleteUnwindTraversalError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::ContextProvider(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::ProviderStackRestoration(error) => Some(error),
            Self::ProviderStackUnwindAfterCompleteWorkError { complete_error, .. } => {
                Some(complete_error.as_ref())
            }
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. }
            | Self::CompletedChildTagMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootContextProviderUseContextCompleteUnwindTraversalError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderBeginWorkError>
    for HostRootContextProviderUseContextCompleteUnwindTraversalError
{
    fn from(error: ContextProviderBeginWorkError) -> Self {
        Self::ContextProvider(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootContextProviderUseContextCompleteUnwindTraversalError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<ContextProviderStackRestorationError>
    for HostRootContextProviderUseContextCompleteUnwindTraversalError
{
    fn from(error: ContextProviderStackRestorationError) -> Self {
        Self::ProviderStackRestoration(error)
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootContextProviderUpdateRenderCommitTraversalError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    ContextProvider(ContextProviderBeginWorkError),
    ContextProviderUpdate(ContextProviderUpdateLaneGateError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    ProviderStackRestoration(ContextProviderStackRestorationError),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    ProviderStackUnwindAfterCompleteWorkError {
        complete_error: Box<HostRootCompleteWorkHandoffError>,
        unwind_error: Box<ContextProviderStackRestorationError>,
    },
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    CompletedChildTagMismatch {
        expected: FiberTag,
        actual: Option<FiberTag>,
    },
}

#[cfg(test)]
impl Display for HostRootContextProviderUpdateRenderCommitTraversalError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::ContextProvider(error) => Display::fmt(error, formatter),
            Self::ContextProviderUpdate(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::ProviderStackRestoration(error) => Display::fmt(error, formatter),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
            Self::ProviderStackUnwindAfterCompleteWorkError {
                complete_error,
                unwind_error,
            } => write!(
                formatter,
                "private context-provider update complete traversal failed ({complete_error}) and provider unwind also failed: {unwind_error}"
            ),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private provider update render/commit traversal",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private provider update render/commit traversal, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::CompletedChildTagMismatch { expected, actual } => write!(
                formatter,
                "private context-provider update render/commit traversal resolved {:?}, but complete-work produced {:?}",
                expected, actual
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootContextProviderUpdateRenderCommitTraversalError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::ContextProvider(error) => Some(error),
            Self::ContextProviderUpdate(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::ProviderStackRestoration(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
            Self::ProviderStackUnwindAfterCompleteWorkError { complete_error, .. } => {
                Some(complete_error.as_ref())
            }
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. }
            | Self::CompletedChildTagMismatch { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderBeginWorkError>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: ContextProviderBeginWorkError) -> Self {
        Self::ContextProvider(error)
    }
}

#[cfg(test)]
impl From<ContextProviderUpdateLaneGateError>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: ContextProviderUpdateLaneGateError) -> Self {
        Self::ContextProviderUpdate(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<ContextProviderStackRestorationError>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: ContextProviderStackRestorationError) -> Self {
        Self::ProviderStackRestoration(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootContextProviderUpdateRenderCommitTraversalError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootNestedContextProviderUpdateRenderCommitHandoffError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    NestedContextProvider(Box<NestedContextProviderBeginWorkError>),
    ContextProviderUpdate(ContextProviderUpdateLaneGateError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    ContextUpdateCommitHandoff(HostRootContextProviderUpdateCommitHandoffErrorForCanary),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl Display for HostRootNestedContextProviderUpdateRenderCommitHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::NestedContextProvider(error) => Display::fmt(error, formatter),
            Self::ContextProviderUpdate(error) => Display::fmt(error, formatter),
            Self::CompleteWork(error) => Display::fmt(error, formatter),
            Self::FinishedWorkCommitHandoff(error) => Display::fmt(error, formatter),
            Self::ContextUpdateCommitHandoff(error) => Display::fmt(error, formatter),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private nested provider update render/commit handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private nested provider update render/commit handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootNestedContextProviderUpdateRenderCommitHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::NestedContextProvider(error) => Some(error.as_ref()),
            Self::ContextProviderUpdate(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::FinishedWorkCommitHandoff(error) => Some(error.as_ref()),
            Self::ContextUpdateCommitHandoff(error) => Some(error),
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<NestedContextProviderBeginWorkError>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: NestedContextProviderBeginWorkError) -> Self {
        Self::NestedContextProvider(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderUpdateLaneGateError>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: ContextProviderUpdateLaneGateError) -> Self {
        Self::ContextProviderUpdate(error)
    }
}

#[cfg(test)]
impl From<HostRootCompleteWorkHandoffError>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: HostRootCompleteWorkHandoffError) -> Self {
        Self::CompleteWork(error)
    }
}

#[cfg(test)]
impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommitHandoff(Box::new(error))
    }
}

#[cfg(test)]
impl From<HostRootContextProviderUpdateCommitHandoffErrorForCanary>
    for HostRootNestedContextProviderUpdateRenderCommitHandoffError
{
    fn from(error: HostRootContextProviderUpdateCommitHandoffErrorForCanary) -> Self {
        Self::ContextUpdateCommitHandoff(error)
    }
}

#[cfg(test)]
fn propagate_host_root_context_provider_use_context_change_for_test(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    request: HostRootContextProviderUseContextPropagationGateRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootContextProviderUseContextPropagationGateRecord,
    HostRootContextProviderUseContextPropagationGateError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    let provider = validated.child.ok_or(
        HostRootContextProviderUseContextPropagationGateError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootContextProviderUseContextPropagationGateError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootContextProviderUseContextPropagationGateError::ExpectedContextProviderChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_context_provider_use_context_child(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(
            provider,
            render.render_lanes(),
            request.context(),
            request.previous_value(),
        ),
        context_store,
        invoker,
    )?;
    let propagation = propagate_context_change_to_function_component_dependencies(
        store,
        context_store,
        begin_work.child_render(),
        FunctionComponentContextChangePropagationRequest::new(
            request.change(),
            request.propagation_lanes(),
        ),
    )?;

    Ok(HostRootContextProviderUseContextPropagationGateRecord {
        root: render.root(),
        host_root_work_in_progress: render.work_in_progress(),
        provider,
        function_component: begin_work.child(),
        begin_work,
        propagation,
    })
}

#[cfg(test)]
fn propagate_host_root_nested_context_provider_two_consumer_use_context_change_for_test(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    request: HostRootNestedContextProviderTwoConsumerPropagationGateRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootNestedContextProviderTwoConsumerPropagationGateRecord,
    HostRootNestedContextProviderTwoConsumerPropagationGateError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        request.root(),
        request.host_root_work_in_progress(),
        request.render_lanes(),
    )?;
    let outer_provider = validated.child.ok_or(
        HostRootNestedContextProviderTwoConsumerPropagationGateError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootNestedContextProviderTwoConsumerPropagationGateError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootNestedContextProviderTwoConsumerPropagationGateError::ExpectedContextProviderChild {
                root: request.root(),
                host_root_work_in_progress: request.host_root_work_in_progress(),
                child: outer_provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_nested_context_provider_two_consumer_use_context_children(
        store.fiber_arena_mut(),
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            request.render_lanes(),
            request.outer_context(),
            request.outer_value(),
            request.inner_context(),
            request.inner_value(),
        ),
        context_store,
        invoker,
    )?;
    let propagation_request = FunctionComponentContextChangePropagationRequest::new(
        request.change(),
        request.propagation_lanes(),
    );
    let first_propagation = propagate_context_change_to_function_component_dependencies(
        store,
        context_store,
        begin_work.first_child_render(),
        propagation_request,
    )?;
    let second_propagation = propagate_context_change_to_function_component_dependencies(
        store,
        context_store,
        begin_work.second_child_render(),
        propagation_request,
    )?;

    Ok(
        HostRootNestedContextProviderTwoConsumerPropagationGateRecord {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
            outer_provider,
            inner_provider: begin_work.inner_provider(),
            first_function_component: begin_work.first_child(),
            second_function_component: begin_work.second_child(),
            begin_work,
            first_propagation,
            second_propagation,
        },
    )
}

#[cfg(test)]
fn handoff_nested_context_provider_two_consumer_update_to_test_render_commit(
    store: &mut FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    request: HostRootNestedContextProviderTwoConsumerPropagationGateRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootNestedContextProviderUpdateRenderCommitHandoffRecord,
    HostRootNestedContextProviderUpdateRenderCommitHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        request.root(),
        request.host_root_work_in_progress(),
        request.render_lanes(),
    )?;
    let outer_provider = validated.child.ok_or(
        HostRootNestedContextProviderUpdateRenderCommitHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootNestedContextProviderUpdateRenderCommitHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootNestedContextProviderUpdateRenderCommitHandoffError::ExpectedContextProviderChild {
                root: request.root(),
                host_root_work_in_progress: request.host_root_work_in_progress(),
                child: outer_provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_nested_context_provider_two_consumer_use_context_children(
        store.fiber_arena_mut(),
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            request.render_lanes(),
            request.outer_context(),
            request.outer_value(),
            request.inner_context(),
            request.inner_value(),
        ),
        context_store,
        invoker,
    )?;
    let provider_update = record_context_provider_update_two_consumer_lane_gate(
        store,
        context_store,
        begin_work,
        ContextProviderUpdateTwoConsumerLaneRequest::new(
            request.root(),
            request.host_root_work_in_progress(),
            begin_work.outer_provider_token(),
            begin_work.inner_provider_token(),
            request.inner_context(),
            request.inner_value(),
            request.next_value(),
            request.propagation_lanes(),
            ContextProviderUpdateDependencyPath::from_begin_work(begin_work),
        ),
    )?;

    let finished_work_handoff =
        commit_completed_host_root_render_with_finished_work_handoff_for_canary(
            store, render, 1, 2,
        )?;
    let context_update_commit_handoff =
        record_context_provider_update_two_consumer_commit_handoff_for_canary(
            store,
            &finished_work_handoff,
            provider_update,
            3,
        )?;

    Ok(
        HostRootNestedContextProviderUpdateRenderCommitHandoffRecord {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
            original_root_element: render.resulting_element(),
            outer_provider,
            inner_provider: begin_work.inner_provider(),
            first_function_component: begin_work.first_child(),
            second_function_component: begin_work.second_child(),
            begin_work,
            provider_update,
            finished_work_handoff,
            context_update_commit_handoff,
        },
    )
}

#[cfg(test)]
fn handoff_completed_context_provider_use_context_child_to_test_complete_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    request: HostRootContextProviderUseContextCompleteWorkHandoffRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootContextProviderUseContextCompleteWorkHandoffRecord,
    HostRootContextProviderUseContextCompleteWorkHandoffError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    let provider = validated.child.ok_or(
        HostRootContextProviderUseContextCompleteWorkHandoffError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootContextProviderUseContextCompleteWorkHandoffError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootContextProviderUseContextCompleteWorkHandoffError::ExpectedContextProviderChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: provider,
                tag: child_tag,
            },
        );
    }

    let resolver = HostRootTestHostTreeFunctionOutputResolver::new(source);
    let begin_work = begin_work_context_provider_use_context_single_child(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(
            provider,
            render.render_lanes(),
            request.context(),
            request.value(),
        ),
        context_store,
        invoker,
        &resolver,
    )?;
    let function_component = begin_work.child();
    let child_element = begin_work.child_element();
    let expected_child_tag = begin_work.child_tag();

    let complete_work = mount_test_context_provider_function_component_single_host_child_work(
        store,
        host,
        render,
        provider,
        function_component,
        child_element,
        source,
    )?;
    if complete_work.completed_child_tag() != Some(expected_child_tag) {
        return Err(
            HostRootContextProviderUseContextCompleteWorkHandoffError::CompletedChildTagMismatch {
                expected: expected_child_tag,
                actual: complete_work.completed_child_tag(),
            },
        );
    }

    Ok(HostRootContextProviderUseContextCompleteWorkHandoffRecord {
        root: render.root(),
        host_root_work_in_progress: render.work_in_progress(),
        original_root_element: render.resulting_element(),
        provider,
        function_component,
        begin_work,
        complete_work,
    })
}

#[cfg(test)]
fn handoff_completed_context_provider_use_context_child_to_test_complete_work_with_provider_unwind(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    request: HostRootContextProviderUseContextCompleteWorkHandoffRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootContextProviderUseContextCompleteUnwindTraversalRecord,
    HostRootContextProviderUseContextCompleteUnwindTraversalError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    let provider = validated.child.ok_or(
        HostRootContextProviderUseContextCompleteUnwindTraversalError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootContextProviderUseContextCompleteUnwindTraversalError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootContextProviderUseContextCompleteUnwindTraversalError::ExpectedContextProviderChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: provider,
                tag: child_tag,
            },
        );
    }

    let resolver = HostRootTestHostTreeFunctionOutputResolver::new(source);
    let begin_work = begin_work_context_provider_use_context_single_child_for_complete_traversal(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(
            provider,
            render.render_lanes(),
            request.context(),
            request.value(),
        ),
        context_store,
        invoker,
        &resolver,
    )?;
    let function_component = begin_work.child();
    let child_element = begin_work.child_element();
    let expected_child_tag = begin_work.child_tag();
    let stack_depth_after_begin = context_store.stack_depth();

    let host_work = mount_test_context_provider_function_component_single_host_child_work_until_provider_complete(
        store,
        host,
        render,
        provider,
        function_component,
        child_element,
        source,
    );
    let host_work = match host_work {
        Ok(host_work) => host_work,
        Err(error) => {
            match unwind_context_provider_for_test(
                store.fiber_arena_mut(),
                context_store,
                begin_work.begin_work(),
            ) {
                Ok(_) => {
                    return Err(
                        HostRootContextProviderUseContextCompleteUnwindTraversalError::CompleteWork(
                            error,
                        ),
                    );
                }
                Err(unwind_error) => {
                    return Err(
                        HostRootContextProviderUseContextCompleteUnwindTraversalError::ProviderStackUnwindAfterCompleteWorkError {
                            complete_error: Box::new(error),
                            unwind_error: Box::new(unwind_error),
                        },
                    );
                }
            }
        }
    };
    let stack_depth_after_host_child_complete = context_store.stack_depth();

    let provider_complete = complete_context_provider_for_test(
        store.fiber_arena_mut(),
        context_store,
        begin_work.begin_work(),
    )?;
    complete_host_root_after_context_provider(store, render.work_in_progress())?;
    let complete_work = host_root_complete_work_handoff_record_from_context_provider_host_work(
        store,
        render,
        provider,
        child_element,
        &host_work,
    )?;
    if complete_work.completed_child_tag() != Some(expected_child_tag) {
        return Err(
            HostRootContextProviderUseContextCompleteUnwindTraversalError::CompletedChildTagMismatch {
                expected: expected_child_tag,
                actual: complete_work.completed_child_tag(),
            },
        );
    }

    Ok(
        HostRootContextProviderUseContextCompleteUnwindTraversalRecord {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
            original_root_element: render.resulting_element(),
            provider,
            function_component,
            begin_work,
            stack_depth_after_begin,
            stack_depth_after_host_child_complete,
            provider_complete,
            complete_work,
        },
    )
}

#[cfg(test)]
fn handoff_context_provider_update_to_test_render_commit_traversal(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    source: &TestHostTree,
    request: HostRootContextProviderUseContextPropagationGateRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootContextProviderUpdateRenderCommitTraversalRecord,
    HostRootContextProviderUpdateRenderCommitTraversalError,
> {
    validate_completed_host_root_render_for_complete_work_handoff(store, render)?;
    let validated = validate_host_root_child_preflight(
        store,
        render.root(),
        render.work_in_progress(),
        render.render_lanes(),
    )?;
    let provider = validated.child.ok_or(
        HostRootContextProviderUpdateRenderCommitTraversalError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootContextProviderUpdateRenderCommitTraversalError::MissingContextProviderChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootContextProviderUpdateRenderCommitTraversalError::ExpectedContextProviderChild {
                root: render.root(),
                host_root_work_in_progress: render.work_in_progress(),
                child: provider,
                tag: child_tag,
            },
        );
    }

    let resolver = HostRootTestHostTreeFunctionOutputResolver::new(source);
    let begin_work = begin_work_context_provider_use_context_single_child_for_complete_traversal(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(
            provider,
            render.render_lanes(),
            request.context(),
            request.previous_value(),
        ),
        context_store,
        invoker,
        &resolver,
    )?;
    let function_component = begin_work.child();
    let child_element = begin_work.child_element();
    let expected_child_tag = begin_work.child_tag();
    let stack_depth_after_begin = context_store.stack_depth();

    let provider_update = record_context_provider_update_single_consumer_lane_gate(
        store,
        context_store,
        begin_work,
        ContextProviderUpdateSingleConsumerLaneRequest::new(
            render.root(),
            render.work_in_progress(),
            begin_work.provider_snapshot(),
            begin_work.provider_token(),
            request.context(),
            request.previous_value(),
            request.next_value(),
            request.propagation_lanes(),
        ),
    )?;
    let stack_depth_after_provider_update = context_store.stack_depth();

    let host_work = mount_test_context_provider_function_component_single_host_child_work_until_provider_complete(
        store,
        host,
        render,
        provider,
        function_component,
        child_element,
        source,
    );
    let host_work = match host_work {
        Ok(host_work) => host_work,
        Err(error) => {
            match unwind_context_provider_for_test(
                store.fiber_arena_mut(),
                context_store,
                begin_work.begin_work(),
            ) {
                Ok(_) => {
                    return Err(
                        HostRootContextProviderUpdateRenderCommitTraversalError::CompleteWork(
                            error,
                        ),
                    );
                }
                Err(unwind_error) => {
                    return Err(
                        HostRootContextProviderUpdateRenderCommitTraversalError::ProviderStackUnwindAfterCompleteWorkError {
                            complete_error: Box::new(error),
                            unwind_error: Box::new(unwind_error),
                        },
                    );
                }
            }
        }
    };
    let stack_depth_after_host_child_complete = context_store.stack_depth();

    let provider_complete = complete_context_provider_for_test(
        store.fiber_arena_mut(),
        context_store,
        begin_work.begin_work(),
    )?;
    complete_host_root_after_context_provider(store, render.work_in_progress())?;
    let complete_work = host_root_complete_work_handoff_record_from_context_provider_host_work(
        store,
        render,
        provider,
        child_element,
        &host_work,
    )?;
    if complete_work.completed_child_tag() != Some(expected_child_tag) {
        return Err(
            HostRootContextProviderUpdateRenderCommitTraversalError::CompletedChildTagMismatch {
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

    Ok(HostRootContextProviderUpdateRenderCommitTraversalRecord {
        root: render.root(),
        host_root_work_in_progress: render.work_in_progress(),
        original_root_element: render.resulting_element(),
        provider,
        function_component,
        begin_work,
        provider_update,
        stack_depth_after_begin,
        stack_depth_after_provider_update,
        stack_depth_after_host_child_complete,
        provider_complete,
        complete_commit: HostRootCompleteWorkCommitHandoffRecord {
            complete_work,
            finished_work_handoff,
            placement_apply_diagnostics,
            host_operation_count_after_complete_work,
            host_operation_count_after_commit,
        },
    })
}

#[cfg(test)]
fn mount_test_context_provider_function_component_single_host_child_work(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    provider: FiberId,
    function_component: FiberId,
    child_element: RootElementHandle,
    source: &TestHostTree,
) -> Result<HostRootCompleteWorkHandoffRecord, HostRootCompleteWorkHandoffError> {
    let host_work =
        mount_test_context_provider_function_component_single_host_child_work_until_provider_complete(
            store,
            host,
            render,
            provider,
            function_component,
            child_element,
            source,
        )?;

    complete_context_provider_function_component_ancestors(
        store,
        render.work_in_progress(),
        provider,
    )?;
    host_root_complete_work_handoff_record_from_context_provider_host_work(
        store,
        render,
        provider,
        child_element,
        &host_work,
    )
}

#[cfg(test)]
fn mount_test_context_provider_function_component_single_host_child_work_until_provider_complete(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    render: HostRootRenderPhaseRecord,
    provider: FiberId,
    function_component: FiberId,
    child_element: RootElementHandle,
    source: &TestHostTree,
) -> Result<HostWorkResult, HostRootCompleteWorkHandoffError> {
    // Reuse the accepted direct FunctionComponent complete-work fixture for the
    // child host work, then put the Provider parent back before the Provider
    // complete/unwind canary restores context.
    store
        .fiber_arena_mut()
        .set_children(provider, &[])
        .map_err(HostRootCompleteWorkHandoffError::from)?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[function_component])
        .map_err(HostRootCompleteWorkHandoffError::from)?;

    let host_work = mount_test_function_component_single_host_child_work(
        store,
        host,
        render,
        function_component,
        child_element,
        source,
    );
    let restore = restore_context_provider_function_component_topology(
        store,
        render.work_in_progress(),
        provider,
        function_component,
    );

    match (host_work, restore) {
        (Ok(host_work), Ok(())) => Ok(host_work),
        (Err(error), Ok(())) => Err(HostRootCompleteWorkHandoffError::from(error)),
        (_, Err(error)) => Err(HostRootCompleteWorkHandoffError::from(error)),
    }
}

#[cfg(test)]
fn restore_context_provider_function_component_topology(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
    provider: FiberId,
    function_component: FiberId,
) -> Result<(), FiberTopologyError> {
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[])?;
    store
        .fiber_arena_mut()
        .set_children(provider, &[function_component])?;
    store
        .fiber_arena_mut()
        .set_children(host_root_work_in_progress, &[provider])?;
    Ok(())
}

#[cfg(test)]
fn complete_context_provider_function_component_ancestors(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
    provider: FiberId,
) -> Result<(), HostRootCompleteWorkHandoffError> {
    let provider_bubbled = bubble_properties(store.fiber_arena(), provider)?;
    {
        let provider_node = store.fiber_arena_mut().get_mut(provider)?;
        provider_node.set_child_lanes(provider_bubbled.child_lanes());
        provider_node.set_subtree_flags(provider_bubbled.subtree_flags());
    }

    let root_bubbled = bubble_properties(store.fiber_arena(), host_root_work_in_progress)?;
    let root_node = store
        .fiber_arena_mut()
        .get_mut(host_root_work_in_progress)?;
    root_node.set_child_lanes(root_bubbled.child_lanes());
    root_node.set_subtree_flags(root_bubbled.subtree_flags());
    Ok(())
}

#[cfg(test)]
fn complete_host_root_after_context_provider(
    store: &mut FiberRootStore<RecordingHost>,
    host_root_work_in_progress: FiberId,
) -> Result<(), HostRootCompleteWorkHandoffError> {
    let root_bubbled = bubble_properties(store.fiber_arena(), host_root_work_in_progress)?;
    let root_node = store
        .fiber_arena_mut()
        .get_mut(host_root_work_in_progress)?;
    root_node.set_child_lanes(root_bubbled.child_lanes());
    root_node.set_subtree_flags(root_bubbled.subtree_flags());
    Ok(())
}

#[cfg(test)]
fn host_root_complete_work_handoff_record_from_context_provider_host_work(
    store: &FiberRootStore<RecordingHost>,
    render: HostRootRenderPhaseRecord,
    provider: FiberId,
    resulting_element: RootElementHandle,
    host_work: &HostWorkResult,
) -> Result<HostRootCompleteWorkHandoffRecord, HostRootCompleteWorkHandoffError> {
    let completed_child = host_work.completed_child();
    let completed_child_tag = optional_fiber_tag(store, completed_child)?;
    let last_completed_child = host_work.completed_children().last().copied();
    let last_completed_child_tag = optional_fiber_tag(store, last_completed_child)?;

    Ok(HostRootCompleteWorkHandoffRecord {
        root: render.root(),
        host_root_work_in_progress: render.work_in_progress(),
        root_child: Some(provider),
        root_child_tag: Some(FiberTag::ContextProvider),
        root_child_count: 1,
        last_root_child: Some(provider),
        last_root_child_tag: Some(FiberTag::ContextProvider),
        completed_child,
        completed_child_tag,
        completed_child_count: host_work.completed_child_count(),
        last_completed_child,
        last_completed_child_tag,
        render_lanes: render.render_lanes(),
        resulting_element,
        detached_instance_count: host_work.detached_instance_count(),
        detached_text_count: host_work.detached_text_count(),
    })
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootContextProviderBeginWorkHandoffRequest {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
    context: ContextHandle,
    value: ContextValueHandle,
}

#[cfg(test)]
impl HostRootContextProviderBeginWorkHandoffRequest {
    #[must_use]
    const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        render_lanes: Lanes,
        context: ContextHandle,
        value: ContextValueHandle,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            render_lanes,
            context,
            value,
        }
    }

    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    const fn value(self) -> ContextValueHandle {
        self.value
    }
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootContextProviderBeginWorkHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    provider: FiberId,
    begin_work: ContextProviderBeginWorkRecord,
}

#[cfg(test)]
impl HostRootContextProviderBeginWorkHandoffRecord {
    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    const fn begin_work(self) -> ContextProviderBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    const fn function_component(self) -> FiberId {
        self.begin_work.child()
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootContextProviderBeginWorkHandoffError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    ContextProvider(ContextProviderBeginWorkError),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl Display for HostRootContextProviderBeginWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::ContextProvider(error) => Display::fmt(error, formatter),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private context handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private context handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootContextProviderBeginWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::ContextProvider(error) => Some(error),
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError> for HostRootContextProviderBeginWorkHandoffError {
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

#[cfg(test)]
impl From<ContextProviderBeginWorkError> for HostRootContextProviderBeginWorkHandoffError {
    fn from(error: ContextProviderBeginWorkError) -> Self {
        Self::ContextProvider(error)
    }
}

#[cfg(test)]
fn handoff_host_root_context_provider_child_begin_work(
    store: &mut FiberRootStore<RecordingHost>,
    request: HostRootContextProviderBeginWorkHandoffRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<
    HostRootContextProviderBeginWorkHandoffRecord,
    HostRootContextProviderBeginWorkHandoffError,
> {
    let validated = validate_host_root_child_preflight(
        store,
        request.root(),
        request.host_root_work_in_progress(),
        request.render_lanes(),
    )?;
    let provider = validated.child.ok_or(
        HostRootContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootContextProviderBeginWorkHandoffError::ExpectedContextProviderChild {
                root: request.root(),
                host_root_work_in_progress: request.host_root_work_in_progress(),
                child: provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_context_provider_child(
        store.fiber_arena_mut(),
        ContextProviderBeginWorkRequest::new(
            provider,
            request.render_lanes(),
            request.context(),
            request.value(),
        ),
        context_store,
        invoker,
    )?;

    Ok(HostRootContextProviderBeginWorkHandoffRecord {
        root: request.root(),
        host_root_work_in_progress: request.host_root_work_in_progress(),
        provider,
        begin_work,
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootNestedContextProviderBeginWorkHandoffRequest {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
}

impl HostRootNestedContextProviderBeginWorkHandoffRequest {
    #[must_use]
    const fn new(
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        render_lanes: Lanes,
        outer_context: ContextHandle,
        outer_value: ContextValueHandle,
        inner_context: ContextHandle,
        inner_value: ContextValueHandle,
    ) -> Self {
        Self {
            root,
            host_root_work_in_progress,
            render_lanes,
            outer_context,
            outer_value,
            inner_context,
            inner_value,
        }
    }

    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootNestedContextProviderBeginWorkHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    outer_provider: FiberId,
    inner_provider: FiberId,
    function_component: FiberId,
    begin_work: NestedContextProviderBeginWorkRecord,
}

impl HostRootNestedContextProviderBeginWorkHandoffRecord {
    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    const fn begin_work(self) -> NestedContextProviderBeginWorkRecord {
        self.begin_work
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootNestedContextProviderUseContextBeginWorkHandoffRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    outer_provider: FiberId,
    inner_provider: FiberId,
    function_component: FiberId,
    begin_work: NestedContextProviderUseContextBeginWorkRecord,
}

impl HostRootNestedContextProviderUseContextBeginWorkHandoffRecord {
    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    const fn function_component(self) -> FiberId {
        self.function_component
    }

    #[must_use]
    const fn begin_work(self) -> NestedContextProviderUseContextBeginWorkRecord {
        self.begin_work
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootNestedContextProviderBeginWorkHandoffError {
    ChildPreflight(Box<HostRootChildBeginWorkPreflightError>),
    NestedContextProvider(Box<NestedContextProviderBeginWorkError>),
    MissingContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
    },
    ExpectedContextProviderChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

impl Display for HostRootNestedContextProviderBeginWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::ChildPreflight(error) => Display::fmt(error, formatter),
            Self::NestedContextProvider(error) => Display::fmt(error, formatter),
            Self::MissingContextProviderChild {
                root,
                host_root_work_in_progress,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} has no ContextProvider child for private nested context handoff",
                root.raw(),
                host_root_work_in_progress.slot().get()
            ),
            Self::ExpectedContextProviderChild {
                root,
                host_root_work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} child {} must be ContextProvider for private nested context handoff, found {:?}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

impl Error for HostRootNestedContextProviderBeginWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::ChildPreflight(error) => Some(error.as_ref()),
            Self::NestedContextProvider(error) => Some(error.as_ref()),
            Self::MissingContextProviderChild { .. }
            | Self::ExpectedContextProviderChild { .. } => None,
        }
    }
}

impl From<HostRootChildBeginWorkPreflightError>
    for HostRootNestedContextProviderBeginWorkHandoffError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(Box::new(error))
    }
}

impl From<NestedContextProviderBeginWorkError>
    for HostRootNestedContextProviderBeginWorkHandoffError
{
    fn from(error: NestedContextProviderBeginWorkError) -> Self {
        Self::NestedContextProvider(Box::new(error))
    }
}

fn handoff_host_root_nested_context_provider_child_begin_work<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    request: HostRootNestedContextProviderBeginWorkHandoffRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<
    HostRootNestedContextProviderBeginWorkHandoffRecord,
    HostRootNestedContextProviderBeginWorkHandoffError,
> {
    let validated = validate_host_root_child_preflight(
        store,
        request.root(),
        request.host_root_work_in_progress(),
        request.render_lanes(),
    )?;
    let outer_provider = validated.child.ok_or(
        HostRootNestedContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootNestedContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootNestedContextProviderBeginWorkHandoffError::ExpectedContextProviderChild {
                root: request.root(),
                host_root_work_in_progress: request.host_root_work_in_progress(),
                child: outer_provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_nested_context_provider_child(
        store.fiber_arena_mut(),
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            request.render_lanes(),
            request.outer_context(),
            request.outer_value(),
            request.inner_context(),
            request.inner_value(),
        ),
        context_store,
        invoker,
    )?;

    Ok(HostRootNestedContextProviderBeginWorkHandoffRecord {
        root: request.root(),
        host_root_work_in_progress: request.host_root_work_in_progress(),
        outer_provider,
        inner_provider: begin_work.inner_provider(),
        function_component: begin_work.child(),
        begin_work,
    })
}

fn handoff_host_root_nested_context_provider_use_context_child_begin_work<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    request: HostRootNestedContextProviderBeginWorkHandoffRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    HostRootNestedContextProviderUseContextBeginWorkHandoffRecord,
    HostRootNestedContextProviderBeginWorkHandoffError,
> {
    let validated = validate_host_root_child_preflight(
        store,
        request.root(),
        request.host_root_work_in_progress(),
        request.render_lanes(),
    )?;
    let outer_provider = validated.child.ok_or(
        HostRootNestedContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    let child_tag = validated.child_tag.ok_or(
        HostRootNestedContextProviderBeginWorkHandoffError::MissingContextProviderChild {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
        },
    )?;
    if child_tag != FiberTag::ContextProvider {
        return Err(
            HostRootNestedContextProviderBeginWorkHandoffError::ExpectedContextProviderChild {
                root: request.root(),
                host_root_work_in_progress: request.host_root_work_in_progress(),
                child: outer_provider,
                tag: child_tag,
            },
        );
    }

    let begin_work = begin_work_nested_context_provider_use_context_child(
        store.fiber_arena_mut(),
        NestedContextProviderBeginWorkRequest::new(
            outer_provider,
            request.render_lanes(),
            request.outer_context(),
            request.outer_value(),
            request.inner_context(),
            request.inner_value(),
        ),
        context_store,
        invoker,
    )?;

    Ok(
        HostRootNestedContextProviderUseContextBeginWorkHandoffRecord {
            root: request.root(),
            host_root_work_in_progress: request.host_root_work_in_progress(),
            outer_provider,
            inner_provider: begin_work.inner_provider(),
            function_component: begin_work.child(),
            begin_work,
        },
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootRenderPhaseRecord {
    root: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    current_update_queue: UpdateQueueHandle,
    work_in_progress_update_queue: UpdateQueueHandle,
    render_lanes: Lanes,
    memoized_state: StateHandle,
    resulting_element: RootElementHandle,
    applied_update_count: usize,
    skipped_update_count: usize,
    remaining_lanes: Lanes,
}

impl HostRootRenderPhaseRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub const fn finished_work(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub const fn current_update_queue(self) -> UpdateQueueHandle {
        self.current_update_queue
    }

    #[must_use]
    pub const fn work_in_progress_update_queue(self) -> UpdateQueueHandle {
        self.work_in_progress_update_queue
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn resulting_element(self) -> RootElementHandle {
        self.resulting_element
    }

    #[must_use]
    pub const fn applied_update_count(self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub const fn skipped_update_count(self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SchedulerCallbackRenderStatus {
    StaleCallback,
    Rendered,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SchedulerCallbackValidationRecord {
    root: FiberRootId,
    requested_callback_node: RootSchedulerCallbackHandle,
    current_callback_node: RootSchedulerCallbackHandle,
    stale: bool,
}

impl SchedulerCallbackValidationRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn requested_callback_node(self) -> RootSchedulerCallbackHandle {
        self.requested_callback_node
    }

    #[must_use]
    pub const fn current_callback_node(self) -> RootSchedulerCallbackHandle {
        self.current_callback_node
    }

    #[must_use]
    pub const fn is_stale(self) -> bool {
        self.stale
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SchedulerCallbackHostRootRenderResult {
    validation: SchedulerCallbackValidationRecord,
    render_phase: Option<HostRootRenderPhaseRecord>,
}

impl SchedulerCallbackHostRootRenderResult {
    #[must_use]
    pub const fn validation(self) -> SchedulerCallbackValidationRecord {
        self.validation
    }

    #[must_use]
    pub const fn render_phase(self) -> Option<HostRootRenderPhaseRecord> {
        self.render_phase
    }

    #[must_use]
    pub const fn status(self) -> SchedulerCallbackRenderStatus {
        if self.render_phase.is_some() {
            SchedulerCallbackRenderStatus::Rendered
        } else {
            SchedulerCallbackRenderStatus::StaleCallback
        }
    }
}

pub fn validate_scheduled_host_root_callback<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    scheduled_callback_node: RootSchedulerCallbackHandle,
) -> Result<SchedulerCallbackValidationRecord, RootWorkLoopError> {
    let current_callback_node = store.root(root_id)?.scheduling().callback_node();
    Ok(SchedulerCallbackValidationRecord {
        root: root_id,
        requested_callback_node: scheduled_callback_node,
        current_callback_node,
        stale: scheduled_callback_node.is_none()
            || current_callback_node != scheduled_callback_node,
    })
}

pub fn render_host_root_via_scheduler_callback<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    scheduled_callback_node: RootSchedulerCallbackHandle,
    render_lanes: Lanes,
) -> Result<SchedulerCallbackHostRootRenderResult, RootWorkLoopError> {
    let validation =
        validate_scheduled_host_root_callback(store, root_id, scheduled_callback_node)?;
    if validation.is_stale() {
        return Ok(SchedulerCallbackHostRootRenderResult {
            validation,
            render_phase: None,
        });
    }

    let render_phase = render_host_root_for_lanes(store, root_id, render_lanes)?;
    Ok(SchedulerCallbackHostRootRenderResult {
        validation,
        render_phase: Some(render_phase),
    })
}

pub fn render_host_root_for_lanes<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    render_lanes: Lanes,
) -> Result<HostRootRenderPhaseRecord, RootWorkLoopError> {
    let current = store.root(root_id)?.current();
    let current_update_queue = store.ensure_host_root_update_queue(root_id)?;
    let work_in_progress = create_host_root_work_in_progress(store, root_id, PropsHandle::NONE)?;
    let work_in_progress_update_queue = refresh_update_queue_for_work_in_progress(
        store,
        root_id,
        current,
        work_in_progress,
        current_update_queue,
    )?;

    let process_result = store.update_queues_mut().process_host_root_update_queue(
        work_in_progress_update_queue,
        Some(current_update_queue),
        render_lanes,
        render_lanes,
    )?;
    let memoized_state = process_result.memoized_state();
    let memoized_state_handle = store.insert_host_root_state(memoized_state);

    {
        let work = store.fiber_arena_mut().get_mut(work_in_progress)?;
        work.set_memoized_state(memoized_state_handle);
        work.set_lanes(process_result.remaining_lanes());
    }

    store
        .root_mut(root_id)?
        .scheduling_mut()
        .record_render_phase_work(
            work_in_progress,
            render_lanes,
            RootRenderExitStatus::Completed,
        );

    Ok(HostRootRenderPhaseRecord {
        root: root_id,
        current,
        work_in_progress,
        current_update_queue,
        work_in_progress_update_queue,
        render_lanes,
        memoized_state: memoized_state_handle,
        resulting_element: memoized_state.element(),
        applied_update_count: process_result.applied_update_count(),
        skipped_update_count: process_result.skipped_update_count(),
        remaining_lanes: process_result.remaining_lanes(),
    })
}

fn refresh_update_queue_for_work_in_progress<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    current_update_queue: UpdateQueueHandle,
) -> Result<UpdateQueueHandle, RootWorkLoopError> {
    if current_update_queue.is_none() {
        return Err(RootWorkLoopError::MissingHostRootUpdateQueue {
            root: root_id,
            fiber: current,
        });
    }

    let cloned_queue = store
        .update_queues_mut()
        .clone_host_root_update_queue(current_update_queue)?;
    store
        .fiber_arena_mut()
        .get_mut(work_in_progress)?
        .set_update_queue(cloned_queue);
    Ok(cloned_queue)
}

#[cfg(test)]
mod tests;
