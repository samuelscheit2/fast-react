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
use fast_react_core::ContextValueChange;
#[cfg(test)]
use fast_react_core::Lane;
#[cfg(test)]
use fast_react_core::bubble_properties;
use fast_react_core::{
    ContextHandle, ContextValueHandle, FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle,
    StateHandle, UpdateQueueHandle,
};
use fast_react_host_config::HostTypes;

#[cfg(test)]
use crate::UpdateId;
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
        BeginWorkError, BeginWorkRequest, BeginWorkResult, NestedContextProviderBeginWorkError,
        NestedContextProviderBeginWorkRecord, NestedContextProviderBeginWorkRequest,
        NestedContextProviderUseContextBeginWorkRecord, UnsupportedActivityChildShapeRecord,
        UnsupportedOffscreenChildShapeRecord, UnsupportedPortalBeginWorkRecord,
        UnsupportedSuspenseChildShapeRecord, UnsupportedSuspenseListChildShapeRecord, begin_work,
        begin_work_nested_context_provider_child,
        begin_work_nested_context_provider_use_context_child,
        unsupported_activity_begin_work_record, unsupported_offscreen_begin_work_record,
        unsupported_portal_begin_work_record, unsupported_suspense_begin_work_record,
        unsupported_suspense_list_begin_work_record,
    },
    create_host_root_work_in_progress,
    function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextRenderStore,
        FunctionComponentInvoker,
    },
    unsupported_features::unsupported_reconciler_feature_for_fiber_tag,
};
#[cfg(test)]
use crate::{
    HostRootCommitRecord,
    begin_work::{
        ContextProviderBeginWorkError, ContextProviderBeginWorkRecord,
        ContextProviderBeginWorkRequest, ContextProviderUseContextBeginWorkRecord,
        ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
        ContextProviderUseContextSingleChildBeginWorkRecord,
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
        begin_work_host_root_one_level_child_set,
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
        FunctionComponentContextChangePropagationRequest, FunctionComponentHookRenderStore,
        FunctionComponentReducerDispatchRequest,
        FunctionComponentReducerDispatchRootRescheduleRecord, FunctionComponentReducerHandle,
        FunctionComponentRenderError, FunctionComponentSingleChildOutput,
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootChildBeginWorkPreflightRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    child: Option<FiberId>,
    child_tag: Option<FiberTag>,
    render_lanes: Lanes,
    begin_work: Option<BeginWorkResult>,
}

impl HostRootChildBeginWorkPreflightRecord {
    #[must_use]
    const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    const fn child(self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    const fn child_tag(self) -> Option<FiberTag> {
        self.child_tag
    }

    #[must_use]
    const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    const fn requires_begin_work(self) -> bool {
        self.begin_work.is_some()
    }

    #[must_use]
    const fn begin_work(self) -> Option<BeginWorkResult> {
        self.begin_work
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum HostRootChildBeginWorkPreflightError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    BeginWork(BeginWorkError),
    ExpectedHostRootWorkInProgress {
        fiber: FiberId,
        tag: FiberTag,
    },
    WorkInProgressNotLinkedToRootCurrent {
        root: FiberRootId,
        current: FiberId,
        work_in_progress: FiberId,
        current_alternate: Option<FiberId>,
        work_in_progress_alternate: Option<FiberId>,
    },
    UnsupportedReconcilerFiberFeature {
        fiber: FiberId,
        tag: FiberTag,
        feature: &'static str,
    },
    UnsupportedPortal {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        portal: Box<UnsupportedPortalBeginWorkRecord>,
    },
    UnsupportedSuspenseChildShape {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        suspense: Box<UnsupportedSuspenseChildShapeRecord>,
    },
    UnsupportedOffscreenChildShape {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        offscreen: Box<UnsupportedOffscreenChildShapeRecord>,
    },
    UnsupportedSuspenseListChildShape {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        suspense_list: Box<UnsupportedSuspenseListChildShapeRecord>,
    },
    UnsupportedActivityChildShape {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        activity: Box<UnsupportedActivityChildShapeRecord>,
    },
}

impl Display for HostRootChildBeginWorkPreflightError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::BeginWork(error) => Display::fmt(error, formatter),
            Self::ExpectedHostRootWorkInProgress { fiber, tag } => write!(
                formatter,
                "fiber {} must be HostRoot work-in-progress for root child begin-work preflight, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::WorkInProgressNotLinkedToRootCurrent {
                root,
                current,
                work_in_progress,
                current_alternate,
                work_in_progress_alternate,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} is not the reciprocal alternate of current {}; current alternate {:?}, work-in-progress alternate {:?}",
                root.raw(),
                work_in_progress.slot().get(),
                current.slot().get(),
                current_alternate.map(|fiber| fiber.slot().get()),
                work_in_progress_alternate.map(|fiber| fiber.slot().get())
            ),
            Self::UnsupportedReconcilerFiberFeature {
                fiber,
                tag,
                feature,
            } => write!(
                formatter,
                "fiber {} has unsupported root work-loop child tag {:?}: {feature}",
                fiber.slot().get(),
                tag
            ),
            Self::UnsupportedPortal {
                root,
                host_root_work_in_progress,
                portal,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} cannot admit portal child {} into root work: {}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                portal.fiber().slot().get(),
                portal.feature()
            ),
            Self::UnsupportedSuspenseChildShape {
                root,
                host_root_work_in_progress,
                suspense,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} cannot admit Suspense child {} shape {} into root work: {}; thenable {}, ping lane {:?}, retry queue {}, primary blocked {}, fallback blocked {}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                suspense.fiber().slot().get(),
                suspense.shape().as_str(),
                suspense.feature(),
                suspense
                    .thenable_ping_blocker()
                    .thenable_identity_class()
                    .as_str(),
                suspense.thenable_ping_blocker().ping_lane(),
                suspense.thenable_ping_blocker().retry_queue_kind().as_str(),
                suspense
                    .thenable_ping_blocker()
                    .primary_child_rendering_blocked(),
                suspense
                    .thenable_ping_blocker()
                    .fallback_child_rendering_blocked()
            ),
            Self::UnsupportedOffscreenChildShape {
                root,
                host_root_work_in_progress,
                offscreen,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} cannot admit Offscreen child {} shape {} into root work: {}; thenable {}, ping lane {:?}, retry queue {}, child rendering blocked {}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                offscreen.fiber().slot().get(),
                offscreen.shape().as_str(),
                offscreen.feature(),
                offscreen
                    .thenable_ping_blocker()
                    .thenable_identity_class()
                    .as_str(),
                offscreen.thenable_ping_blocker().ping_lane(),
                offscreen
                    .thenable_ping_blocker()
                    .retry_queue_kind()
                    .as_str(),
                offscreen
                    .thenable_ping_blocker()
                    .primary_child_rendering_blocked()
            ),
            Self::UnsupportedSuspenseListChildShape {
                root,
                host_root_work_in_progress,
                suspense_list,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} cannot admit SuspenseList child {} shape {} into root work: {}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                suspense_list.fiber().slot().get(),
                suspense_list.shape().as_str(),
                suspense_list.feature()
            ),
            Self::UnsupportedActivityChildShape {
                root,
                host_root_work_in_progress,
                activity,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} cannot admit Activity child {} shape {} into root work: {}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                activity.fiber().slot().get(),
                activity.shape().as_str(),
                activity.feature()
            ),
        }
    }
}

impl Error for HostRootChildBeginWorkPreflightError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::BeginWork(error) => Some(error),
            Self::ExpectedHostRootWorkInProgress { .. }
            | Self::WorkInProgressNotLinkedToRootCurrent { .. }
            | Self::UnsupportedReconcilerFiberFeature { .. }
            | Self::UnsupportedPortal { .. }
            | Self::UnsupportedSuspenseChildShape { .. }
            | Self::UnsupportedOffscreenChildShape { .. }
            | Self::UnsupportedSuspenseListChildShape { .. }
            | Self::UnsupportedActivityChildShape { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for HostRootChildBeginWorkPreflightError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for HostRootChildBeginWorkPreflightError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<BeginWorkError> for HostRootChildBeginWorkPreflightError {
    fn from(error: BeginWorkError) -> Self {
        Self::BeginWork(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct HostRootChildPreflightValidation {
    child: Option<FiberId>,
    child_tag: Option<FiberTag>,
}

fn validate_host_root_child_preflight<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
) -> Result<HostRootChildPreflightValidation, HostRootChildBeginWorkPreflightError> {
    let current = store.root(root_id)?.current();
    let current_alternate = store.fiber_arena().get(current)?.alternate();
    let work_node = store.fiber_arena().get(host_root_work_in_progress)?;
    let work_tag = work_node.tag();
    if work_tag != FiberTag::HostRoot {
        return Err(
            HostRootChildBeginWorkPreflightError::ExpectedHostRootWorkInProgress {
                fiber: host_root_work_in_progress,
                tag: work_tag,
            },
        );
    }

    let work_in_progress_alternate = work_node.alternate();
    if current_alternate != Some(host_root_work_in_progress)
        || work_in_progress_alternate != Some(current)
    {
        return Err(
            HostRootChildBeginWorkPreflightError::WorkInProgressNotLinkedToRootCurrent {
                root: root_id,
                current,
                work_in_progress: host_root_work_in_progress,
                current_alternate,
                work_in_progress_alternate,
            },
        );
    }

    let Some(child) = work_node.child() else {
        return Ok(HostRootChildPreflightValidation {
            child: None,
            child_tag: None,
        });
    };

    let child_tag = store.fiber_arena().get(child)?.tag();
    if child_tag == FiberTag::Portal {
        let portal = unsupported_portal_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(child, render_lanes),
        )?;
        return Err(HostRootChildBeginWorkPreflightError::UnsupportedPortal {
            root: root_id,
            host_root_work_in_progress,
            portal: Box::new(portal),
        });
    }
    if child_tag == FiberTag::Suspense {
        let suspense = unsupported_suspense_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(child, render_lanes),
        )?;
        return Err(
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape {
                root: root_id,
                host_root_work_in_progress,
                suspense: Box::new(suspense),
            },
        );
    }
    if child_tag == FiberTag::Offscreen {
        let offscreen = unsupported_offscreen_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(child, render_lanes),
        )?;
        return Err(
            HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
                root: root_id,
                host_root_work_in_progress,
                offscreen: Box::new(offscreen),
            },
        );
    }
    if child_tag == FiberTag::SuspenseList {
        let suspense_list = unsupported_suspense_list_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(child, render_lanes),
        )?;
        return Err(
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseListChildShape {
                root: root_id,
                host_root_work_in_progress,
                suspense_list: Box::new(suspense_list),
            },
        );
    }
    if child_tag == FiberTag::Activity {
        let activity = unsupported_activity_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(child, render_lanes),
        )?;
        return Err(
            HostRootChildBeginWorkPreflightError::UnsupportedActivityChildShape {
                root: root_id,
                host_root_work_in_progress,
                activity: Box::new(activity),
            },
        );
    }

    if let Some(feature) = unsupported_reconciler_feature_for_fiber_tag(child_tag) {
        return Err(
            HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                fiber: child,
                tag: feature.tag(),
                feature: feature.feature(),
            },
        );
    }

    Ok(HostRootChildPreflightValidation {
        child: Some(child),
        child_tag: Some(child_tag),
    })
}

fn preflight_host_root_child_begin_work<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<HostRootChildBeginWorkPreflightRecord, HostRootChildBeginWorkPreflightError> {
    let validated = validate_host_root_child_preflight(
        store,
        root_id,
        host_root_work_in_progress,
        render_lanes,
    )?;
    let Some(child) = validated.child else {
        return Ok(HostRootChildBeginWorkPreflightRecord {
            root: root_id,
            host_root_work_in_progress,
            child: None,
            child_tag: None,
            render_lanes,
            begin_work: None,
        });
    };

    let begin_work = begin_work(
        store.fiber_arena_mut(),
        BeginWorkRequest::new(child, render_lanes),
        invoker,
    )?;

    Ok(HostRootChildBeginWorkPreflightRecord {
        root: root_id,
        host_root_work_in_progress,
        child: Some(child),
        child_tag: validated.child_tag,
        render_lanes,
        begin_work: Some(begin_work),
    })
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
mod tests {
    use super::*;
    use crate::begin_work::{
        BeginWorkError, FragmentSingleHostChildBeginWorkError,
        PORTAL_RECONCILER_UNSUPPORTED_FEATURE,
    };
    use crate::complete_work::{
        HostComponentManagedChildCompleteWorkRecordForCanary,
        HostComponentManagedChildMutationKindForCanary,
        HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
        host_component_managed_child_complete_work_record_for_canary,
        host_component_managed_child_sibling_order_complete_work_record_for_canary,
    };
    use crate::concurrent_updates::{
        enqueue_concurrent_host_root_update, finish_queueing_concurrent_updates,
    };
    use crate::context::{
        ContextProviderUpdateDependencyPath, ContextProviderUpdateTwoConsumerLaneRequest,
        record_context_provider_update_two_consumer_lane_gate,
    };
    use crate::function_component::{
        FunctionComponentContextReadRecord, FunctionComponentContextRenderReader,
        FunctionComponentContextRenderStore, FunctionComponentEffectPhase,
        FunctionComponentHookRenderStore, FunctionComponentInvocationError,
        FunctionComponentInvocationRequest, FunctionComponentOutputHandle,
        FunctionComponentRenderError, FunctionComponentSingleChildOutput,
        FunctionComponentSingleChildOutputResolver,
        FunctionComponentSingleChildReconciliationError, FunctionComponentStateDispatchRequest,
    };
    use crate::host_nodes::HostNodeViolation;
    use crate::host_work::{
        DetachedHostRecords, TestHostComponentPropertyPayloadKind,
        TestHostRootDeletionCleanupAction, TestHostRootDeletionCleanupApplyResult,
        TestHostRootDeletionCleanupStatus, TestHostRootDeletionRefPassiveCleanupExecutionPhase,
        TestHostRootDeletionTeardownExecutionErrorForCanary,
        TestHostRootHostUpdateExecutionErrorForCanary,
        TestHostRootManagedChildExecutionDiagnosticForCanary,
        TestHostRootManagedChildSiblingOrderExecutionDiagnosticForCanary,
        TestHostRootMutationApplyResult, TestHostRootMutationApplyStatus,
        TestHostRootMutationHostCall, TestHostRootPrivateStoreMutation,
        apply_managed_child_complete_work_handoff_for_canary,
        apply_managed_child_sibling_order_complete_work_handoff_for_canary,
        apply_one_test_host_update_with_finished_work_handoff_for_canary,
        apply_test_host_root_commit_mutations_for_canary,
        apply_test_host_root_deletion_cleanup_for_canary,
        create_detached_test_host_component_for_existing_fiber_for_canary,
        create_detached_test_host_text_for_existing_fiber_for_canary,
        delete_test_host_root_sibling_child_for_canary,
        execute_test_host_root_deletion_teardown_after_commit_for_canary,
        mount_test_host_sibling_work_with_detached_hosts_for_canary,
        preflight_test_host_root_deletion_apply_and_cleanup_for_canary,
        test_host_root_deletion_teardown_execution_request_for_canary,
        update_test_host_root_component_with_text_child_work_with_detached_hosts_for_canary,
        update_test_host_root_sibling_text_child_work_for_canary,
        update_test_host_root_work_with_detached_hosts_for_canary,
    };
    use crate::passive_effects::{
        DeletedSubtreeRefCleanupReturnExecutionRequest, DeletedSubtreeRefCleanupReturnExecutor,
        PassiveEffectDestroyCallbackErrorHandle, PassiveEffectDestroyCallbackExecutionRequest,
        PassiveEffectDestroyCallbackExecutor,
    };
    use crate::root_commit::{
        FunctionComponentDeletedSubtreePendingPassiveCommitHandoff,
        HostRootManagedChildCommitExecutionBlockerForCanary,
        HostRootManagedChildCommitExecutionStatusForCanary,
        HostRootManagedChildCommitHandoffRecordForCanary,
        HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary,
        HostRootMutationApplyRecordKind, HostRootMutationApplyRecordSource,
        HostRootMutationPhaseRecordKind, HostRootPlacementSiblingStatus,
        commit_managed_child_complete_work_handoff_for_canary,
        commit_managed_child_sibling_order_complete_work_handoff_for_canary,
        queue_function_component_deleted_subtree_pending_passive_effects,
    };
    use crate::root_updates::validate_update_container_lane_diagnostics_for_canary;
    use crate::test_support::{FakeContainer, RecordingHost, TestHostNode, TestHostTree};
    use crate::unsupported_features::{
        ACTIVITY_UNSUPPORTED_FEATURE, OFFSCREEN_UNSUPPORTED_FEATURE,
        SUSPENSE_LIST_UNSUPPORTED_FEATURE, SUSPENSE_UNSUPPORTED_FEATURE,
        VIEW_TRANSITION_UNSUPPORTED_FEATURE,
    };
    use crate::{
        ExecutionContextState, HostRootHydrationState, MUTATION_RENDER_PLACEHOLDER_FEATURE,
        PendingChildrenHandle, PendingCommitHandle, ReconcilerError, RootContextHandle,
        RootElementHandle, RootHydrationCallbacksHandle, RootKind, RootOptions,
        RootSchedulerCallbackExecutionStatus, RootSuspenseBoundarySetHandle,
        RootTaskScheduleOutcome, RootTransitionCallbacksHandle, RootUpdateCallbackHandle,
        RootUpdateError, RootUpdateLaneSourcePriority, RootUpdatePayload, SchedulerCallbackRequest,
        commit_finished_host_root, ensure_root_is_scheduled, execute_scheduled_root_callback,
        flush_sync_work_on_all_roots, process_root_schedule_in_microtask, update_container,
        update_container_sync,
    };
    use fast_react_core::{
        ContextHandle, ContextValueHandle, DeletionListId, DependenciesHandle, ElementTypeHandle,
        EventPriority, FiberFlags, FiberMode, FiberTag, FiberTypeHandle, HookEffectCallbackHandle,
        HookEffectDependencies, HookUpdateLane, Lane, Lanes, PropsHandle, ReactKey, RefHandle,
        RootFinishedLanes, StateHandle, StateNodeHandle, UpdateQueueHandle,
    };

    const ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_SOURCE_ORDER: usize = 826_001;
    const ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_COMMIT_ORDER: usize = 826_002;
    const ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_REQUEST_ORDER: usize = 826_003;
    const ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_SOURCE_ORDER: usize = 826_011;
    const ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER: usize = 826_012;
    const ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER: usize = 826_013;
    const ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_SOURCE_ORDER: usize = 826_021;
    const ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_COMMIT_ORDER: usize = 826_022;
    const ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_REQUEST_ORDER: usize = 826_023;
    const ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_SOURCE_ORDER: usize = 867_001;
    const ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER: usize = 867_002;
    const ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER: usize = 867_003;
    const ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER: usize = 862_001;
    const ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER: usize = 862_002;
    const ROOT_WORK_LOOP_MULTICHILD_UPDATE_SOURCE_ORDER: usize = 878_001;
    const ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER: usize = 878_002;
    const ROOT_WORK_LOOP_MULTICHILD_DELETE_SOURCE_ORDER: usize = 878_011;
    const ROOT_WORK_LOOP_MULTICHILD_DELETE_COMMIT_ORDER: usize = 878_012;

    #[derive(Debug, Clone)]
    struct RegisteredComponent {
        component: FiberTypeHandle,
        result: Result<FunctionComponentOutputHandle, FunctionComponentInvocationError>,
    }

    #[derive(Debug, Default)]
    struct TestFunctionComponentRegistry {
        components: Vec<RegisteredComponent>,
        calls: Vec<FunctionComponentInvocationRequest>,
    }

    impl TestFunctionComponentRegistry {
        fn register(
            &mut self,
            component: FiberTypeHandle,
            result: Result<FunctionComponentOutputHandle, FunctionComponentInvocationError>,
        ) {
            self.components
                .push(RegisteredComponent { component, result });
        }

        fn calls(&self) -> &[FunctionComponentInvocationRequest] {
            &self.calls
        }
    }

    impl FunctionComponentInvoker for TestFunctionComponentRegistry {
        fn invoke_function_component(
            &mut self,
            request: FunctionComponentInvocationRequest,
        ) -> Result<FunctionComponentOutputHandle, FunctionComponentInvocationError> {
            self.calls.push(request);
            self.components
                .iter()
                .find(|component| component.component == request.component())
                .map(|component| component.result.clone())
                .unwrap_or_else(|| {
                    Err(FunctionComponentInvocationError::component_error(
                        "missing test component registration",
                    ))
                })
        }
    }

    #[derive(Debug, Clone, Copy)]
    enum UseContextBehavior {
        ReadOnce { context: ContextHandle },
        ReadTwice { context: ContextHandle },
    }

    #[derive(Debug, Clone, Copy)]
    struct RegisteredUseContextComponent {
        component: FiberTypeHandle,
        behavior: UseContextBehavior,
    }

    #[derive(Debug)]
    struct TestUseContextComponentRegistry {
        components: Vec<RegisteredUseContextComponent>,
        calls: Vec<FunctionComponentInvocationRequest>,
        reads: Vec<FunctionComponentContextReadRecord>,
    }

    impl TestUseContextComponentRegistry {
        fn new(component: FiberTypeHandle, behavior: UseContextBehavior) -> Self {
            let mut registry = Self {
                components: Vec::new(),
                calls: Vec::new(),
                reads: Vec::new(),
            };
            registry.register(component, behavior);
            registry
        }

        fn register(&mut self, component: FiberTypeHandle, behavior: UseContextBehavior) {
            self.components.push(RegisteredUseContextComponent {
                component,
                behavior,
            });
        }

        fn calls(&self) -> &[FunctionComponentInvocationRequest] {
            &self.calls
        }

        fn reads(&self) -> &[FunctionComponentContextReadRecord] {
            &self.reads
        }
    }

    impl FunctionComponentContextConsumerInvoker for TestUseContextComponentRegistry {
        fn invoke_function_component_context_consumer(
            &mut self,
            request: FunctionComponentInvocationRequest,
            reader: &mut FunctionComponentContextRenderReader<'_>,
        ) -> Result<FunctionComponentOutputHandle, FunctionComponentRenderError> {
            self.calls.push(request);
            let Some(component) = self
                .components
                .iter()
                .find(|component| component.component == request.component())
            else {
                return Err(FunctionComponentRenderError::Invocation {
                    fiber: request.fiber(),
                    component: request.component(),
                    error: FunctionComponentInvocationError::component_error(
                        "missing use_context test component registration",
                    ),
                });
            };

            match component.behavior {
                UseContextBehavior::ReadOnce { context } => {
                    let read = reader.use_context(context)?;
                    self.reads.push(read);
                    Ok(FunctionComponentOutputHandle::from_raw(read.value().raw()))
                }
                UseContextBehavior::ReadTwice { context } => {
                    let first = reader.use_context(context)?;
                    let second = reader.read_context(context)?;
                    self.reads.push(first);
                    self.reads.push(second);
                    Ok(FunctionComponentOutputHandle::from_raw(
                        second.value().raw(),
                    ))
                }
            }
        }
    }

    #[derive(Debug)]
    struct TestHostTreeFunctionOutputResolver<'a> {
        source: &'a TestHostTree,
    }

    impl TestHostTreeFunctionOutputResolver<'_> {
        fn new(source: &TestHostTree) -> TestHostTreeFunctionOutputResolver<'_> {
            TestHostTreeFunctionOutputResolver { source }
        }
    }

    impl FunctionComponentSingleChildOutputResolver for TestHostTreeFunctionOutputResolver<'_> {
        fn resolve_function_component_single_child_output(
            &self,
            output: FunctionComponentOutputHandle,
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

    #[derive(Debug)]
    struct StaticSingleChildOutputResolver {
        child: FunctionComponentSingleChildOutput,
    }

    impl StaticSingleChildOutputResolver {
        const fn new(child: FunctionComponentSingleChildOutput) -> Self {
            Self { child }
        }
    }

    impl FunctionComponentSingleChildOutputResolver for StaticSingleChildOutputResolver {
        fn resolve_function_component_single_child_output(
            &self,
            _output: FunctionComponentOutputHandle,
        ) -> Option<FunctionComponentSingleChildOutput> {
            Some(self.child)
        }
    }

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    fn assert_single_function_component_container_append(
        apply: &TestHostRootMutationApplyResult,
        root_id: FiberRootId,
        finished_work: FiberId,
        child: FiberId,
        tag: FiberTag,
    ) {
        assert_eq!(apply.root(), root_id);
        assert_eq!(apply.finished_work(), finished_work);
        assert_eq!(apply.records().len(), 1);
        assert_eq!(apply.records()[0].mutation().fiber(), child);
        assert_eq!(apply.records()[0].mutation().tag(), tag);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToContainer
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
            )
        );
        assert_eq!(apply.applied_host_call_count(), 1);
        assert_eq!(apply.private_host_store_update_count(), 0);
    }

    #[derive(Debug)]
    struct FunctionComponentSingleChildCommitFixture {
        render: HostRootRenderPhaseRecord,
        function_component: FiberId,
        single_child: FunctionComponentSingleChildReconciliationRecord,
        complete_work: HostRootCompleteWorkHandoffRecord,
        finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
        host_work: HostWorkResult,
    }

    fn function_component_single_child_commit_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        source: &TestHostTree,
        root_element: RootElementHandle,
        child_element: RootElementHandle,
    ) -> FunctionComponentSingleChildCommitFixture {
        update_container(store, root_id, root_element, None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let (_current_child, function_component, component) =
            attach_function_component_wip_child(store, render.work_in_progress());
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(source);
        let begin_work = begin_work_reconcile_function_component_single_child(
            store.fiber_arena_mut(),
            BeginWorkRequest::new(function_component, render.render_lanes()),
            &mut registry,
            &resolver,
        )
        .unwrap();
        let single_child = begin_work.single_child();
        let host_work = mount_test_function_component_single_host_child_work(
            store,
            host,
            render,
            function_component,
            single_child.child_element(),
            source,
        )
        .unwrap();
        let complete_work = host_root_complete_work_handoff_record_from_host_work(
            store,
            render,
            single_child.child_element(),
            &host_work,
        )
        .unwrap();
        let order = root_element.raw() as usize;
        let finished_work_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                store,
                render,
                order,
                order + 1,
            )
            .unwrap();

        FunctionComponentSingleChildCommitFixture {
            render,
            function_component,
            single_child,
            complete_work,
            finished_work_handoff,
            host_work,
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct ManagedChildSiblingOrderRootWorkLoopFixture {
        render: HostRootRenderPhaseRecord,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
        current_parent: FiberId,
        work_parent: FiberId,
        child: FiberId,
        order_sibling: FiberId,
        order_sibling_current: FiberId,
        parent_state_node: StateNodeHandle,
        child_state_node: StateNodeHandle,
        order_sibling_state_node: StateNodeHandle,
        parent_props: PropsHandle,
        child_props: PropsHandle,
        order_sibling_props: PropsHandle,
        previous_current: FiberId,
        deletion_list: Option<DeletionListId>,
    }

    struct ManagedChildRootWorkLoopHostExecutionFixture {
        render: HostRootRenderPhaseRecord,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        complete_work: HostComponentManagedChildCompleteWorkRecordForCanary,
        current_parent: FiberId,
        work_parent: FiberId,
        child: FiberId,
        parent_state_node: StateNodeHandle,
        child_state_node: StateNodeHandle,
        previous_current: FiberId,
        detached_hosts: DetachedHostRecords,
        operations_before_apply: Vec<&'static str>,
        token_count_before_apply: usize,
    }

    struct ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
        render: HostRootRenderPhaseRecord,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        complete_work: HostComponentManagedChildSiblingOrderCompleteWorkRecordForCanary,
        current_parent: FiberId,
        work_parent: FiberId,
        child: FiberId,
        order_sibling: FiberId,
        order_sibling_current: FiberId,
        parent_state_node: StateNodeHandle,
        child_state_node: StateNodeHandle,
        order_sibling_state_node: StateNodeHandle,
        previous_current: FiberId,
        deletion_list: Option<DeletionListId>,
        detached_hosts: DetachedHostRecords,
        operations_before_apply: Vec<&'static str>,
        token_count_before_apply: usize,
    }

    struct DeletedSubtreeRootWorkLoopTeardownFixture {
        delete_render: HostRootRenderPhaseRecord,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        previous_current: FiberId,
        work_parent: FiberId,
        deletion_list: DeletionListId,
        host_parent_state_node: StateNodeHandle,
        deleted_host: FiberId,
        deleted_host_state_node: StateNodeHandle,
        deleted_host_ref: RefHandle,
        deleted_function: FiberId,
        deleted_text: FiberId,
        deleted_text_state_node: StateNodeHandle,
        passive_create: HookEffectCallbackHandle,
        passive_destroy: HookEffectCallbackHandle,
        passive_dependencies: HookEffectDependencies,
        deleted_passive_handoff: FunctionComponentDeletedSubtreePendingPassiveCommitHandoff,
        detached_hosts: DetachedHostRecords,
        operations_before_teardown: Vec<&'static str>,
    }

    #[derive(Default)]
    struct RecordingDeletedSubtreeTeardownExecutor {
        ref_cleanup_calls: Vec<DeletedSubtreeRefCleanupReturnExecutionRequest>,
        destroy_calls: Vec<PassiveEffectDestroyCallbackExecutionRequest>,
    }

    impl RecordingDeletedSubtreeTeardownExecutor {
        fn ref_cleanup_calls(&self) -> &[DeletedSubtreeRefCleanupReturnExecutionRequest] {
            &self.ref_cleanup_calls
        }

        fn destroy_calls(&self) -> &[PassiveEffectDestroyCallbackExecutionRequest] {
            &self.destroy_calls
        }
    }

    impl DeletedSubtreeRefCleanupReturnExecutor for RecordingDeletedSubtreeTeardownExecutor {
        fn execute_deleted_ref_cleanup_return(
            &mut self,
            request: DeletedSubtreeRefCleanupReturnExecutionRequest,
        ) {
            self.ref_cleanup_calls.push(request);
        }
    }

    impl PassiveEffectDestroyCallbackExecutor for RecordingDeletedSubtreeTeardownExecutor {
        fn execute_destroy_callback(
            &mut self,
            request: PassiveEffectDestroyCallbackExecutionRequest,
        ) -> Result<(), PassiveEffectDestroyCallbackErrorHandle> {
            self.destroy_calls.push(request);
            Ok(())
        }
    }

    fn root_work_loop_hook_callback(raw: u64) -> HookEffectCallbackHandle {
        HookEffectCallbackHandle::from_raw(raw)
    }

    fn root_work_loop_hook_dependencies(raw: u64) -> HookEffectDependencies {
        HookEffectDependencies::array(DependenciesHandle::from_raw(raw))
    }

    fn attach_managed_child_sibling_order_host_root_child(
        store: &mut FiberRootStore<RecordingHost>,
        host_root: FiberId,
        state_node: StateNodeHandle,
        pending_props: PropsHandle,
        memoized_props: PropsHandle,
    ) -> FiberId {
        let mode = store.fiber_arena().get(host_root).unwrap().mode();
        let child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            pending_props,
            mode,
        );
        {
            let node = store.fiber_arena_mut().get_mut(child).unwrap();
            node.set_state_node(state_node);
            node.set_memoized_props(memoized_props);
        }
        store
            .fiber_arena_mut()
            .set_children(host_root, &[child])
            .unwrap();
        child
    }

    fn bubble_managed_child_sibling_order_root_work_loop_fiber(
        store: &mut FiberRootStore<RecordingHost>,
        fiber: FiberId,
    ) {
        let bubbled = bubble_properties(store.fiber_arena(), fiber).unwrap();
        let node = store.fiber_arena_mut().get_mut(fiber).unwrap();
        node.set_child_lanes(bubbled.child_lanes());
        node.set_subtree_flags(bubbled.subtree_flags());
    }

    fn prepare_root_work_loop_managed_child_pending_commit(
        store: &mut FiberRootStore<RecordingHost>,
        render: HostRootRenderPhaseRecord,
        handoff_order: usize,
    ) -> HostRootFinishedWorkPendingCommitRecordForCanary {
        store
            .root_mut(render.root())
            .unwrap()
            .record_finished_work_for_canary(render.finished_work(), render.render_lanes());
        record_host_root_finished_work_pending_commit_for_canary(store, render, handoff_order)
            .unwrap()
    }

    fn prepare_root_work_loop_deleted_subtree_teardown_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        raw: u64,
    ) -> DeletedSubtreeRootWorkLoopTeardownFixture {
        let mut detached_hosts = DetachedHostRecords::new_for_canary();
        let mut hook_store = FunctionComponentHookRenderStore::new();

        update_container(store, root_id, RootElementHandle::from_raw(raw), None).unwrap();
        let create_render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let host_root = create_render.finished_work();
        let mode = store.fiber_arena().get(host_root).unwrap().mode();

        let text_props = PropsHandle::from_raw(raw + 1);
        let deleted_text =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostText, None, text_props, mode);
        let deleted_text_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            deleted_text,
            "root work loop deleted passive text",
            text_props,
        )
        .unwrap();

        let function_props = PropsHandle::from_raw(raw + 2);
        let deleted_function = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            function_props,
            mode,
        );
        {
            let node = store.fiber_arena_mut().get_mut(deleted_function).unwrap();
            node.set_fiber_type(FiberTypeHandle::from_raw(raw + 3));
        }
        store
            .fiber_arena_mut()
            .set_children(deleted_function, &[deleted_text])
            .unwrap();
        let passive_create = root_work_loop_hook_callback(raw + 4);
        let passive_destroy = root_work_loop_hook_callback(raw + 5);
        let passive_dependencies = root_work_loop_hook_dependencies(raw + 6);
        hook_store
            .create_current_effect_metadata(
                store.fiber_arena_mut(),
                deleted_function,
                FunctionComponentEffectPhase::Passive,
                passive_create,
                passive_dependencies,
                Some(passive_destroy),
            )
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, deleted_function);

        let deleted_host_props = PropsHandle::from_raw(raw + 7);
        let deleted_host = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            deleted_host_props,
            mode,
        );
        let deleted_host_ref = RefHandle::from_raw(raw + 8);
        {
            let node = store.fiber_arena_mut().get_mut(deleted_host).unwrap();
            node.set_ref_handle(deleted_host_ref);
        }
        store
            .fiber_arena_mut()
            .set_children(deleted_host, &[deleted_function])
            .unwrap();
        let deleted_host_state_node =
            create_detached_test_host_component_for_existing_fiber_for_canary(
                store,
                host,
                &mut detached_hosts,
                root_id,
                deleted_host,
                "article",
                deleted_host_props,
                &[deleted_text],
            )
            .unwrap();

        let host_parent_props = PropsHandle::from_raw(raw + 9);
        let host_parent = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            host_parent_props,
            mode,
        );
        {
            let node = store.fiber_arena_mut().get_mut(host_parent).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
        }
        store
            .fiber_arena_mut()
            .set_children(host_parent, &[deleted_host])
            .unwrap();
        let host_parent_state_node =
            create_detached_test_host_component_for_existing_fiber_for_canary(
                store,
                host,
                &mut detached_hosts,
                root_id,
                host_parent,
                "section",
                host_parent_props,
                &[deleted_host],
            )
            .unwrap();

        store
            .fiber_arena_mut()
            .set_children(host_root, &[host_parent])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, host_root);
        commit_finished_host_root(store, create_render).unwrap();

        update_container(store, root_id, RootElementHandle::from_raw(raw + 10), None).unwrap();
        let delete_render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let previous_current = delete_render.current();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(host_parent, host_parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_lanes(Lanes::NO);
            node.set_memoized_props(host_parent_props);
        }
        let deletion_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(work_parent, deleted_host)
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(delete_render.finished_work(), &[work_parent])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(
            store,
            delete_render.finished_work(),
        );
        let deleted_passive_handoff =
            queue_function_component_deleted_subtree_pending_passive_effects(
                store,
                root_id,
                &hook_store,
                work_parent,
                deleted_host,
                Lanes::DEFAULT,
            )
            .unwrap();
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            delete_render,
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_SOURCE_ORDER,
        );
        let operations_before_teardown = host.operations();

        DeletedSubtreeRootWorkLoopTeardownFixture {
            delete_render,
            pending,
            previous_current,
            work_parent,
            deletion_list,
            host_parent_state_node,
            deleted_host,
            deleted_host_state_node,
            deleted_host_ref,
            deleted_function,
            deleted_text,
            deleted_text_state_node,
            passive_create,
            passive_destroy,
            passive_dependencies,
            deleted_passive_handoff,
            detached_hosts,
            operations_before_teardown,
        }
    }

    fn prepare_root_work_loop_managed_child_append_execution_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        raw: u64,
    ) -> ManagedChildRootWorkLoopHostExecutionFixture {
        let mut detached_hosts = DetachedHostRecords::new_for_canary();
        let current_root = store.root(root_id).unwrap().current();
        let parent_props = PropsHandle::from_raw(raw + 1);
        let child_props = PropsHandle::from_raw(raw + 2);
        let mode = store.fiber_arena().get(current_root).unwrap().mode();

        let current_parent =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
        let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            current_parent,
            "section",
            parent_props,
            &[],
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_root, &[current_parent])
            .unwrap();

        update_container(store, root_id, RootElementHandle::from_raw(raw + 3), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }
        let child =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, child_props, mode);
        store
            .fiber_arena_mut()
            .get_mut(child)
            .unwrap()
            .set_flags(FiberFlags::PLACEMENT);
        let child_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            child,
            "span",
            child_props,
            &[],
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[child])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, child);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

        let complete_work = host_component_managed_child_complete_work_record_for_canary(
            store.fiber_arena(),
            root_id,
            work_parent,
            child,
            HostComponentManagedChildMutationKindForCanary::Placement,
        )
        .unwrap();
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            render,
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_SOURCE_ORDER,
        );
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        ManagedChildRootWorkLoopHostExecutionFixture {
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            parent_state_node,
            child_state_node,
            previous_current,
            detached_hosts,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    fn prepare_root_work_loop_managed_child_placement_sibling_order_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        raw: u64,
    ) -> ManagedChildSiblingOrderRootWorkLoopFixture {
        let current_root = store.root(root_id).unwrap().current();
        let parent_state_node = StateNodeHandle::from_raw(raw + 1);
        let child_state_node = StateNodeHandle::from_raw(raw + 2);
        let order_sibling_state_node = StateNodeHandle::from_raw(raw + 3);
        let parent_props = PropsHandle::from_raw(raw + 4);
        let child_props = PropsHandle::from_raw(raw + 5);
        let order_sibling_props = PropsHandle::from_raw(raw + 6);
        let current_parent = attach_managed_child_sibling_order_host_root_child(
            store,
            current_root,
            parent_state_node,
            parent_props,
            parent_props,
        );
        let mode = store.fiber_arena().get(current_parent).unwrap().mode();
        let order_sibling_current = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            order_sibling_props,
            mode,
        );
        {
            let node = store
                .fiber_arena_mut()
                .get_mut(order_sibling_current)
                .unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
        }
        store
            .fiber_arena_mut()
            .set_children(current_parent, &[order_sibling_current])
            .unwrap();

        update_container(store, root_id, RootElementHandle::from_raw(raw + 7), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }
        let child =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, child_props, mode);
        {
            let node = store.fiber_arena_mut().get_mut(child).unwrap();
            node.set_flags(FiberFlags::PLACEMENT);
            node.set_state_node(child_state_node);
            node.set_memoized_props(child_props);
        }
        let order_sibling = store
            .fiber_arena_mut()
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
            node.set_lanes(Lanes::NO);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[child, order_sibling])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, child);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

        let complete_work =
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                store.fiber_arena(),
                root_id,
                work_parent,
                child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::Placement,
            )
            .unwrap();
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            render,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_SOURCE_ORDER,
        );
        let previous_current = store.root(root_id).unwrap().current();

        ManagedChildSiblingOrderRootWorkLoopFixture {
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            order_sibling,
            order_sibling_current,
            parent_state_node,
            child_state_node,
            order_sibling_state_node,
            parent_props,
            child_props,
            order_sibling_props,
            previous_current,
            deletion_list: None,
        }
    }

    fn prepare_root_work_loop_managed_child_delete_sibling_order_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        raw: u64,
    ) -> ManagedChildSiblingOrderRootWorkLoopFixture {
        let current_root = store.root(root_id).unwrap().current();
        let parent_state_node = StateNodeHandle::from_raw(raw + 1);
        let child_state_node = StateNodeHandle::from_raw(raw + 2);
        let order_sibling_state_node = StateNodeHandle::from_raw(raw + 3);
        let parent_props = PropsHandle::from_raw(raw + 4);
        let child_props = PropsHandle::from_raw(raw + 5);
        let order_sibling_props = PropsHandle::from_raw(raw + 6);
        let current_parent = attach_managed_child_sibling_order_host_root_child(
            store,
            current_root,
            parent_state_node,
            parent_props,
            parent_props,
        );
        let mode = store.fiber_arena().get(current_parent).unwrap().mode();
        let order_sibling_current = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            order_sibling_props,
            mode,
        );
        let child =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, child_props, mode);
        {
            let node = store
                .fiber_arena_mut()
                .get_mut(order_sibling_current)
                .unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
        }
        {
            let node = store.fiber_arena_mut().get_mut(child).unwrap();
            node.set_state_node(child_state_node);
            node.set_memoized_props(child_props);
        }
        store
            .fiber_arena_mut()
            .set_children(current_parent, &[order_sibling_current, child])
            .unwrap();

        update_container(store, root_id, RootElementHandle::from_raw(raw + 7), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }
        let order_sibling = store
            .fiber_arena_mut()
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
            node.set_lanes(Lanes::NO);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[order_sibling])
            .unwrap();
        let deletion_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(work_parent, child)
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

        let complete_work =
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                store.fiber_arena(),
                root_id,
                work_parent,
                child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::DeleteDetach,
            )
            .unwrap();
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            render,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_SOURCE_ORDER,
        );
        let previous_current = store.root(root_id).unwrap().current();

        ManagedChildSiblingOrderRootWorkLoopFixture {
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            order_sibling,
            order_sibling_current,
            parent_state_node,
            child_state_node,
            order_sibling_state_node,
            parent_props,
            child_props,
            order_sibling_props,
            previous_current,
            deletion_list: Some(deletion_list),
        }
    }

    fn prepare_root_work_loop_managed_child_placement_sibling_order_execution_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        raw: u64,
    ) -> ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
        let mut detached_hosts = DetachedHostRecords::new_for_canary();
        let current_root = store.root(root_id).unwrap().current();
        let parent_props = PropsHandle::from_raw(raw + 1);
        let child_props = PropsHandle::from_raw(raw + 2);
        let order_sibling_props = PropsHandle::from_raw(raw + 3);
        let mode = store.fiber_arena().get(current_root).unwrap().mode();

        let current_parent =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
        let order_sibling_current = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            order_sibling_props,
            mode,
        );
        let order_sibling_state_node =
            create_detached_test_host_component_for_existing_fiber_for_canary(
                store,
                host,
                &mut detached_hosts,
                root_id,
                order_sibling_current,
                "strong",
                order_sibling_props,
                &[],
            )
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_parent, &[order_sibling_current])
            .unwrap();
        let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            current_parent,
            "section",
            parent_props,
            &[order_sibling_current],
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_root, &[current_parent])
            .unwrap();

        update_container(store, root_id, RootElementHandle::from_raw(raw + 4), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }
        let child =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, child_props, mode);
        store
            .fiber_arena_mut()
            .get_mut(child)
            .unwrap()
            .set_flags(FiberFlags::PLACEMENT);
        let child_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            child,
            "span",
            child_props,
            &[],
        )
        .unwrap();
        let order_sibling = store
            .fiber_arena_mut()
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
            node.set_lanes(Lanes::NO);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[child, order_sibling])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, child);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

        let complete_work =
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                store.fiber_arena(),
                root_id,
                work_parent,
                child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::Placement,
            )
            .unwrap();
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            render,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_SOURCE_ORDER,
        );
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            order_sibling,
            order_sibling_current,
            parent_state_node,
            child_state_node,
            order_sibling_state_node,
            previous_current,
            deletion_list: None,
            detached_hosts,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    fn prepare_root_work_loop_managed_child_delete_sibling_order_execution_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        raw: u64,
    ) -> ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
        let mut detached_hosts = DetachedHostRecords::new_for_canary();
        let current_root = store.root(root_id).unwrap().current();
        let parent_props = PropsHandle::from_raw(raw + 1);
        let child_props = PropsHandle::from_raw(raw + 2);
        let order_sibling_props = PropsHandle::from_raw(raw + 3);
        let mode = store.fiber_arena().get(current_root).unwrap().mode();

        let current_parent =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
        let order_sibling_current = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            order_sibling_props,
            mode,
        );
        let child =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, child_props, mode);
        let order_sibling_state_node =
            create_detached_test_host_component_for_existing_fiber_for_canary(
                store,
                host,
                &mut detached_hosts,
                root_id,
                order_sibling_current,
                "strong",
                order_sibling_props,
                &[],
            )
            .unwrap();
        let child_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            child,
            "span",
            child_props,
            &[],
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_parent, &[order_sibling_current, child])
            .unwrap();
        let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            current_parent,
            "section",
            parent_props,
            &[order_sibling_current, child],
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_root, &[current_parent])
            .unwrap();

        update_container(store, root_id, RootElementHandle::from_raw(raw + 4), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }
        let order_sibling = store
            .fiber_arena_mut()
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
            node.set_lanes(Lanes::NO);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[order_sibling])
            .unwrap();
        let deletion_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(work_parent, child)
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

        let complete_work =
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                store.fiber_arena(),
                root_id,
                work_parent,
                child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::DeleteDetach,
            )
            .unwrap();
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            render,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_SOURCE_ORDER,
        );
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            order_sibling,
            order_sibling_current,
            parent_state_node,
            child_state_node,
            order_sibling_state_node,
            previous_current,
            deletion_list: Some(deletion_list),
            detached_hosts,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    fn prepare_root_work_loop_managed_child_text_append_execution_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        raw: u64,
    ) -> ManagedChildRootWorkLoopHostExecutionFixture {
        let mut detached_hosts = DetachedHostRecords::new_for_canary();
        let current_root = store.root(root_id).unwrap().current();
        let parent_props = PropsHandle::from_raw(raw + 1);
        let child_props = PropsHandle::from_raw(raw + 2);
        let mode = store.fiber_arena().get(current_root).unwrap().mode();

        let current_parent =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
        let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            current_parent,
            "section",
            parent_props,
            &[],
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_root, &[current_parent])
            .unwrap();

        update_container(store, root_id, RootElementHandle::from_raw(raw + 3), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }
        let child =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostText, None, child_props, mode);
        store
            .fiber_arena_mut()
            .get_mut(child)
            .unwrap()
            .set_flags(FiberFlags::PLACEMENT);
        let child_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            child,
            "managed text append",
            child_props,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[child])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, child);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

        let complete_work = host_component_managed_child_complete_work_record_for_canary(
            store.fiber_arena(),
            root_id,
            work_parent,
            child,
            HostComponentManagedChildMutationKindForCanary::Placement,
        )
        .unwrap();
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            render,
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_SOURCE_ORDER,
        );
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        ManagedChildRootWorkLoopHostExecutionFixture {
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            parent_state_node,
            child_state_node,
            previous_current,
            detached_hosts,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    fn prepare_root_work_loop_managed_child_text_placement_sibling_order_execution_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        raw: u64,
    ) -> ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
        let mut detached_hosts = DetachedHostRecords::new_for_canary();
        let current_root = store.root(root_id).unwrap().current();
        let parent_props = PropsHandle::from_raw(raw + 1);
        let child_props = PropsHandle::from_raw(raw + 2);
        let order_sibling_props = PropsHandle::from_raw(raw + 3);
        let mode = store.fiber_arena().get(current_root).unwrap().mode();

        let current_parent =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
        let order_sibling_current = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            order_sibling_props,
            mode,
        );
        let order_sibling_state_node =
            create_detached_test_host_text_for_existing_fiber_for_canary(
                store,
                host,
                &mut detached_hosts,
                root_id,
                order_sibling_current,
                "managed stable text",
                order_sibling_props,
            )
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_parent, &[order_sibling_current])
            .unwrap();
        let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            current_parent,
            "section",
            parent_props,
            &[order_sibling_current],
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_root, &[current_parent])
            .unwrap();

        update_container(store, root_id, RootElementHandle::from_raw(raw + 4), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }
        let child =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostText, None, child_props, mode);
        store
            .fiber_arena_mut()
            .get_mut(child)
            .unwrap()
            .set_flags(FiberFlags::PLACEMENT);
        let child_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            child,
            "managed inserted text",
            child_props,
        )
        .unwrap();
        let order_sibling = store
            .fiber_arena_mut()
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
            node.set_lanes(Lanes::NO);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[child, order_sibling])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, child);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

        let complete_work =
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                store.fiber_arena(),
                root_id,
                work_parent,
                child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::Placement,
            )
            .unwrap();
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            render,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_SOURCE_ORDER,
        );
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            order_sibling,
            order_sibling_current,
            parent_state_node,
            child_state_node,
            order_sibling_state_node,
            previous_current,
            deletion_list: None,
            detached_hosts,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    fn prepare_root_work_loop_managed_child_text_delete_sibling_order_execution_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        raw: u64,
    ) -> ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
        let mut detached_hosts = DetachedHostRecords::new_for_canary();
        let current_root = store.root(root_id).unwrap().current();
        let parent_props = PropsHandle::from_raw(raw + 1);
        let child_props = PropsHandle::from_raw(raw + 2);
        let order_sibling_props = PropsHandle::from_raw(raw + 3);
        let mode = store.fiber_arena().get(current_root).unwrap().mode();

        let current_parent =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostComponent, None, parent_props, mode);
        let order_sibling_current = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            order_sibling_props,
            mode,
        );
        let child =
            store
                .fiber_arena_mut()
                .create_fiber(FiberTag::HostText, None, child_props, mode);
        let order_sibling_state_node =
            create_detached_test_host_text_for_existing_fiber_for_canary(
                store,
                host,
                &mut detached_hosts,
                root_id,
                order_sibling_current,
                "managed kept text",
                order_sibling_props,
            )
            .unwrap();
        let child_state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            child,
            "managed deleted text",
            child_props,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_parent, &[order_sibling_current, child])
            .unwrap();
        let parent_state_node = create_detached_test_host_component_for_existing_fiber_for_canary(
            store,
            host,
            &mut detached_hosts,
            root_id,
            current_parent,
            "section",
            parent_props,
            &[order_sibling_current, child],
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(current_root, &[current_parent])
            .unwrap();

        update_container(store, root_id, RootElementHandle::from_raw(raw + 4), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let work_parent = store
            .fiber_arena_mut()
            .create_work_in_progress(current_parent, parent_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(work_parent).unwrap();
            node.set_state_node(parent_state_node);
            node.set_memoized_props(parent_props);
            node.set_lanes(Lanes::NO);
        }
        let order_sibling = store
            .fiber_arena_mut()
            .create_work_in_progress(order_sibling_current, order_sibling_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(order_sibling).unwrap();
            node.set_state_node(order_sibling_state_node);
            node.set_memoized_props(order_sibling_props);
            node.set_lanes(Lanes::NO);
        }
        store
            .fiber_arena_mut()
            .set_children(work_parent, &[order_sibling])
            .unwrap();
        let deletion_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(work_parent, child)
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, order_sibling);
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, work_parent);
        store
            .fiber_arena_mut()
            .set_children(render.finished_work(), &[work_parent])
            .unwrap();
        bubble_managed_child_sibling_order_root_work_loop_fiber(store, render.finished_work());

        let complete_work =
            host_component_managed_child_sibling_order_complete_work_record_for_canary(
                store.fiber_arena(),
                root_id,
                work_parent,
                child,
                order_sibling,
                HostComponentManagedChildMutationKindForCanary::DeleteDetach,
            )
            .unwrap();
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            render,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_SOURCE_ORDER,
        );
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_apply = host.operations();
        let token_count_before_apply = store.host_tokens().len();

        ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture {
            render,
            pending,
            complete_work,
            current_parent,
            work_parent,
            child,
            order_sibling,
            order_sibling_current,
            parent_state_node,
            child_state_node,
            order_sibling_state_node,
            previous_current,
            deletion_list: Some(deletion_list),
            detached_hosts,
            operations_before_apply,
            token_count_before_apply,
        }
    }

    fn assert_root_work_loop_managed_child_sibling_order_handoff_common(
        store: &FiberRootStore<RecordingHost>,
        host: &RecordingHost,
        root_id: FiberRootId,
        fixture: ManagedChildSiblingOrderRootWorkLoopFixture,
        handoff: &HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary,
        commit_order: usize,
        request_order: usize,
    ) {
        let request = *handoff.execution_request();
        let finished_work_handoff = handoff.finished_work_handoff();

        assert_eq!(fixture.previous_current, fixture.render.current());
        assert_eq!(fixture.complete_work.root(), root_id);
        assert_eq!(
            fixture.complete_work.parent_current(),
            fixture.current_parent
        );
        assert_eq!(
            fixture.complete_work.parent_work_in_progress(),
            fixture.work_parent
        );
        assert_eq!(
            fixture.complete_work.parent_state_node(),
            fixture.parent_state_node
        );
        assert_eq!(fixture.complete_work.child(), fixture.child);
        assert_eq!(
            fixture.complete_work.child_state_node(),
            fixture.child_state_node
        );
        assert_eq!(
            fixture.complete_work.child_pending_props(),
            fixture.child_props
        );
        assert_eq!(
            fixture.complete_work.child_memoized_props(),
            fixture.child_props
        );
        assert_eq!(fixture.complete_work.order_sibling(), fixture.order_sibling);
        assert_eq!(
            fixture.complete_work.order_sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert_eq!(
            fixture.complete_work.order_sibling_pending_props(),
            fixture.order_sibling_props
        );
        assert_eq!(
            fixture.complete_work.order_sibling_memoized_props(),
            fixture.order_sibling_props
        );
        assert_eq!(
            fixture.complete_work.order_sibling_alternate(),
            Some(fixture.order_sibling_current)
        );
        assert!(fixture.complete_work.private_reconciler_handoff_only());
        assert!(!fixture.complete_work.public_dom_compatibility_claimed());
        assert!(!fixture.complete_work.test_renderer_compatibility_claimed());
        assert!(
            !fixture
                .complete_work
                .broad_reconciliation_traversal_claimed()
        );

        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.finished_work(), fixture.render.finished_work());
        assert_eq!(handoff.complete_work(), fixture.complete_work);
        assert_eq!(
            handoff.source_handoff_order(),
            fixture.pending.handoff_order()
        );
        assert_eq!(handoff.commit_order(), commit_order);
        assert_eq!(handoff.request_order(), request_order);
        assert_eq!(handoff.kind(), fixture.complete_work.kind());
        assert_eq!(handoff.order_sibling(), fixture.order_sibling);
        assert_eq!(
            handoff.order_sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert_eq!(
            handoff.order_evidence_name(),
            fixture.complete_work.order_evidence_name()
        );
        assert!(handoff.complete_metadata_matches_mutation());
        assert!(handoff.private_test_host_mutation_allowed());
        assert!(handoff.public_root_rendering_blocked());
        assert!(handoff.public_renderer_mutation_blocked());
        assert!(!handoff.public_dom_compatibility_claimed());
        assert!(!handoff.test_renderer_compatibility_claimed());

        assert_eq!(request.root(), root_id);
        assert_eq!(request.root_token(), root_id.state_node_handle());
        assert_eq!(request.previous_current(), fixture.previous_current);
        assert_eq!(request.finished_work(), fixture.render.finished_work());
        assert_eq!(request.committed_current(), fixture.render.finished_work());
        assert_eq!(
            request.source_handoff_order(),
            fixture.pending.handoff_order()
        );
        assert_eq!(request.commit_order(), commit_order);
        assert_eq!(request.request_order(), request_order);
        assert_eq!(request.mutation_index(), 0);
        assert_eq!(request.complete_work(), fixture.complete_work);
        assert_eq!(
            request.status(),
            HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation
        );
        assert!(request.private_test_host_mutation_allowed());
        assert!(request.public_root_rendering_blocked());
        assert!(request.public_renderer_mutation_blocked());
        assert!(!request.public_dom_compatibility_claimed());
        assert!(!request.test_renderer_compatibility_claimed());
        assert!(!request.hydration_events_refs_resources_forms_claimed());
        assert!(
            request.blockers().contains(
                &HostRootManagedChildCommitExecutionBlockerForCanary::PublicRootRendering
            )
        );
        assert!(request.blockers().contains(
            &HostRootManagedChildCommitExecutionBlockerForCanary::PublicRendererHostMutation
        ));
        assert!(request.blockers().contains(
            &HostRootManagedChildCommitExecutionBlockerForCanary::ReactDomManagedChildCompatibilityClaim
        ));
        assert!(request.blockers().contains(
            &HostRootManagedChildCommitExecutionBlockerForCanary::ReactTestRendererCompatibilityClaim
        ));
        assert!(request.blockers().contains(
            &HostRootManagedChildCommitExecutionBlockerForCanary::HydrationEventsRefsResourcesFormsControlledInputClaim
        ));
        assert!(request.blockers().contains(
            &HostRootManagedChildCommitExecutionBlockerForCanary::PublicCompatibilityClaim
        ));

        assert_eq!(finished_work_handoff.pending(), fixture.pending);
        assert_eq!(
            finished_work_handoff.pending().root_finished_work(),
            Some(fixture.render.finished_work())
        );
        assert_eq!(
            finished_work_handoff.pending().root_finished_lanes(),
            fixture.render.render_lanes()
        );
        assert!(finished_work_handoff.pending().records_finished_work());
        assert!(finished_work_handoff.pending().records_root_finished_work());
        assert_eq!(finished_work_handoff.commit_order(), commit_order);
        assert!(finished_work_handoff.commit_order_after_pending_record());
        assert_eq!(
            finished_work_handoff.current_after_commit(),
            fixture.render.finished_work()
        );
        assert_eq!(finished_work_handoff.finished_work_after_commit(), None);
        assert_eq!(
            finished_work_handoff.finished_lanes_after_commit(),
            Lanes::NO
        );
        assert_eq!(finished_work_handoff.render_phase_work_after_commit(), None);
        assert!(finished_work_handoff.consumed_finished_work_record());
        assert!(finished_work_handoff.mutation_execution_blocked());
        assert!(finished_work_handoff.public_root_rendering_blocked());
        assert!(finished_work_handoff.effects_refs_and_hydration_blocked());
        assert!(finished_work_handoff.proves_private_root_finished_work_commit_metadata_handoff());

        let commit = handoff.commit();
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), fixture.previous_current);
        assert_eq!(commit.current(), fixture.render.finished_work());
        assert_eq!(commit.finished_work(), fixture.render.finished_work());
        assert_eq!(commit.finished_lanes(), fixture.render.render_lanes());
        assert_eq!(commit.pending_lanes(), fixture.render.remaining_lanes());
        assert_eq!(commit.mutation_apply_log().len(), 1);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            fixture.render.finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            None
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .render_exit_status(),
            RootRenderExitStatus::NoWork
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    fn assert_root_work_loop_managed_child_append_host_execution(
        store: &FiberRootStore<RecordingHost>,
        host: &RecordingHost,
        root_id: FiberRootId,
        fixture: &ManagedChildRootWorkLoopHostExecutionFixture,
        handoff: &HostRootManagedChildCommitHandoffRecordForCanary,
        diagnostic: &TestHostRootManagedChildExecutionDiagnosticForCanary,
    ) {
        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.finished_work(), fixture.render.finished_work());
        assert_eq!(handoff.complete_work(), fixture.complete_work);
        assert_eq!(fixture.previous_current, fixture.render.current());
        assert_eq!(
            handoff.execution_request().previous_current(),
            fixture.previous_current
        );
        assert_eq!(
            handoff.source_handoff_order(),
            fixture.pending.handoff_order()
        );
        assert_eq!(
            handoff.commit_order(),
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_COMMIT_ORDER
        );
        assert_eq!(
            handoff.request_order(),
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_REQUEST_ORDER
        );
        assert_eq!(
            handoff.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert!(handoff.private_test_host_mutation_allowed());
        assert!(handoff.public_root_rendering_blocked());
        assert!(handoff.public_renderer_mutation_blocked());
        assert!(!handoff.public_dom_compatibility_claimed());
        assert!(!handoff.test_renderer_compatibility_claimed());

        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(diagnostic.finished_work(), fixture.render.finished_work());
        assert_eq!(
            diagnostic.source_handoff_order(),
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_SOURCE_ORDER
        );
        assert_eq!(
            diagnostic.commit_order(),
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_COMMIT_ORDER
        );
        assert_eq!(
            diagnostic.request_order(),
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_REQUEST_ORDER
        );
        assert_eq!(
            diagnostic.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(diagnostic.mutation(), handoff.mutation());
        assert_eq!(
            diagnostic.mutation_status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
        );
        assert_eq!(diagnostic.cleanup_status(), None);
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(diagnostic.deletion_cleanup_apply_count(), 0);
        assert!(diagnostic.private_test_host_mutation_executed());
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(diagnostic.public_renderer_mutation_blocked());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

        assert_eq!(
            store.root(root_id).unwrap().current(),
            fixture.render.finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            None
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .render_exit_status(),
            RootRenderExitStatus::NoWork
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.work_parent)
                .unwrap()
                .alternate(),
            Some(fixture.current_parent)
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(store.host_tokens().len(), fixture.token_count_before_apply);
        let mut expected_operations = fixture.operations_before_apply.clone();
        expected_operations.push("append_child");
        assert_eq!(host.operations(), expected_operations);
    }

    fn assert_root_work_loop_managed_child_sibling_order_host_execution(
        store: &FiberRootStore<RecordingHost>,
        host: &RecordingHost,
        root_id: FiberRootId,
        fixture: &ManagedChildSiblingOrderRootWorkLoopHostExecutionFixture,
        handoff: &HostRootManagedChildSiblingOrderCommitHandoffRecordForCanary,
        diagnostic: &TestHostRootManagedChildSiblingOrderExecutionDiagnosticForCanary,
        expected_status: TestHostRootMutationApplyStatus,
        expected_operation: &'static str,
        expected_cleanup_count: usize,
        expected_token_count_after_apply: usize,
    ) {
        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.finished_work(), fixture.render.finished_work());
        assert_eq!(handoff.complete_work(), fixture.complete_work);
        assert_eq!(fixture.previous_current, fixture.render.current());
        assert_eq!(
            handoff.execution_request().previous_current(),
            fixture.previous_current
        );
        assert_eq!(
            handoff.source_handoff_order(),
            fixture.pending.handoff_order()
        );
        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(diagnostic.finished_work(), fixture.render.finished_work());
        assert_eq!(
            diagnostic.source_handoff_order(),
            fixture.pending.handoff_order()
        );
        assert_eq!(diagnostic.commit_order(), handoff.commit_order());
        assert_eq!(diagnostic.request_order(), handoff.request_order());
        assert_eq!(diagnostic.kind(), handoff.kind());
        assert_eq!(
            diagnostic.order_evidence_name(),
            handoff.order_evidence_name()
        );
        assert_eq!(diagnostic.order_sibling(), fixture.order_sibling);
        assert_eq!(
            diagnostic.order_sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert_eq!(diagnostic.mutation(), handoff.mutation());
        assert_eq!(
            diagnostic.mutation().parent_state_node(),
            fixture.parent_state_node
        );
        assert_eq!(diagnostic.mutation_status(), expected_status);
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(
            diagnostic.deletion_cleanup_apply_count(),
            expected_cleanup_count
        );
        assert!(diagnostic.private_test_host_mutation_executed());
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(diagnostic.public_renderer_mutation_blocked());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert!(!diagnostic.hydration_events_refs_resources_forms_claimed());

        assert_eq!(
            store.root(root_id).unwrap().current(),
            fixture.render.finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            None
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.work_parent)
                .unwrap()
                .alternate(),
            Some(fixture.current_parent)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.order_sibling)
                .unwrap()
                .alternate(),
            Some(fixture.order_sibling_current)
        );
        assert_eq!(store.host_tokens().len(), expected_token_count_after_apply);
        let mut expected_operations = fixture.operations_before_apply.clone();
        expected_operations.push(expected_operation);
        if expected_cleanup_count > 0 {
            expected_operations.push("detach_deleted_instance");
        }
        assert_eq!(host.operations(), expected_operations);
    }

    fn current_host_root_element(
        store: &FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> RootElementHandle {
        let current = store.root(root_id).unwrap().current();
        let state = store.fiber_arena().get(current).unwrap().memoized_state();
        store.host_root_states().get(state).unwrap().element()
    }

    fn scheduled_callback_node(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> RootSchedulerCallbackHandle {
        let result =
            update_container(store, root_id, RootElementHandle::from_raw(1), None).unwrap();
        ensure_root_is_scheduled(store, result.schedule()).unwrap();
        let processed = process_root_schedule_in_microtask(store).unwrap();

        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        store.root(root_id).unwrap().scheduling().callback_node()
    }

    fn scheduled_pinged_retry_callback(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> SchedulerCallbackRequest {
        let result =
            update_container(store, root_id, RootElementHandle::from_raw(1), None).unwrap();
        ensure_root_is_scheduled(store, result.schedule()).unwrap();
        let retry_lanes = Lanes::from(Lane::RETRY_1).merge_lane(Lane::RETRY_2);
        let retry_and_offscreen = retry_lanes.merge(Lanes::OFFSCREEN);
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_updated(Lane::RETRY_1);
            lanes.mark_updated(Lane::RETRY_2);
            lanes.mark_updated(Lane::OFFSCREEN);
            lanes.mark_finished(RootFinishedLanes::new(Lanes::DEFAULT, retry_and_offscreen));
            lanes.mark_suspended(retry_and_offscreen, Lane::NO, true);
            lanes.mark_pinged(Lanes::from(Lane::RETRY_2));
        }
        let processed = process_root_schedule_in_microtask(store).unwrap();
        let record = processed.records()[0];

        assert_eq!(record.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(record.next_lanes(), Lanes::from(Lane::RETRY_2));
        record.scheduled_callback().unwrap()
    }

    fn schedule_retry_update(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        lane: Lane,
        element: RootElementHandle,
    ) -> UpdateId {
        let current = store.root(root_id).unwrap().current();
        let queue = store.ensure_host_root_update_queue(root_id).unwrap();
        let update = store.update_queues_mut().create_update(lane);
        store
            .update_queues_mut()
            .update_mut(update)
            .unwrap()
            .set_payload(RootUpdatePayload::new(element));

        let enqueued_root =
            enqueue_concurrent_host_root_update(store, current, queue, update, lane).unwrap();
        assert_eq!(enqueued_root, root_id);
        let finished = finish_queueing_concurrent_updates(store).unwrap();
        assert_eq!(finished.roots(), &[root_id]);

        update
    }

    fn attach_function_component_wip_child(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId, FiberTypeHandle) {
        let current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(501),
            FiberMode::NO,
        );
        let component = FiberTypeHandle::from_raw(601);
        store
            .fiber_arena_mut()
            .get_mut(current)
            .unwrap()
            .set_fiber_type(component);
        let work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(current, PropsHandle::from_raw(502))
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[work_in_progress])
            .unwrap();

        (current, work_in_progress, component)
    }

    fn attach_function_component_current_child_with_work_pair(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> (FiberId, FiberId, FiberTypeHandle) {
        let host_root_current = store.root(root_id).unwrap().current();
        let current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(551),
            FiberMode::NO,
        );
        let component = FiberTypeHandle::from_raw(651);
        store
            .fiber_arena_mut()
            .get_mut(current)
            .unwrap()
            .set_fiber_type(component);
        let work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(current, PropsHandle::from_raw(552))
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_current, &[current])
            .unwrap();

        (current, work_in_progress, component)
    }

    fn attach_current_single_host_child(
        store: &mut FiberRootStore<RecordingHost>,
        function_current: FiberId,
        tag: FiberTag,
        props: PropsHandle,
        element_type: ElementTypeHandle,
        state_node: StateNodeHandle,
    ) -> FiberId {
        let child = store
            .fiber_arena_mut()
            .create_fiber(tag, None, props, FiberMode::NO);
        {
            let node = store.fiber_arena_mut().get_mut(child).unwrap();
            node.set_element_type(element_type);
            node.set_memoized_props(props);
            node.set_state_node(state_node);
        }
        store
            .fiber_arena_mut()
            .set_children(function_current, &[child])
            .unwrap();
        child
    }

    fn action(raw: u64) -> FunctionComponentStateActionHandle {
        FunctionComponentStateActionHandle::from_raw(raw)
    }

    fn reducer(raw: u64) -> FunctionComponentReducerHandle {
        FunctionComponentReducerHandle::from_raw(raw)
    }

    fn action_as_state(
        _state: StateHandle,
        action: &FunctionComponentStateActionHandle,
    ) -> StateHandle {
        StateHandle::from_raw(action.raw())
    }

    fn attach_context_provider_wip_child(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId, FiberTypeHandle) {
        let provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(801),
            FiberMode::NO,
        );
        let current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(802),
            FiberMode::NO,
        );
        let component = FiberTypeHandle::from_raw(803);
        store
            .fiber_arena_mut()
            .get_mut(current)
            .unwrap()
            .set_fiber_type(component);
        let work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(current, PropsHandle::from_raw(804))
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(provider, &[work_in_progress])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[provider])
            .unwrap();

        (provider, work_in_progress, component)
    }

    fn attach_nested_context_provider_wip_child(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId, FiberId, FiberTypeHandle) {
        let outer_provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(821),
            FiberMode::NO,
        );
        let inner_provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(822),
            FiberMode::NO,
        );
        let current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(823),
            FiberMode::NO,
        );
        let component = FiberTypeHandle::from_raw(824);
        store
            .fiber_arena_mut()
            .get_mut(current)
            .unwrap()
            .set_fiber_type(component);
        let work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(current, PropsHandle::from_raw(825))
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(inner_provider, &[work_in_progress])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(outer_provider, &[inner_provider])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[outer_provider])
            .unwrap();

        (outer_provider, inner_provider, work_in_progress, component)
    }

    fn attach_nested_context_provider_two_consumer_wip_children(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (
        FiberId,
        FiberId,
        FiberId,
        FiberTypeHandle,
        FiberId,
        FiberTypeHandle,
    ) {
        let outer_provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(841),
            FiberMode::NO,
        );
        let inner_provider = store.fiber_arena_mut().create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(842),
            FiberMode::NO,
        );
        let first_current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(843),
            FiberMode::NO,
        );
        let first_component = FiberTypeHandle::from_raw(844);
        store
            .fiber_arena_mut()
            .get_mut(first_current)
            .unwrap()
            .set_fiber_type(first_component);
        let first_work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(first_current, PropsHandle::from_raw(845))
            .unwrap();
        let second_current = store.fiber_arena_mut().create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(846),
            FiberMode::NO,
        );
        let second_component = FiberTypeHandle::from_raw(847);
        store
            .fiber_arena_mut()
            .get_mut(second_current)
            .unwrap()
            .set_fiber_type(second_component);
        let second_work_in_progress = store
            .fiber_arena_mut()
            .create_work_in_progress(second_current, PropsHandle::from_raw(848))
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(
                inner_provider,
                &[first_work_in_progress, second_work_in_progress],
            )
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(outer_provider, &[inner_provider])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[outer_provider])
            .unwrap();

        (
            outer_provider,
            inner_provider,
            first_work_in_progress,
            first_component,
            second_work_in_progress,
            second_component,
        )
    }

    fn context_value(raw: u64) -> ContextValueHandle {
        ContextValueHandle::from_raw(raw)
    }

    fn attach_wip_child_with_tag(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
        tag: FiberTag,
    ) -> FiberId {
        let child =
            store
                .fiber_arena_mut()
                .create_fiber(tag, None, PropsHandle::NONE, FiberMode::NO);
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[child])
            .unwrap();
        child
    }

    fn attach_portal_wip_child(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId) {
        let portal = store.fiber_arena_mut().create_fiber(
            FiberTag::Portal,
            Some(ReactKey::from_normalized("portal-root")),
            PropsHandle::from_raw(701),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .get_mut(portal)
            .unwrap()
            .set_state_node(StateNodeHandle::from_raw(702));
        let portal_child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(703),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(portal, &[portal_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[portal])
            .unwrap();

        (portal, portal_child)
    }

    fn attach_suspense_wip_child_with_primary_and_fallback(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId, FiberId, FiberId, FiberId) {
        let suspense = store.fiber_arena_mut().create_fiber(
            FiberTag::Suspense,
            Some(ReactKey::from_normalized("boundary")),
            PropsHandle::from_raw(741),
            FiberMode::NO,
        );
        {
            let node = store.fiber_arena_mut().get_mut(suspense).unwrap();
            node.set_memoized_state(StateHandle::from_raw(742));
            node.set_update_queue(UpdateQueueHandle::from_raw(747));
        }
        let primary = store.fiber_arena_mut().create_fiber(
            FiberTag::Offscreen,
            None,
            PropsHandle::from_raw(743),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .get_mut(primary)
            .unwrap()
            .set_update_queue(UpdateQueueHandle::from_raw(748));
        let primary_child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(744),
            FiberMode::NO,
        );
        let fallback = store.fiber_arena_mut().create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::from_raw(745),
            FiberMode::NO,
        );
        let fallback_child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(746),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(primary, &[primary_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(fallback, &[fallback_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(suspense, &[primary, fallback])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[suspense])
            .unwrap();

        (suspense, primary, primary_child, fallback, fallback_child)
    }

    fn attach_offscreen_wip_child_with_descendants(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId, FiberId) {
        let offscreen = store.fiber_arena_mut().create_fiber(
            FiberTag::Offscreen,
            Some(ReactKey::from_normalized("hidden")),
            PropsHandle::from_raw(751),
            FiberMode::NO,
        );
        {
            let node = store.fiber_arena_mut().get_mut(offscreen).unwrap();
            node.set_memoized_props(PropsHandle::from_raw(752));
            node.set_memoized_state(StateHandle::from_raw(753));
            node.set_state_node(StateNodeHandle::from_raw(754));
            node.set_update_queue(UpdateQueueHandle::from_raw(757));
            node.merge_flags(FiberFlags::SCHEDULE_RETRY);
        }
        let first_child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(755),
            FiberMode::NO,
        );
        let second_child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(756),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(offscreen, &[first_child, second_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[offscreen])
            .unwrap();

        (offscreen, first_child, second_child)
    }

    fn attach_offscreen_reveal_wip_child(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
        child_tag: FiberTag,
    ) -> (FiberId, FiberId, FiberId, FiberId) {
        let previous = store.fiber_arena_mut().create_fiber(
            FiberTag::Offscreen,
            Some(ReactKey::from_normalized("reveal")),
            PropsHandle::from_raw(758),
            FiberMode::CONCURRENT,
        );
        {
            let node = store.fiber_arena_mut().get_mut(previous).unwrap();
            node.set_memoized_state(StateHandle::from_raw(759));
            node.set_lanes(Lanes::OFFSCREEN);
            node.set_child_lanes(Lanes::from(Lane::RETRY_1));
            node.set_state_node(StateNodeHandle::from_raw(760));
        }
        let offscreen = store
            .fiber_arena_mut()
            .create_work_in_progress(previous, PropsHandle::from_raw(761))
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(offscreen).unwrap();
            node.set_memoized_props(PropsHandle::from_raw(762));
            node.set_memoized_state(StateHandle::NONE);
            node.set_lanes(Lanes::DEFAULT);
            node.set_child_lanes(Lanes::from(Lane::TRANSITION_1));
            node.set_state_node(StateNodeHandle::from_raw(763));
        }
        let child = store.fiber_arena_mut().create_fiber(
            child_tag,
            None,
            PropsHandle::from_raw(764),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .get_mut(child)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT | FiberFlags::MAY_SUSPEND_COMMIT);
        store
            .fiber_arena_mut()
            .set_children(offscreen, &[child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[offscreen])
            .unwrap();

        (previous, offscreen, child, host_root_work_in_progress)
    }

    fn offscreen_begin_work_record_from_host_root_preflight(
        store: &mut FiberRootStore<RecordingHost>,
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        render_lanes: Lanes,
    ) -> UnsupportedOffscreenChildShapeRecord {
        let mut registry = TestFunctionComponentRegistry::default();
        match preflight_host_root_child_begin_work(
            store,
            root,
            host_root_work_in_progress,
            render_lanes,
            &mut registry,
        )
        .unwrap_err()
        {
            HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
                offscreen,
                ..
            } => {
                assert!(registry.calls().is_empty());
                *offscreen
            }
            other => panic!("expected Offscreen preflight blocker, got {other:?}"),
        }
    }

    fn attach_suspense_list_wip_child_with_rows(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId, FiberId) {
        let suspense_list = store.fiber_arena_mut().create_fiber(
            FiberTag::SuspenseList,
            Some(ReactKey::from_normalized("rows")),
            PropsHandle::from_raw(761),
            FiberMode::NO,
        );
        {
            let node = store.fiber_arena_mut().get_mut(suspense_list).unwrap();
            node.set_memoized_props(PropsHandle::from_raw(762));
            node.set_memoized_state(StateHandle::from_raw(763));
        }
        let first_row = store.fiber_arena_mut().create_fiber(
            FiberTag::Suspense,
            None,
            PropsHandle::from_raw(764),
            FiberMode::NO,
        );
        let second_row = store.fiber_arena_mut().create_fiber(
            FiberTag::Suspense,
            None,
            PropsHandle::from_raw(765),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(suspense_list, &[first_row, second_row])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[suspense_list])
            .unwrap();

        (suspense_list, first_row, second_row)
    }

    fn attach_activity_wip_child_with_primary(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId, FiberId) {
        let activity = store.fiber_arena_mut().create_fiber(
            FiberTag::Activity,
            Some(ReactKey::from_normalized("activity")),
            PropsHandle::from_raw(771),
            FiberMode::NO,
        );
        {
            let node = store.fiber_arena_mut().get_mut(activity).unwrap();
            node.set_memoized_props(PropsHandle::from_raw(772));
            node.set_state_node(StateNodeHandle::from_raw(773));
        }
        let primary = store.fiber_arena_mut().create_fiber(
            FiberTag::Offscreen,
            None,
            PropsHandle::from_raw(774),
            FiberMode::NO,
        );
        let primary_child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(775),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(primary, &[primary_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(activity, &[primary])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[activity])
            .unwrap();

        (activity, primary, primary_child)
    }

    fn attach_fragment_wip_child_with_descendant(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId) {
        let fragment = store.fiber_arena_mut().create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::from_raw(801),
            FiberMode::NO,
        );
        let fragment_child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(802),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(fragment, &[fragment_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[fragment])
            .unwrap();

        (fragment, fragment_child)
    }

    fn attach_keyed_fragment_wip_child_with_descendant(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId) {
        let fragment = store.fiber_arena_mut().create_fiber(
            FiberTag::Fragment,
            Some(ReactKey::from_normalized("fragment-key")),
            PropsHandle::from_raw(811),
            FiberMode::NO,
        );
        let fragment_child = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(812),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(fragment, &[fragment_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[fragment])
            .unwrap();

        (fragment, fragment_child)
    }

    fn attach_fragment_wip_child_with_tagged_descendant(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
        tag: FiberTag,
    ) -> (FiberId, FiberId) {
        let fragment = store.fiber_arena_mut().create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::from_raw(821),
            FiberMode::NO,
        );
        let fragment_child = store.fiber_arena_mut().create_fiber(
            tag,
            None,
            PropsHandle::from_raw(822),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(fragment, &[fragment_child])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[fragment])
            .unwrap();

        (fragment, fragment_child)
    }

    fn attach_fragment_wip_child_with_two_host_descendants(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> (FiberId, FiberId, FiberId) {
        let fragment = store.fiber_arena_mut().create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::from_raw(831),
            FiberMode::NO,
        );
        let first = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(832),
            FiberMode::NO,
        );
        let sibling = store.fiber_arena_mut().create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(833),
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(fragment, &[first, sibling])
            .unwrap();
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[fragment])
            .unwrap();

        (fragment, first, sibling)
    }

    fn assert_client_root_fail_closed_without_side_effects(
        store: &FiberRootStore<RecordingHost>,
        host: &RecordingHost,
        root_id: FiberRootId,
        current: FiberId,
        render: HostRootRenderPhaseRecord,
        root_child: FiberId,
    ) {
        assert_eq!(host.operations(), Vec::<&'static str>::new());

        let root = store.root(root_id).unwrap();
        assert_eq!(root.kind(), RootKind::Client);
        assert_eq!(root.current(), current);
        assert_eq!(root.context(), RootContextHandle::NONE);
        assert_eq!(root.pending_context(), None);
        assert_eq!(root.pending_children(), PendingChildrenHandle::NONE);
        assert_eq!(root.finished_work(), None);
        assert_eq!(root.finished_lanes(), Lanes::NO);
        assert_eq!(root.pending_commit(), PendingCommitHandle::NONE);
        assert_eq!(
            root.transition_callbacks(),
            RootTransitionCallbacksHandle::NONE
        );
        assert_eq!(
            root.options().hydration_callbacks(),
            RootHydrationCallbacksHandle::NONE
        );
        assert_eq!(
            root.scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            root.scheduling().work_in_progress_root_render_lanes(),
            render.render_lanes()
        );
        assert_eq!(
            root.scheduling().render_exit_status(),
            RootRenderExitStatus::Completed
        );
        assert!(root.scheduling().pending_passive().is_empty());

        let current_node = store.fiber_arena().get(current).unwrap();
        let current_state = store
            .host_root_states()
            .get(current_node.memoized_state())
            .unwrap();
        assert_eq!(
            current_state.hydration(),
            HostRootHydrationState::NotHydrated
        );
        assert!(!current_state.is_dehydrated());
        assert_eq!(
            current_state.pending_suspense_boundaries(),
            RootSuspenseBoundarySetHandle::NONE
        );

        let work_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
        assert_eq!(work_node.child(), Some(root_child));
        assert_eq!(work_node.child_lanes(), Lanes::NO);
        assert_eq!(work_node.subtree_flags(), FiberFlags::NO);
        let work_state = store
            .host_root_states()
            .get(work_node.memoized_state())
            .unwrap();
        assert_eq!(work_state.hydration(), HostRootHydrationState::NotHydrated);
        assert!(!work_state.is_dehydrated());
        assert_eq!(
            work_state.pending_suspense_boundaries(),
            RootSuspenseBoundarySetHandle::NONE
        );

        let child_node = store.fiber_arena().get(root_child).unwrap();
        assert_eq!(child_node.return_fiber(), Some(render.work_in_progress()));
        assert_eq!(child_node.lanes(), Lanes::NO);
        assert_eq!(child_node.child_lanes(), Lanes::NO);
        assert_eq!(child_node.subtree_flags(), FiberFlags::NO);
    }

    fn assert_one_level_child_set_handoff_failed_before_host_work(
        store: &FiberRootStore<RecordingHost>,
        host: &RecordingHost,
        root_id: FiberRootId,
        current: FiberId,
        render: HostRootRenderPhaseRecord,
    ) {
        assert_eq!(host.operations(), Vec::<&'static str>::new());

        let root = store.root(root_id).unwrap();
        assert_eq!(root.kind(), RootKind::Client);
        assert_eq!(root.current(), current);
        assert_eq!(root.finished_work(), None);
        assert_eq!(root.finished_lanes(), Lanes::NO);
        assert_eq!(
            root.scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            root.scheduling().work_in_progress_root_render_lanes(),
            render.render_lanes()
        );
        assert_eq!(
            root.scheduling().render_exit_status(),
            RootRenderExitStatus::Completed
        );

        let work_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
        assert_eq!(work_node.child(), None);
        assert_eq!(work_node.child_lanes(), Lanes::NO);
        assert_eq!(work_node.subtree_flags(), FiberFlags::NO);
        assert_eq!(work_node.flags(), FiberFlags::NO);
    }

    fn handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        render: HostRootRenderPhaseRecord,
        source: &TestHostTree,
        child_set: &HostRootOneLevelChildSet,
        detached_hosts: DetachedHostRecords,
    ) -> Result<
        (
            HostRootOneLevelChildSetCompleteWorkHandoffRecord,
            HostWorkResult,
        ),
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

        let host_work = mount_test_host_sibling_work_with_detached_hosts_for_canary(
            store,
            host,
            render,
            source,
            begin_work.children(),
            detached_hosts,
        )
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

        Ok((
            HostRootOneLevelChildSetCompleteWorkHandoffRecord {
                begin_work,
                child_set_completion,
                complete_work,
            },
            host_work,
        ))
    }

    fn append_stable_root_text_work_after_one_level_child_set(
        store: &mut FiberRootStore<RecordingHost>,
        render: HostRootRenderPhaseRecord,
        first_placed_child: FiberId,
        second_placed_child: FiberId,
        stable_current: FiberId,
        stable_state_node: StateNodeHandle,
        stable_props: PropsHandle,
    ) -> FiberId {
        let stable_work = store
            .fiber_arena_mut()
            .create_work_in_progress(stable_current, stable_props)
            .unwrap();
        {
            let node = store.fiber_arena_mut().get_mut(stable_work).unwrap();
            node.set_state_node(stable_state_node);
            node.set_memoized_props(stable_props);
            node.set_lanes(Lanes::NO);
            node.set_flags(FiberFlags::NO);
        }
        store
            .fiber_arena_mut()
            .set_children(
                render.work_in_progress(),
                &[first_placed_child, second_placed_child, stable_work],
            )
            .unwrap();
        complete_host_root_one_level_child_set_for_test(
            store.fiber_arena_mut(),
            render.work_in_progress(),
            3,
        )
        .unwrap();
        stable_work
    }

    #[derive(Debug)]
    struct RootWorkLoopRootUnmountMountedOutput {
        complete_work: HostRootOneLevelChildSetCompleteWorkHandoffRecord,
        host_work: HostWorkResult,
        first_child: FiberId,
        second_child: FiberId,
        first_state_node: StateNodeHandle,
        second_state_node: StateNodeHandle,
        operations_after_mount: Vec<&'static str>,
        token_count_after_mount: usize,
    }

    #[derive(Debug)]
    struct RootWorkLoopRootUnmountExecution {
        render: HostRootRenderPhaseRecord,
        finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
        mutation_apply: TestHostRootMutationApplyResult,
        deletion_cleanup: TestHostRootDeletionCleanupApplyResult,
        deleted_children: Vec<FiberId>,
        operations_before_apply: Vec<&'static str>,
    }

    #[derive(Debug)]
    struct RootWorkLoopMultiChildHostMutationMountedOutput {
        complete_work: HostRootOneLevelChildSetCompleteWorkHandoffRecord,
        host_work: HostWorkResult,
        root_element: RootElementHandle,
        stable_before: FiberId,
        target: FiberId,
        stable_after: FiberId,
        stable_before_state_node: StateNodeHandle,
        target_state_node: StateNodeHandle,
        stable_after_state_node: StateNodeHandle,
        operations_after_mount: Vec<&'static str>,
        token_count_after_mount: usize,
    }

    #[derive(Debug)]
    struct RootWorkLoopMultiChildTextUpdateFixture {
        render: HostRootRenderPhaseRecord,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        previous_current: FiberId,
        stable_before_current: FiberId,
        updated_current: FiberId,
        stable_after_current: FiberId,
        stable_before_work: FiberId,
        updated_work: FiberId,
        stable_after_work: FiberId,
        stable_before_state_node: StateNodeHandle,
        updated_state_node: StateNodeHandle,
        stable_after_state_node: StateNodeHandle,
        operations_before_apply: Vec<&'static str>,
        token_count_before_apply: usize,
    }

    #[derive(Debug)]
    struct RootWorkLoopMultiChildDeleteFixture {
        render: HostRootRenderPhaseRecord,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        previous_current: FiberId,
        stable_before_current: FiberId,
        deleted_current: FiberId,
        stable_after_current: FiberId,
        stable_before_work: FiberId,
        stable_after_work: FiberId,
        stable_before_state_node: StateNodeHandle,
        deleted_state_node: StateNodeHandle,
        stable_after_state_node: StateNodeHandle,
        operations_before_apply: Vec<&'static str>,
        token_count_before_apply: usize,
    }

    #[derive(Debug)]
    struct RootWorkLoopMultiChildTextUpdateExecution {
        finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
        mutation_apply: TestHostRootMutationApplyResult,
        operations_before_apply: Vec<&'static str>,
    }

    #[derive(Debug)]
    struct RootWorkLoopMultiChildDeleteExecution {
        finished_work_handoff: HostRootFinishedWorkCommitHandoffRecordForCanary,
        mutation_apply: TestHostRootMutationApplyResult,
        deletion_cleanup: TestHostRootDeletionCleanupApplyResult,
        operations_before_apply: Vec<&'static str>,
    }

    #[derive(Debug, PartialEq, Eq)]
    enum RootWorkLoopMultiChildHostMutationExecutionError {
        FiberRootStore(FiberRootStoreError),
        FiberTopology(FiberTopologyError),
        HostWork(HostWorkError),
        FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
        MountRootMismatch {
            expected: FiberRootId,
            actual: FiberRootId,
        },
        StaleCurrent {
            root: FiberRootId,
            expected: FiberId,
            actual: FiberId,
        },
        CurrentElementMismatch {
            root: FiberRootId,
            expected: RootElementHandle,
            actual: RootElementHandle,
        },
        CurrentChildListMismatch {
            root: FiberRootId,
            expected: Vec<FiberId>,
            actual: Vec<FiberId>,
        },
        FinishedChildListMismatch {
            root: FiberRootId,
            expected: Vec<FiberId>,
            actual: Vec<FiberId>,
        },
        UnexpectedMutationCount {
            root: FiberRootId,
            expected: usize,
            actual: usize,
        },
        UnexpectedMutationRecord {
            root: FiberRootId,
            expected_fiber: FiberId,
            actual_fiber: FiberId,
            actual_kind: HostRootMutationApplyRecordKind,
        },
        UnexpectedMutationSource {
            root: FiberRootId,
            expected: HostRootMutationApplyRecordSource,
            actual: HostRootMutationApplyRecordSource,
        },
        UnexpectedLanes {
            root: FiberRootId,
            expected: Lanes,
            actual: Lanes,
        },
        UnexpectedTextUpdateCount {
            root: FiberRootId,
            fiber: FiberId,
            state_node: StateNodeHandle,
            actual: usize,
        },
        UnexpectedDeletionList {
            root: FiberRootId,
            expected_deleted: FiberId,
        },
    }

    impl From<FiberRootStoreError> for RootWorkLoopMultiChildHostMutationExecutionError {
        fn from(error: FiberRootStoreError) -> Self {
            Self::FiberRootStore(error)
        }
    }

    impl From<FiberTopologyError> for RootWorkLoopMultiChildHostMutationExecutionError {
        fn from(error: FiberTopologyError) -> Self {
            Self::FiberTopology(error)
        }
    }

    impl From<HostWorkError> for RootWorkLoopMultiChildHostMutationExecutionError {
        fn from(error: HostWorkError) -> Self {
            Self::HostWork(error)
        }
    }

    impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
        for RootWorkLoopMultiChildHostMutationExecutionError
    {
        fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
            Self::FinishedWorkCommitHandoff(Box::new(error))
        }
    }

    #[derive(Debug, PartialEq, Eq)]
    enum RootWorkLoopRootUnmountExecutionError {
        FiberRootStore(FiberRootStoreError),
        FiberTopology(FiberTopologyError),
        HostRootStateStore(HostRootStateStoreError),
        HostWork(HostWorkError),
        FinishedWorkCommitHandoff(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
        MountRootMismatch {
            expected: FiberRootId,
            actual: FiberRootId,
        },
        MountHostWorkMismatch {
            root: FiberRootId,
            expected: FiberId,
            actual: FiberId,
        },
        EmptyMountedChildren {
            root: FiberRootId,
        },
        UnmountElementNotNone {
            root: FiberRootId,
            element: RootElementHandle,
        },
        AlreadyUnmounted {
            root: FiberRootId,
            current: FiberId,
        },
        CurrentElementMismatch {
            root: FiberRootId,
            expected: RootElementHandle,
            actual: RootElementHandle,
        },
        CurrentChildListMismatch {
            root: FiberRootId,
            expected: Vec<FiberId>,
            actual: Vec<FiberId>,
        },
        UnexpectedUnmountMutationCount {
            root: FiberRootId,
            expected: usize,
            actual: usize,
        },
        UnexpectedUnmountMutationKind {
            root: FiberRootId,
            finished_work: FiberId,
            kind: HostRootMutationApplyRecordKind,
        },
    }

    impl From<FiberRootStoreError> for RootWorkLoopRootUnmountExecutionError {
        fn from(error: FiberRootStoreError) -> Self {
            Self::FiberRootStore(error)
        }
    }

    impl From<FiberTopologyError> for RootWorkLoopRootUnmountExecutionError {
        fn from(error: FiberTopologyError) -> Self {
            Self::FiberTopology(error)
        }
    }

    impl From<HostRootStateStoreError> for RootWorkLoopRootUnmountExecutionError {
        fn from(error: HostRootStateStoreError) -> Self {
            Self::HostRootStateStore(error)
        }
    }

    impl From<HostWorkError> for RootWorkLoopRootUnmountExecutionError {
        fn from(error: HostWorkError) -> Self {
            Self::HostWork(error)
        }
    }

    impl From<HostRootFinishedWorkCommitHandoffErrorForCanary>
        for RootWorkLoopRootUnmountExecutionError
    {
        fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
            Self::FinishedWorkCommitHandoff(Box::new(error))
        }
    }

    fn mount_one_level_root_host_output_for_unmount(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        raw: u64,
    ) -> RootWorkLoopRootUnmountMountedOutput {
        let mut source = TestHostTree::new();
        let first_element = source.insert_host_element_with_text("article", format!("root {raw}"));
        let second_element = source.insert_text(format!("tail {raw}"));
        let root_element = RootElementHandle::from_raw(raw);
        update_container(store, root_id, root_element, None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let child_set = HostRootOneLevelChildSet::array(
            root_element,
            vec![
                HostRootOneLevelChildSetEntry::host(first_element),
                HostRootOneLevelChildSetEntry::host(second_element),
            ],
        );
        let (complete_work, mut host_work) =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
                store,
                host,
                render,
                &source,
                &child_set,
                DetachedHostRecords::default(),
            )
            .unwrap();
        let finished_work_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                store,
                render,
                ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER,
                ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER,
            )
            .unwrap();
        let mount_apply = apply_test_host_root_commit_mutations_for_canary(
            store,
            host,
            finished_work_handoff.commit(),
            &mut host_work,
        )
        .unwrap();

        assert_eq!(mount_apply.applied_host_call_count(), 2);
        assert_eq!(
            mount_apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
            )
        );
        assert_eq!(
            mount_apply.records()[1].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
            )
        );

        let first_child = complete_work.complete_work().root_child().unwrap();
        let second_child = complete_work.complete_work().last_root_child().unwrap();
        let first_state_node = store.fiber_arena().get(first_child).unwrap().state_node();
        let second_state_node = store.fiber_arena().get(second_child).unwrap().state_node();

        RootWorkLoopRootUnmountMountedOutput {
            complete_work,
            host_work,
            first_child,
            second_child,
            first_state_node,
            second_state_node,
            operations_after_mount: host.operations(),
            token_count_after_mount: store.host_tokens().len(),
        }
    }

    fn execute_root_unmount_from_mounted_one_level_output(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        unmount_render: HostRootRenderPhaseRecord,
        mounted: &HostRootOneLevelChildSetCompleteWorkHandoffRecord,
        host_work: &mut HostWorkResult,
        source_order: usize,
        commit_order: usize,
    ) -> Result<RootWorkLoopRootUnmountExecution, RootWorkLoopRootUnmountExecutionError> {
        let mounted_complete = mounted.complete_work();
        if mounted_complete.root() != unmount_render.root() {
            return Err(RootWorkLoopRootUnmountExecutionError::MountRootMismatch {
                expected: mounted_complete.root(),
                actual: unmount_render.root(),
            });
        }
        if host_work.root() != mounted_complete.root()
            || host_work.work_in_progress() != mounted_complete.host_root_work_in_progress()
        {
            return Err(
                RootWorkLoopRootUnmountExecutionError::MountHostWorkMismatch {
                    root: mounted_complete.root(),
                    expected: mounted_complete.host_root_work_in_progress(),
                    actual: host_work.work_in_progress(),
                },
            );
        }
        if unmount_render.resulting_element() != RootElementHandle::NONE {
            return Err(
                RootWorkLoopRootUnmountExecutionError::UnmountElementNotNone {
                    root: unmount_render.root(),
                    element: unmount_render.resulting_element(),
                },
            );
        }

        let deleted_children = host_work.root_children().to_vec();
        if deleted_children.is_empty() {
            return Err(
                RootWorkLoopRootUnmountExecutionError::EmptyMountedChildren {
                    root: unmount_render.root(),
                },
            );
        }

        let current_state = store
            .fiber_arena()
            .get(unmount_render.current())?
            .memoized_state();
        let current_element = store.host_root_states().get(current_state)?.element();
        if current_element == RootElementHandle::NONE {
            return Err(RootWorkLoopRootUnmountExecutionError::AlreadyUnmounted {
                root: unmount_render.root(),
                current: unmount_render.current(),
            });
        }
        if current_element != mounted.root_element() {
            return Err(
                RootWorkLoopRootUnmountExecutionError::CurrentElementMismatch {
                    root: unmount_render.root(),
                    expected: mounted.root_element(),
                    actual: current_element,
                },
            );
        }

        let current_children = store.fiber_arena().child_ids(unmount_render.current())?;
        if current_children.is_empty() {
            return Err(RootWorkLoopRootUnmountExecutionError::AlreadyUnmounted {
                root: unmount_render.root(),
                current: unmount_render.current(),
            });
        }
        if current_children != deleted_children {
            return Err(
                RootWorkLoopRootUnmountExecutionError::CurrentChildListMismatch {
                    root: unmount_render.root(),
                    expected: deleted_children,
                    actual: current_children,
                },
            );
        }

        for &child in &deleted_children {
            store
                .fiber_arena_mut()
                .mark_child_for_deletion(unmount_render.finished_work(), child)?;
        }

        let finished_work_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                store,
                unmount_render,
                source_order,
                commit_order,
            )?;
        let commit = finished_work_handoff.commit();
        let mutation_records = commit.mutation_apply_log().records();
        if mutation_records.len() != deleted_children.len() {
            return Err(
                RootWorkLoopRootUnmountExecutionError::UnexpectedUnmountMutationCount {
                    root: commit.root(),
                    expected: deleted_children.len(),
                    actual: mutation_records.len(),
                },
            );
        }
        for mutation in mutation_records {
            if mutation.kind() != HostRootMutationApplyRecordKind::RemoveDeletedFromContainer {
                return Err(
                    RootWorkLoopRootUnmountExecutionError::UnexpectedUnmountMutationKind {
                        root: commit.root(),
                        finished_work: commit.finished_work(),
                        kind: mutation.kind(),
                    },
                );
            }
        }

        preflight_test_host_root_deletion_apply_and_cleanup_for_canary(store, commit, host_work)?;
        let operations_before_apply = host.operations();
        let mutation_apply =
            apply_test_host_root_commit_mutations_for_canary(store, host, commit, host_work)?;
        let deletion_cleanup =
            apply_test_host_root_deletion_cleanup_for_canary(store, host, commit, host_work)?;

        Ok(RootWorkLoopRootUnmountExecution {
            render: unmount_render,
            finished_work_handoff,
            mutation_apply,
            deletion_cleanup,
            deleted_children,
            operations_before_apply,
        })
    }

    fn mount_three_text_root_output_for_multichild_host_mutation(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        raw: u64,
    ) -> RootWorkLoopMultiChildHostMutationMountedOutput {
        let mut source = TestHostTree::new();
        let stable_before_element = source.insert_text(format!("stable before {raw}"));
        let target_element = source.insert_text(format!("target before {raw}"));
        let stable_after_element = source.insert_text(format!("stable after {raw}"));
        let root_element = RootElementHandle::from_raw(raw);
        update_container(store, root_id, root_element, None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let child_set = HostRootOneLevelChildSet::array(
            root_element,
            vec![
                HostRootOneLevelChildSetEntry::host(stable_before_element),
                HostRootOneLevelChildSetEntry::host(target_element),
                HostRootOneLevelChildSetEntry::host(stable_after_element),
            ],
        );
        let (complete_work, mut host_work) =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
                store,
                host,
                render,
                &source,
                &child_set,
                DetachedHostRecords::default(),
            )
            .unwrap();
        let finished_work_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                store,
                render,
                raw as usize,
                raw as usize + 1,
            )
            .unwrap();
        let mount_apply = apply_test_host_root_commit_mutations_for_canary(
            store,
            host,
            finished_work_handoff.commit(),
            &mut host_work,
        )
        .unwrap();

        assert_eq!(mount_apply.records().len(), 3);
        assert_eq!(mount_apply.applied_host_call_count(), 3);
        assert!(mount_apply.records().iter().all(|record| {
            record.status()
                == TestHostRootMutationApplyStatus::Applied(
                    TestHostRootMutationHostCall::AppendChildToContainer,
                )
        }));

        let children = host_work.root_children().to_vec();
        assert_eq!(children.len(), 3);
        let stable_before = children[0];
        let target = children[1];
        let stable_after = children[2];
        let stable_before_state_node = store.fiber_arena().get(stable_before).unwrap().state_node();
        let target_state_node = store.fiber_arena().get(target).unwrap().state_node();
        let stable_after_state_node = store.fiber_arena().get(stable_after).unwrap().state_node();

        RootWorkLoopMultiChildHostMutationMountedOutput {
            complete_work,
            host_work,
            root_element,
            stable_before,
            target,
            stable_after,
            stable_before_state_node,
            target_state_node,
            stable_after_state_node,
            operations_after_mount: host.operations(),
            token_count_after_mount: store.host_tokens().len(),
        }
    }

    fn prepare_root_work_loop_multichild_text_update_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        mounted: &mut RootWorkLoopMultiChildHostMutationMountedOutput,
        raw: u64,
    ) -> RootWorkLoopMultiChildTextUpdateFixture {
        let previous_current = store.root(root_id).unwrap().current();
        let mut source = TestHostTree::new();
        let next_text = source.insert_text(format!("target after {raw}"));
        update_container(store, root_id, RootElementHandle::from_raw(raw + 10), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let updated_work = update_test_host_root_sibling_text_child_work_for_canary(
            store,
            &mut mounted.host_work,
            render,
            &source,
            mounted.target,
            next_text,
        )
        .unwrap();
        let children = mounted.host_work.root_children().to_vec();
        assert_eq!(children.len(), 3);
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            render,
            ROOT_WORK_LOOP_MULTICHILD_UPDATE_SOURCE_ORDER,
        );

        RootWorkLoopMultiChildTextUpdateFixture {
            render,
            pending,
            previous_current,
            stable_before_current: mounted.stable_before,
            updated_current: mounted.target,
            stable_after_current: mounted.stable_after,
            stable_before_work: children[0],
            updated_work,
            stable_after_work: children[2],
            stable_before_state_node: mounted.stable_before_state_node,
            updated_state_node: mounted.target_state_node,
            stable_after_state_node: mounted.stable_after_state_node,
            operations_before_apply: Vec::new(),
            token_count_before_apply: 0,
        }
    }

    fn prepare_root_work_loop_multichild_text_delete_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        mounted: &mut RootWorkLoopMultiChildHostMutationMountedOutput,
        raw: u64,
    ) -> RootWorkLoopMultiChildDeleteFixture {
        let previous_current = store.root(root_id).unwrap().current();
        update_container(store, root_id, RootElementHandle::from_raw(raw + 20), None).unwrap();
        let render = render_host_root_for_lanes(store, root_id, Lanes::DEFAULT).unwrap();
        let remaining = delete_test_host_root_sibling_child_for_canary(
            store,
            &mut mounted.host_work,
            render,
            mounted.target,
        )
        .unwrap();
        assert_eq!(remaining.len(), 2);
        let pending = prepare_root_work_loop_managed_child_pending_commit(
            store,
            render,
            ROOT_WORK_LOOP_MULTICHILD_DELETE_SOURCE_ORDER,
        );

        RootWorkLoopMultiChildDeleteFixture {
            render,
            pending,
            previous_current,
            stable_before_current: mounted.stable_before,
            deleted_current: mounted.target,
            stable_after_current: mounted.stable_after,
            stable_before_work: remaining[0],
            stable_after_work: remaining[1],
            stable_before_state_node: mounted.stable_before_state_node,
            deleted_state_node: mounted.target_state_node,
            stable_after_state_node: mounted.stable_after_state_node,
            operations_before_apply: Vec::new(),
            token_count_before_apply: 0,
        }
    }

    fn execute_root_work_loop_multichild_text_update(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        mounted_root: FiberRootId,
        mounted_root_element: RootElementHandle,
        host_work: &mut HostWorkResult,
        mut fixture: RootWorkLoopMultiChildTextUpdateFixture,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        commit_order: usize,
    ) -> Result<
        RootWorkLoopMultiChildTextUpdateExecution,
        RootWorkLoopMultiChildHostMutationExecutionError,
    > {
        fixture.operations_before_apply = host.operations();
        fixture.token_count_before_apply = store.host_tokens().len();
        validate_root_work_loop_multichild_text_update_topology(
            store,
            root_id,
            mounted_root,
            mounted_root_element,
            &fixture,
            host_work,
        )?;

        let finished_work_handoff =
            commit_finished_host_root_with_finished_work_handoff_for_canary(
                store,
                fixture.render,
                Some(pending),
                commit_order,
            )?;
        validate_root_work_loop_multichild_text_update_commit(
            root_id,
            &fixture,
            finished_work_handoff.commit(),
        )?;
        let update_count =
            host_work.test_host_text_record_update_count_for_canary(fixture.updated_state_node)?;
        if update_count != 0 {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedTextUpdateCount {
                    root: root_id,
                    fiber: fixture.updated_current,
                    state_node: fixture.updated_state_node,
                    actual: update_count,
                },
            );
        }

        let mutation_apply = apply_test_host_root_commit_mutations_for_canary(
            store,
            host,
            finished_work_handoff.commit(),
            host_work,
        )?;

        Ok(RootWorkLoopMultiChildTextUpdateExecution {
            finished_work_handoff,
            mutation_apply,
            operations_before_apply: fixture.operations_before_apply,
        })
    }

    fn execute_root_work_loop_multichild_text_delete(
        store: &mut FiberRootStore<RecordingHost>,
        host: &mut RecordingHost,
        root_id: FiberRootId,
        mounted_root: FiberRootId,
        mounted_root_element: RootElementHandle,
        host_work: &mut HostWorkResult,
        mut fixture: RootWorkLoopMultiChildDeleteFixture,
        pending: HostRootFinishedWorkPendingCommitRecordForCanary,
        commit_order: usize,
    ) -> Result<
        RootWorkLoopMultiChildDeleteExecution,
        RootWorkLoopMultiChildHostMutationExecutionError,
    > {
        fixture.operations_before_apply = host.operations();
        fixture.token_count_before_apply = store.host_tokens().len();
        validate_root_work_loop_multichild_text_delete_topology(
            store,
            root_id,
            mounted_root,
            mounted_root_element,
            &fixture,
            host_work,
        )?;

        let finished_work_handoff =
            commit_finished_host_root_with_finished_work_handoff_for_canary(
                store,
                fixture.render,
                Some(pending),
                commit_order,
            )?;
        validate_root_work_loop_multichild_text_delete_commit(
            root_id,
            &fixture,
            finished_work_handoff.commit(),
        )?;
        preflight_test_host_root_deletion_apply_and_cleanup_for_canary(
            store,
            finished_work_handoff.commit(),
            host_work,
        )?;
        let mutation_apply = apply_test_host_root_commit_mutations_for_canary(
            store,
            host,
            finished_work_handoff.commit(),
            host_work,
        )?;
        let deletion_cleanup = apply_test_host_root_deletion_cleanup_for_canary(
            store,
            host,
            finished_work_handoff.commit(),
            host_work,
        )?;

        Ok(RootWorkLoopMultiChildDeleteExecution {
            finished_work_handoff,
            mutation_apply,
            deletion_cleanup,
            operations_before_apply: fixture.operations_before_apply,
        })
    }

    fn validate_root_work_loop_multichild_text_update_topology(
        store: &FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        mounted_root: FiberRootId,
        mounted_root_element: RootElementHandle,
        fixture: &RootWorkLoopMultiChildTextUpdateFixture,
        host_work: &HostWorkResult,
    ) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
        validate_root_work_loop_multichild_mounted_identity(
            store,
            root_id,
            mounted_root,
            mounted_root_element,
            fixture.render,
            fixture.previous_current,
        )?;
        if host_work.root() != root_id
            || host_work.work_in_progress() != fixture.render.finished_work()
        {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::MountRootMismatch {
                    expected: root_id,
                    actual: host_work.root(),
                },
            );
        }
        let expected_current = vec![
            fixture.stable_before_current,
            fixture.updated_current,
            fixture.stable_after_current,
        ];
        let actual_current = store.fiber_arena().child_ids(fixture.previous_current)?;
        if actual_current != expected_current {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::CurrentChildListMismatch {
                    root: root_id,
                    expected: expected_current,
                    actual: actual_current,
                },
            );
        }

        let expected_finished = vec![
            fixture.stable_before_work,
            fixture.updated_work,
            fixture.stable_after_work,
        ];
        let actual_finished = store
            .fiber_arena()
            .child_ids(fixture.render.finished_work())?;
        if actual_finished != expected_finished {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::FinishedChildListMismatch {
                    root: root_id,
                    expected: expected_finished,
                    actual: actual_finished,
                },
            );
        }

        validate_root_work_loop_text_alternate(
            store,
            root_id,
            fixture.stable_before_current,
            fixture.stable_before_work,
            fixture.stable_before_state_node,
        )?;
        validate_root_work_loop_text_alternate(
            store,
            root_id,
            fixture.updated_current,
            fixture.updated_work,
            fixture.updated_state_node,
        )?;
        validate_root_work_loop_text_alternate(
            store,
            root_id,
            fixture.stable_after_current,
            fixture.stable_after_work,
            fixture.stable_after_state_node,
        )?;
        if !store
            .fiber_arena()
            .get(fixture.updated_work)?
            .flags()
            .contains_all(FiberFlags::UPDATE)
        {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationRecord {
                    root: root_id,
                    expected_fiber: fixture.updated_work,
                    actual_fiber: fixture.updated_work,
                    actual_kind: HostRootMutationApplyRecordKind::CommitHostTextUpdate,
                },
            );
        }

        Ok(())
    }

    fn validate_root_work_loop_multichild_text_delete_topology(
        store: &FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        mounted_root: FiberRootId,
        mounted_root_element: RootElementHandle,
        fixture: &RootWorkLoopMultiChildDeleteFixture,
        host_work: &HostWorkResult,
    ) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
        validate_root_work_loop_multichild_mounted_identity(
            store,
            root_id,
            mounted_root,
            mounted_root_element,
            fixture.render,
            fixture.previous_current,
        )?;
        if host_work.root() != root_id
            || host_work.work_in_progress() != fixture.render.finished_work()
        {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::MountRootMismatch {
                    expected: root_id,
                    actual: host_work.root(),
                },
            );
        }
        let expected_current = vec![fixture.stable_before_current, fixture.deleted_current];
        let actual_current = store.fiber_arena().child_ids(fixture.previous_current)?;
        let before_node = store.fiber_arena().get(fixture.stable_before_current)?;
        if actual_current.first().copied() != Some(fixture.stable_before_current)
            || before_node.sibling() != Some(fixture.deleted_current)
        {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::CurrentChildListMismatch {
                    root: root_id,
                    expected: expected_current,
                    actual: actual_current,
                },
            );
        }

        let expected_finished = vec![fixture.stable_before_work, fixture.stable_after_work];
        let actual_finished = store
            .fiber_arena()
            .child_ids(fixture.render.finished_work())?;
        if actual_finished != expected_finished {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::FinishedChildListMismatch {
                    root: root_id,
                    expected: expected_finished,
                    actual: actual_finished,
                },
            );
        }

        validate_root_work_loop_text_alternate(
            store,
            root_id,
            fixture.stable_before_current,
            fixture.stable_before_work,
            fixture.stable_before_state_node,
        )?;
        validate_root_work_loop_text_alternate(
            store,
            root_id,
            fixture.stable_after_current,
            fixture.stable_after_work,
            fixture.stable_after_state_node,
        )?;
        let deleted_node = store.fiber_arena().get(fixture.deleted_current)?;
        if deleted_node.tag() != FiberTag::HostText
            || deleted_node.state_node() != fixture.deleted_state_node
        {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationRecord {
                    root: root_id,
                    expected_fiber: fixture.deleted_current,
                    actual_fiber: fixture.deleted_current,
                    actual_kind: HostRootMutationApplyRecordKind::RemoveDeletedFromContainer,
                },
            );
        }

        Ok(())
    }

    fn validate_root_work_loop_multichild_mounted_identity(
        store: &FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        mounted_root: FiberRootId,
        mounted_root_element: RootElementHandle,
        render: HostRootRenderPhaseRecord,
        previous_current: FiberId,
    ) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
        if mounted_root != root_id {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::MountRootMismatch {
                    expected: root_id,
                    actual: mounted_root,
                },
            );
        }
        let actual_current = store.root(root_id)?.current();
        if render.current() != previous_current || actual_current != previous_current {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::StaleCurrent {
                    root: root_id,
                    expected: previous_current,
                    actual: actual_current,
                },
            );
        }
        let current_element = current_host_root_element(store, root_id);
        if current_element != mounted_root_element {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::CurrentElementMismatch {
                    root: root_id,
                    expected: mounted_root_element,
                    actual: current_element,
                },
            );
        }

        Ok(())
    }

    fn validate_root_work_loop_text_alternate(
        store: &FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
        current: FiberId,
        work: FiberId,
        state_node: StateNodeHandle,
    ) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
        store.fiber_arena().validate_alternate_pair(current, work)?;
        let current_node = store.fiber_arena().get(current)?;
        let work_node = store.fiber_arena().get(work)?;
        if current_node.tag() != FiberTag::HostText
            || work_node.tag() != FiberTag::HostText
            || current_node.state_node() != state_node
            || work_node.state_node() != state_node
        {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationRecord {
                    root: root_id,
                    expected_fiber: work,
                    actual_fiber: work,
                    actual_kind: HostRootMutationApplyRecordKind::CommitHostTextUpdate,
                },
            );
        }
        Ok(())
    }

    fn validate_root_work_loop_multichild_text_update_commit(
        root_id: FiberRootId,
        fixture: &RootWorkLoopMultiChildTextUpdateFixture,
        commit: &HostRootCommitRecord,
    ) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
        if commit.finished_lanes() != fixture.render.render_lanes() {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedLanes {
                    root: root_id,
                    expected: fixture.render.render_lanes(),
                    actual: commit.finished_lanes(),
                },
            );
        }
        let records = commit.mutation_apply_log().records();
        if records.len() != 1 {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationCount {
                    root: root_id,
                    expected: 1,
                    actual: records.len(),
                },
            );
        }
        let mutation = records[0];
        if mutation.source()
            != HostRootMutationApplyRecordSource::MutationPhase(
                HostRootMutationPhaseRecordKind::Update,
            )
        {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationSource {
                    root: root_id,
                    expected: HostRootMutationApplyRecordSource::MutationPhase(
                        HostRootMutationPhaseRecordKind::Update,
                    ),
                    actual: mutation.source(),
                },
            );
        }
        if mutation.root() != root_id
            || mutation.host_root() != fixture.render.finished_work()
            || mutation.parent() != fixture.render.finished_work()
            || mutation.parent_tag() != FiberTag::HostRoot
            || mutation.kind() != HostRootMutationApplyRecordKind::CommitHostTextUpdate
            || mutation.fiber() != fixture.updated_work
            || mutation.alternate_fiber() != Some(fixture.updated_current)
            || mutation.state_node() != fixture.updated_state_node
            || !mutation.effect_flag().contains_all(FiberFlags::UPDATE)
        {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationRecord {
                    root: root_id,
                    expected_fiber: fixture.updated_work,
                    actual_fiber: mutation.fiber(),
                    actual_kind: mutation.kind(),
                },
            );
        }
        if mutation.lanes() != fixture.render.render_lanes() {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedLanes {
                    root: root_id,
                    expected: fixture.render.render_lanes(),
                    actual: mutation.lanes(),
                },
            );
        }
        Ok(())
    }

    fn validate_root_work_loop_multichild_text_delete_commit(
        root_id: FiberRootId,
        fixture: &RootWorkLoopMultiChildDeleteFixture,
        commit: &HostRootCommitRecord,
    ) -> Result<(), RootWorkLoopMultiChildHostMutationExecutionError> {
        if commit.finished_lanes() != fixture.render.render_lanes() {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedLanes {
                    root: root_id,
                    expected: fixture.render.render_lanes(),
                    actual: commit.finished_lanes(),
                },
            );
        }
        if commit.deletion_lists().len() != 1
            || commit.deletion_lists()[0].parent() != fixture.render.finished_work()
            || commit.deletion_lists()[0].deleted() != &[fixture.deleted_current]
        {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedDeletionList {
                    root: root_id,
                    expected_deleted: fixture.deleted_current,
                },
            );
        }
        let deletion_list = commit.deletion_lists()[0].list();
        let records = commit.mutation_apply_log().records();
        if records.len() != 1 {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationCount {
                    root: root_id,
                    expected: 1,
                    actual: records.len(),
                },
            );
        }
        let mutation = records[0];
        let expected_source = HostRootMutationApplyRecordSource::DeletionList(deletion_list);
        if mutation.source() != expected_source {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationSource {
                    root: root_id,
                    expected: expected_source,
                    actual: mutation.source(),
                },
            );
        }
        if mutation.root() != root_id
            || mutation.host_root() != fixture.render.finished_work()
            || mutation.parent() != fixture.render.finished_work()
            || mutation.parent_tag() != FiberTag::HostRoot
            || mutation.kind() != HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
            || mutation.fiber() != fixture.deleted_current
            || mutation.state_node() != fixture.deleted_state_node
            || !mutation
                .effect_flag()
                .contains_all(FiberFlags::CHILD_DELETION)
        {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedMutationRecord {
                    root: root_id,
                    expected_fiber: fixture.deleted_current,
                    actual_fiber: mutation.fiber(),
                    actual_kind: mutation.kind(),
                },
            );
        }
        if mutation.lanes() != fixture.render.render_lanes() {
            return Err(
                RootWorkLoopMultiChildHostMutationExecutionError::UnexpectedLanes {
                    root: root_id,
                    expected: fixture.render.render_lanes(),
                    actual: mutation.lanes(),
                },
            );
        }
        Ok(())
    }

    fn assert_root_work_loop_multichild_finished_work_blockers(
        handoff: &HostRootFinishedWorkCommitHandoffRecordForCanary,
    ) {
        assert!(handoff.mutation_execution_blocked());
        assert!(handoff.public_root_rendering_blocked());
        assert!(handoff.effects_refs_and_hydration_blocked());
        assert!(handoff.execution_request().compatibility_claim_blocked());
        assert!(handoff.execution_request().blockers().contains(
            &HostRootFinishedWorkCommitExecutionBlockerForCanary::PublicCompatibilityClaim
        ));
        assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
    }

    fn assert_root_child_preflight_blocks_unsupported_tag(
        error: HostRootChildBeginWorkPreflightError,
        root_id: FiberRootId,
        host_root_work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
        feature: &'static str,
        render_lanes: Lanes,
    ) {
        match tag {
            FiberTag::Suspense => match error {
                HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape {
                    root,
                    host_root_work_in_progress: actual_work_in_progress,
                    suspense,
                } => {
                    assert_eq!(root, root_id);
                    assert_eq!(actual_work_in_progress, host_root_work_in_progress);
                    assert_eq!(suspense.fiber(), child);
                    assert_eq!(suspense.shape(), UnsupportedSuspenseChildShapeKind::Empty);
                    assert_eq!(suspense.child(), None);
                    assert_eq!(suspense.render_lanes(), render_lanes);
                    let thenable = suspense.thenable_ping_blocker();
                    assert_eq!(
                        thenable.thenable_identity_class(),
                        UnsupportedThenableIdentityClass::NoThenable
                    );
                    assert_eq!(thenable.ping_lane(), render_lanes.highest_priority_lane());
                    assert_eq!(
                        thenable.retry_queue_kind(),
                        UnsupportedThenableRetryQueueKind::None
                    );
                    assert!(!thenable.primary_child_rendering_blocked());
                    assert!(!thenable.fallback_child_rendering_blocked());
                    assert_eq!(suspense.feature(), feature);
                }
                other => panic!("expected Suspense child-shape preflight, got {other:?}"),
            },
            FiberTag::Offscreen => match error {
                HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
                    root,
                    host_root_work_in_progress: actual_work_in_progress,
                    offscreen,
                } => {
                    assert_eq!(root, root_id);
                    assert_eq!(actual_work_in_progress, host_root_work_in_progress);
                    assert_eq!(offscreen.fiber(), child);
                    assert_eq!(offscreen.shape(), UnsupportedOffscreenChildShapeKind::Empty);
                    assert_eq!(offscreen.child(), None);
                    assert_eq!(offscreen.render_lanes(), render_lanes);
                    let thenable = offscreen.thenable_ping_blocker();
                    assert_eq!(
                        thenable.thenable_identity_class(),
                        UnsupportedThenableIdentityClass::NoThenable
                    );
                    assert_eq!(thenable.ping_lane(), render_lanes.highest_priority_lane());
                    assert_eq!(
                        thenable.retry_queue_kind(),
                        UnsupportedThenableRetryQueueKind::None
                    );
                    assert!(!thenable.primary_child_rendering_blocked());
                    assert!(!thenable.fallback_child_rendering_blocked());
                    assert_eq!(offscreen.feature(), feature);
                }
                other => panic!("expected Offscreen child-shape preflight, got {other:?}"),
            },
            FiberTag::SuspenseList => match error {
                HostRootChildBeginWorkPreflightError::UnsupportedSuspenseListChildShape {
                    root,
                    host_root_work_in_progress: actual_work_in_progress,
                    suspense_list,
                } => {
                    assert_eq!(root, root_id);
                    assert_eq!(actual_work_in_progress, host_root_work_in_progress);
                    assert_eq!(suspense_list.fiber(), child);
                    assert_eq!(
                        suspense_list.shape(),
                        UnsupportedSuspenseListChildShapeKind::Empty
                    );
                    assert_eq!(suspense_list.child(), None);
                    assert_eq!(suspense_list.render_lanes(), render_lanes);
                    assert_eq!(suspense_list.feature(), feature);
                }
                other => panic!("expected SuspenseList child-shape preflight, got {other:?}"),
            },
            FiberTag::Activity => match error {
                HostRootChildBeginWorkPreflightError::UnsupportedActivityChildShape {
                    root,
                    host_root_work_in_progress: actual_work_in_progress,
                    activity,
                } => {
                    assert_eq!(root, root_id);
                    assert_eq!(actual_work_in_progress, host_root_work_in_progress);
                    assert_eq!(activity.fiber(), child);
                    assert_eq!(activity.shape(), UnsupportedActivityChildShapeKind::Empty);
                    assert_eq!(activity.child(), None);
                    assert_eq!(activity.render_lanes(), render_lanes);
                    assert_eq!(activity.feature(), feature);
                }
                other => panic!("expected Activity child-shape preflight, got {other:?}"),
            },
            _ => assert_eq!(
                error,
                HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                    fiber: child,
                    tag,
                    feature,
                }
            ),
        }
    }

    #[test]
    fn root_work_loop_default_host_root_update_writes_element_to_wip_state() {
        let (mut store, root_id, _host) = root_store();
        let element = RootElementHandle::from_raw(42);
        update_container(&mut store, root_id, element, None).unwrap();

        let record = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let work_state = store
            .host_root_states()
            .get(
                store
                    .fiber_arena()
                    .get(record.work_in_progress())
                    .unwrap()
                    .memoized_state(),
            )
            .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(record.render_lanes(), Lanes::DEFAULT);
        assert_eq!(record.resulting_element(), element);
        assert_eq!(record.applied_update_count(), 1);
        assert_eq!(record.skipped_update_count(), 0);
        assert_eq!(record.remaining_lanes(), Lanes::NO);
        assert_eq!(work_state.element(), element);
        assert_eq!(
            record.work_in_progress_update_queue(),
            store
                .fiber_arena()
                .get(record.work_in_progress())
                .unwrap()
                .update_queue()
        );
    }

    #[test]
    fn root_work_loop_hands_completed_host_root_render_to_finished_work_commit_metadata() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(43), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let metadata =
            handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary(
                &mut store, render, 1,
            )
            .unwrap();

        assert_eq!(metadata.root(), root_id);
        assert_eq!(metadata.previous_current(), current);
        assert_eq!(metadata.finished_work(), render.finished_work());
        assert_eq!(metadata.render_lanes(), Lanes::DEFAULT);
        assert_eq!(metadata.root_finished_work_before_handoff(), None);
        assert_eq!(metadata.root_finished_lanes_before_handoff(), Lanes::NO);
        assert_eq!(
            metadata.root_finished_work_after_handoff(),
            Some(render.finished_work())
        );
        assert_eq!(metadata.root_finished_lanes_after_handoff(), Lanes::DEFAULT);
        assert!(metadata.records_completed_render_as_root_finished_work());
        assert!(metadata.host_mutation_blocked());
        assert!(metadata.public_root_rendering_blocked());

        let pending = metadata.pending_commit();
        assert_eq!(pending.pending_work(), Some(render.finished_work()));
        assert_eq!(pending.root_finished_work(), Some(render.finished_work()));
        assert_eq!(pending.finished_work(), render.finished_work());
        assert_eq!(pending.root_finished_lanes(), Lanes::DEFAULT);
        assert_eq!(pending.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(
            pending.render_exit_status(),
            RootRenderExitStatus::Completed
        );
        assert_eq!(pending.handoff_order(), 1);
        assert!(pending.records_finished_work());
        assert!(pending.records_root_finished_work());

        let root_after_handoff = store.root(root_id).unwrap();
        assert_eq!(root_after_handoff.current(), current);
        assert_eq!(
            root_after_handoff.finished_work(),
            Some(render.finished_work())
        );
        assert_eq!(root_after_handoff.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(
            root_after_handoff.scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());

        let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            render,
            Some(pending),
            2,
        )
        .unwrap();

        assert!(handoff.proves_private_finished_work_commit_execution());
        assert!(handoff.proves_private_root_finished_work_commit_metadata_handoff());
        assert_eq!(handoff.current_after_commit(), render.finished_work());
        assert_eq!(handoff.finished_work_after_commit(), None);
        assert_eq!(handoff.finished_lanes_after_commit(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_work_loop_finished_work_metadata_handoff_rejects_stale_render_records() {
        let (mut missing_store, missing_root, missing_host) = root_store();
        let missing_current = missing_store.root(missing_root).unwrap().current();
        update_container(
            &mut missing_store,
            missing_root,
            RootElementHandle::from_raw(43_100),
            None,
        )
        .unwrap();
        let missing_render =
            render_host_root_for_lanes(&mut missing_store, missing_root, Lanes::DEFAULT).unwrap();
        missing_store
            .root_mut(missing_root)
            .unwrap()
            .scheduling_mut()
            .clear_render_phase_work();

        let missing_error =
            handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary(
                &mut missing_store,
                missing_render,
                10,
            )
            .unwrap_err();

        assert_eq!(
            missing_error,
            HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseWorkMismatch {
                root: missing_root,
                expected: None,
                actual: missing_render.work_in_progress(),
            }
        );
        assert_eq!(
            missing_store.root(missing_root).unwrap().current(),
            missing_current
        );
        assert_eq!(
            missing_store.root(missing_root).unwrap().finished_work(),
            None
        );
        assert_eq!(
            missing_store.root(missing_root).unwrap().finished_lanes(),
            Lanes::NO
        );
        assert_eq!(missing_host.operations(), Vec::<&'static str>::new());

        let (mut lane_store, lane_root, lane_host) = root_store();
        let lane_current = lane_store.root(lane_root).unwrap().current();
        update_container(
            &mut lane_store,
            lane_root,
            RootElementHandle::from_raw(43_101),
            None,
        )
        .unwrap();
        let lane_render =
            render_host_root_for_lanes(&mut lane_store, lane_root, Lanes::DEFAULT).unwrap();
        let stale_lane_render = HostRootRenderPhaseRecord {
            render_lanes: Lanes::SYNC,
            ..lane_render
        };

        let lane_error =
            handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary(
                &mut lane_store,
                stale_lane_render,
                11,
            )
            .unwrap_err();

        assert_eq!(
            lane_error,
            HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseLanesMismatch {
                root: lane_root,
                expected: Lanes::DEFAULT,
                actual: Lanes::SYNC,
            }
        );
        assert_eq!(lane_store.root(lane_root).unwrap().current(), lane_current);
        assert_eq!(lane_store.root(lane_root).unwrap().finished_work(), None);
        assert_eq!(
            lane_store.root(lane_root).unwrap().finished_lanes(),
            Lanes::NO
        );
        assert_eq!(lane_host.operations(), Vec::<&'static str>::new());

        let (mut incomplete_store, incomplete_root, incomplete_host) = root_store();
        let incomplete_current = incomplete_store.root(incomplete_root).unwrap().current();
        update_container(
            &mut incomplete_store,
            incomplete_root,
            RootElementHandle::from_raw(43_102),
            None,
        )
        .unwrap();
        let incomplete_render =
            render_host_root_for_lanes(&mut incomplete_store, incomplete_root, Lanes::DEFAULT)
                .unwrap();
        incomplete_store
            .root_mut(incomplete_root)
            .unwrap()
            .scheduling_mut()
            .record_render_phase_work(
                incomplete_render.work_in_progress(),
                Lanes::DEFAULT,
                RootRenderExitStatus::Incomplete,
            );

        let incomplete_error =
            handoff_completed_host_root_render_to_finished_work_commit_metadata_for_canary(
                &mut incomplete_store,
                incomplete_render,
                12,
            )
            .unwrap_err();

        assert_eq!(
            incomplete_error,
            HostRootRenderFinishedWorkCommitMetadataHandoffError::RenderPhaseNotCompleted {
                root: incomplete_root,
                status: RootRenderExitStatus::Incomplete,
            }
        );
        assert_eq!(
            incomplete_store.root(incomplete_root).unwrap().current(),
            incomplete_current
        );
        assert_eq!(
            incomplete_store
                .root(incomplete_root)
                .unwrap()
                .finished_work(),
            None
        );
        assert_eq!(
            incomplete_store
                .root(incomplete_root)
                .unwrap()
                .finished_lanes(),
            Lanes::NO
        );
        assert_eq!(incomplete_host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_work_loop_lane_priority_canary_records_sync_and_default_without_callbacks() {
        let (mut store, root_id, host) = root_store();
        let default =
            update_container(&mut store, root_id, RootElementHandle::from_raw(5351), None).unwrap();
        validate_update_container_lane_diagnostics_for_canary(&store, &default).unwrap();

        let sync =
            update_container_sync(&mut store, root_id, RootElementHandle::from_raw(5352), None)
                .unwrap();
        validate_update_container_lane_diagnostics_for_canary(&store, &sync).unwrap();

        let sync_and_default = Lanes::SYNC.merge(Lanes::DEFAULT);
        assert_eq!(default.lane(), Lane::DEFAULT);
        assert_eq!(default.event_priority(), EventPriority::DEFAULT);
        assert_eq!(
            default.source_priority(),
            RootUpdateLaneSourcePriority::DefaultEventPriority
        );
        assert_eq!(default.pending_lanes_before_enqueue(), Lanes::NO);
        assert_eq!(default.pending_lanes_after_enqueue(), Lanes::DEFAULT);
        assert_eq!(default.selected_next_lanes(), Lanes::DEFAULT);

        assert_eq!(sync.lane(), Lane::SYNC);
        assert_eq!(sync.event_priority(), EventPriority::DISCRETE);
        assert_eq!(
            sync.source_priority(),
            RootUpdateLaneSourcePriority::ExplicitSync
        );
        assert_eq!(sync.pending_lanes_before_enqueue(), Lanes::DEFAULT);
        assert_eq!(sync.pending_lanes_after_enqueue(), sync_and_default);
        assert_eq!(sync.selected_next_lanes(), sync_and_default);

        assert_ne!(default.lane(), sync.lane());
        assert_ne!(default.event_priority(), sync.event_priority());
        assert_ne!(default.source_priority(), sync.source_priority());
        assert_ne!(default.selected_next_lanes(), sync.selected_next_lanes());
        assert!(default.callback_scheduling_blocked());
        assert!(default.callback_execution_blocked());
        assert!(!default.public_batching_compatibility_claimed());
        assert!(sync.callback_scheduling_blocked());
        assert!(sync.callback_execution_blocked());
        assert!(!sync.public_batching_compatibility_claimed());
        assert_eq!(store.root_scheduler().first_scheduled_root(), None);
        assert_eq!(store.root_scheduler().last_scheduled_root(), None);
        assert!(!store.root_scheduler().did_schedule_microtask());
        assert!(store.scheduler_bridge().callback_requests().is_empty());
        assert!(store.scheduler_bridge().act_queue_requests().is_empty());
        assert!(store.scheduler_bridge().microtask_requests().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_work_loop_lane_priority_diagnostics_fail_closed_for_stale_queue_evidence() {
        let (mut store, root_id, _host) = root_store();
        let result =
            update_container(&mut store, root_id, RootElementHandle::from_raw(5353), None).unwrap();
        validate_update_container_lane_diagnostics_for_canary(&store, &result).unwrap();

        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let error =
            validate_update_container_lane_diagnostics_for_canary(&store, &result).unwrap_err();
        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(
            error,
            RootUpdateError::StaleQueueEvidence {
                root: root_id,
                queue: result.queue(),
                update: result.update(),
                expected_pending_lanes: Lanes::DEFAULT,
                actual_pending_lanes: Lanes::DEFAULT
            }
        );
    }

    #[test]
    fn root_work_loop_refreshes_wip_queue_from_current_on_later_render() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(1), None).unwrap();
        let first = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let current = store.root(root_id).unwrap().current();
        let first_wip = first.work_in_progress();
        let first_wip_queue = first.work_in_progress_update_queue();

        update_container(&mut store, root_id, RootElementHandle::from_raw(2), None).unwrap();
        let second = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let second_state = store
            .host_root_states()
            .get(second.memoized_state())
            .unwrap();

        assert_eq!(second.work_in_progress(), first_wip);
        assert_ne!(second.work_in_progress_update_queue(), first_wip_queue);
        assert_eq!(second.resulting_element(), RootElementHandle::from_raw(2));
        assert_eq!(second_state.element(), RootElementHandle::from_raw(2));
        assert_eq!(second.applied_update_count(), 2);
        assert_eq!(second.skipped_update_count(), 0);
        assert_eq!(second.remaining_lanes(), Lanes::NO);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(
            current_host_root_element(&store, root_id),
            RootElementHandle::NONE
        );
    }

    #[test]
    fn root_work_loop_leaves_current_state_and_root_current_unchanged() {
        let (mut store, root_id, _host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let current_state = store.fiber_arena().get(current).unwrap().memoized_state();
        update_container(&mut store, root_id, RootElementHandle::from_raw(10), None).unwrap();

        let record = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_ne!(record.work_in_progress(), current);
        assert_eq!(
            store.fiber_arena().get(current).unwrap().memoized_state(),
            current_state
        );
        assert_eq!(
            store
                .host_root_states()
                .get(current_state)
                .unwrap()
                .element(),
            RootElementHandle::NONE
        );
    }

    #[test]
    fn root_work_loop_skipped_lanes_remain_in_queue_and_render_result() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(11), None).unwrap();

        let record = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        let rebased = store
            .update_queues()
            .base_updates(record.work_in_progress_update_queue())
            .unwrap();

        assert_eq!(record.applied_update_count(), 0);
        assert_eq!(record.skipped_update_count(), 1);
        assert_eq!(record.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(
            current_host_root_element(&store, root_id),
            RootElementHandle::NONE
        );
        assert_eq!(rebased.len(), 1);
        assert_eq!(
            store.update_queues().update(rebased[0]).unwrap().lane(),
            Lanes::DEFAULT
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );
    }

    #[test]
    fn root_work_loop_stale_scheduler_callback_is_reported_without_rendering() {
        let (mut store, root_id, _host) = root_store();
        let stale_node = scheduled_callback_node(&mut store, root_id);
        let sync_result =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        ensure_root_is_scheduled(&mut store, sync_result.schedule()).unwrap();
        process_root_schedule_in_microtask(&mut store).unwrap();
        let current = store.root(root_id).unwrap().current();

        let result = render_host_root_via_scheduler_callback(
            &mut store,
            root_id,
            stale_node,
            Lanes::DEFAULT,
        )
        .unwrap();

        assert_eq!(
            result.status(),
            SchedulerCallbackRenderStatus::StaleCallback
        );
        assert!(result.validation().is_stale());
        assert_eq!(result.validation().requested_callback_node(), stale_node);
        assert_eq!(result.render_phase(), None);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.fiber_arena().get(current).unwrap().alternate(), None);
    }

    #[test]
    fn root_work_loop_matching_scheduler_callback_reaches_host_root_processing() {
        let (mut store, root_id, _host) = root_store();
        let callback_node = scheduled_callback_node(&mut store, root_id);

        let result = render_host_root_via_scheduler_callback(
            &mut store,
            root_id,
            callback_node,
            Lanes::DEFAULT,
        )
        .unwrap();
        let render = result.render_phase().unwrap();

        assert_eq!(result.status(), SchedulerCallbackRenderStatus::Rendered);
        assert!(!result.validation().is_stale());
        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(render.resulting_element(), RootElementHandle::from_raw(1));
    }

    #[test]
    fn root_work_loop_preflight_reports_host_root_wip_without_child() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(17), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut registry = TestFunctionComponentRegistry::default();

        let record = preflight_host_root_child_begin_work(
            &mut store,
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            &mut registry,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.child(), None);
        assert_eq!(record.child_tag(), None);
        assert_eq!(record.render_lanes(), Lanes::DEFAULT);
        assert!(!record.requires_begin_work());
        assert_eq!(record.begin_work(), None);
        assert!(registry.calls().is_empty());
    }

    #[test]
    fn root_work_loop_preflight_delegates_function_component_child_to_begin_work() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(18), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (current_child, child_work_in_progress, component) =
            attach_function_component_wip_child(&mut store, render.work_in_progress());
        let output = FunctionComponentOutputHandle::from_raw(701);
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));

        let record = preflight_host_root_child_begin_work(
            &mut store,
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            &mut registry,
        )
        .unwrap();
        let begin_work_record = record.begin_work().unwrap().function_component();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.child(), Some(child_work_in_progress));
        assert_eq!(record.child_tag(), Some(FiberTag::FunctionComponent));
        assert_eq!(record.render_lanes(), Lanes::DEFAULT);
        assert!(record.requires_begin_work());
        assert_eq!(begin_work_record.current(), Some(current_child));
        assert_eq!(begin_work_record.work_in_progress(), child_work_in_progress);
        assert_eq!(begin_work_record.render_lanes(), Lanes::DEFAULT);
        assert_eq!(begin_work_record.output(), output);
        assert_eq!(begin_work_record.render().component(), component);
        assert_eq!(
            begin_work_record.render().props(),
            PropsHandle::from_raw(502)
        );
        assert_eq!(registry.calls().len(), 1);
        let call = registry.calls()[0];
        assert_eq!(call.fiber(), child_work_in_progress);
        assert_eq!(call.component(), component);
        assert_eq!(call.props(), PropsHandle::from_raw(502));
        assert_eq!(call.render_lanes(), Lanes::DEFAULT);

        let child_node = store.fiber_arena().get(child_work_in_progress).unwrap();
        assert_eq!(child_node.memoized_props(), PropsHandle::from_raw(502));
        assert_eq!(child_node.memoized_state(), StateHandle::NONE);
        assert_eq!(child_node.update_queue(), UpdateQueueHandle::NONE);
        assert_eq!(child_node.lanes(), Lanes::NO);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn root_work_loop_context_provider_handoff_pushes_child_read_and_unwinds() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(118), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (provider, function_component, component) =
            attach_context_provider_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(900);
        let provided_value = context_value(901);
        let context = context_store.create_context(default_value);
        let output = FunctionComponentOutputHandle::from_raw(902);
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));

        let record = handoff_host_root_context_provider_child_begin_work(
            &mut store,
            HostRootContextProviderBeginWorkHandoffRequest::new(
                root_id,
                render.work_in_progress(),
                Lanes::DEFAULT,
                context,
                provided_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.provider(), provider);
        assert_eq!(record.function_component(), function_component);
        assert_eq!(record.begin_work().provider(), provider);
        assert_eq!(record.begin_work().child(), function_component);
        assert_eq!(record.begin_work().context(), context);
        assert_eq!(record.begin_work().value(), provided_value);
        assert_eq!(record.begin_work().child_output(), output);
        assert_eq!(record.begin_work().child_context_read_count(), 1);
        assert_eq!(record.begin_work().pushed_stack_depth(), 1);
        assert_eq!(record.begin_work().restored_stack_depth(), 0);
        assert_eq!(registry.calls().len(), 1);
        let context_state = registry.calls()[0].context_state().unwrap();
        assert_eq!(context_state.render_fiber(), function_component);
        assert_eq!(context_state.stack_depth(), 1);

        let reads = context_store.context_reads_for_record(record.begin_work().child_render());
        assert_eq!(reads.len(), 1);
        assert_eq!(reads[0].fiber(), function_component);
        assert_eq!(reads[0].context(), context);
        assert_eq!(reads[0].default_value(), default_value);
        assert_eq!(reads[0].value(), provided_value);
        assert_eq!(reads[0].active_provider_count(), 1);
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);

        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.fiber_arena().get(provider).unwrap().return_fiber(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .return_fiber(),
            Some(provider)
        );
    }

    #[test]
    fn root_work_loop_context_provider_change_propagation_marks_consumer_and_root_lanes() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(132), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (provider, function_component, component) =
            attach_context_provider_wip_child(&mut store, host_root_work_in_progress);
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_100);
        let previous_value = context_value(1_101);
        let next_value = context_value(1_102);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );
        let propagation_lanes = Lanes::SYNC.merge_lane(Lane::TRANSITION_1);

        let record = propagate_host_root_context_provider_use_context_change_for_test(
            &mut store,
            render,
            HostRootContextProviderUseContextPropagationGateRequest::new(
                context,
                previous_value,
                next_value,
                propagation_lanes,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            host_root_work_in_progress
        );
        assert_eq!(record.provider(), provider);
        assert_eq!(record.function_component(), function_component);
        assert_eq!(record.begin_work().provider(), provider);
        assert_eq!(record.begin_work().child(), function_component);
        assert_eq!(record.begin_work().context(), context);
        assert_eq!(record.begin_work().value(), previous_value);
        assert_eq!(record.begin_work().child_context_read_count(), 1);
        assert_eq!(record.begin_work().restored_stack_depth(), 0);

        let read = record.begin_work().child_context_read();
        assert_eq!(read.fiber(), function_component);
        assert_eq!(read.context(), context);
        assert_eq!(read.default_value(), default_value);
        assert_eq!(read.value(), previous_value);
        assert_eq!(registry.reads(), &[read]);
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);

        let propagation = record.propagation();
        assert_eq!(propagation.context(), context);
        assert_eq!(propagation.previous_value(), previous_value);
        assert_eq!(propagation.next_value(), next_value);
        assert_eq!(propagation.propagation_lanes(), propagation_lanes);
        assert_eq!(propagation.scanned_dependency_count(), 1);
        assert_eq!(propagation.marked_dependency_count(), 1);
        assert_eq!(propagation.roots(), &[root_id]);
        let marked = propagation.marked_dependencies()[0];
        assert_eq!(marked.dependency(), read.dependency());
        assert_eq!(marked.fiber(), function_component);
        assert_eq!(marked.memoized_value(), previous_value);
        assert_eq!(marked.previous_dependency_lanes(), Lanes::NO);
        assert_eq!(marked.dependency_lanes(), propagation_lanes);
        assert_eq!(
            context_store
                .context_dependency(read.dependency())
                .unwrap()
                .dependency_lanes(),
            propagation_lanes
        );

        assert!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .lanes()
                .contains_all(propagation_lanes)
        );
        assert!(
            store
                .fiber_arena()
                .get(provider)
                .unwrap()
                .child_lanes()
                .contains_all(propagation_lanes)
        );
        assert!(
            store
                .fiber_arena()
                .get(host_root_work_in_progress)
                .unwrap()
                .child_lanes()
                .contains_all(propagation_lanes)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_all(propagation_lanes)
        );
        let function_node = store.fiber_arena().get(function_component).unwrap();
        assert_eq!(function_node.dependencies(), DependenciesHandle::NONE);
        assert!(
            !function_node
                .flags()
                .contains_any(FiberFlags::NEEDS_PROPAGATION)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn root_work_loop_nested_context_provider_change_propagation_marks_two_consumers_and_unwinds() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(137), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            outer_provider,
            inner_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_nested_context_provider_two_consumer_wip_children(
            &mut store,
            host_root_work_in_progress,
        );
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_120);
        let outer_value = context_value(1_121);
        let previous_inner_value = context_value(1_122);
        let next_inner_value = context_value(1_123);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            first_component,
            UseContextBehavior::ReadOnce { context },
        );
        registry.register(second_component, UseContextBehavior::ReadOnce { context });
        let propagation_lanes = Lanes::SYNC
            .merge_lane(Lane::TRANSITION_1)
            .merge_lane(Lane::RETRY_1);

        let record =
            propagate_host_root_nested_context_provider_two_consumer_use_context_change_for_test(
                &mut store,
                render,
                HostRootNestedContextProviderTwoConsumerPropagationGateRequest::new(
                    root_id,
                    host_root_work_in_progress,
                    Lanes::DEFAULT,
                    context,
                    outer_value,
                    context,
                    previous_inner_value,
                    next_inner_value,
                    propagation_lanes,
                ),
                &mut context_store,
                &mut registry,
            )
            .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            host_root_work_in_progress
        );
        assert_eq!(record.outer_provider(), outer_provider);
        assert_eq!(record.inner_provider(), inner_provider);
        assert_eq!(record.first_function_component(), first_function_component);
        assert_eq!(
            record.second_function_component(),
            second_function_component
        );

        let begin_work = record.begin_work();
        assert_eq!(begin_work.outer_provider(), outer_provider);
        assert_eq!(begin_work.inner_provider(), inner_provider);
        assert_eq!(begin_work.first_child(), first_function_component);
        assert_eq!(begin_work.second_child(), second_function_component);
        assert_eq!(begin_work.outer_context(), context);
        assert_eq!(begin_work.inner_context(), context);
        assert_eq!(begin_work.outer_value(), outer_value);
        assert_eq!(begin_work.inner_value(), previous_inner_value);
        assert_eq!(begin_work.outer_pushed_stack_depth(), 1);
        assert_eq!(begin_work.inner_pushed_stack_depth(), 2);
        assert_eq!(begin_work.inner_restored_stack_depth(), 1);
        assert_eq!(begin_work.outer_restored_stack_depth(), 0);
        assert_eq!(begin_work.first_child_context_read_count(), 1);
        assert_eq!(begin_work.second_child_context_read_count(), 1);

        assert_eq!(registry.calls().len(), 2);
        assert_eq!(registry.calls()[0].fiber(), first_function_component);
        assert_eq!(registry.calls()[1].fiber(), second_function_component);
        assert_eq!(
            registry.calls()[0].context_state().unwrap().stack_depth(),
            2
        );
        assert_eq!(
            registry.calls()[1].context_state().unwrap().stack_depth(),
            2
        );

        let first_read = begin_work.first_child_context_read();
        let second_read = begin_work.second_child_context_read();
        assert_eq!(registry.reads(), &[first_read, second_read]);
        for (read, consumer) in [
            (first_read, first_function_component),
            (second_read, second_function_component),
        ] {
            assert_eq!(read.fiber(), consumer);
            assert_eq!(read.context(), context);
            assert_eq!(read.default_value(), default_value);
            assert_eq!(read.value(), previous_inner_value);
            assert_eq!(read.active_provider_count(), 2);
        }
        assert_eq!(
            context_store.context_reads_for_record(begin_work.first_child_render()),
            &[first_read]
        );
        assert_eq!(
            context_store.context_reads_for_record(begin_work.second_child_render()),
            &[second_read]
        );
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);

        let first_propagation = record.first_propagation();
        assert_eq!(first_propagation.context(), context);
        assert_eq!(first_propagation.previous_value(), previous_inner_value);
        assert_eq!(first_propagation.next_value(), next_inner_value);
        assert_eq!(first_propagation.propagation_lanes(), propagation_lanes);
        assert_eq!(first_propagation.scanned_dependency_count(), 1);
        assert_eq!(first_propagation.marked_dependency_count(), 1);
        assert_eq!(first_propagation.roots(), &[root_id]);
        let first_marked = first_propagation.marked_dependencies()[0];
        assert_eq!(first_marked.dependency(), first_read.dependency());
        assert_eq!(first_marked.fiber(), first_function_component);
        assert_eq!(first_marked.memoized_value(), previous_inner_value);
        assert_eq!(first_marked.previous_dependency_lanes(), Lanes::NO);
        assert_eq!(first_marked.dependency_lanes(), propagation_lanes);

        let second_propagation = record.second_propagation();
        assert_eq!(second_propagation.context(), context);
        assert_eq!(second_propagation.previous_value(), previous_inner_value);
        assert_eq!(second_propagation.next_value(), next_inner_value);
        assert_eq!(second_propagation.propagation_lanes(), propagation_lanes);
        assert_eq!(second_propagation.scanned_dependency_count(), 1);
        assert_eq!(second_propagation.marked_dependency_count(), 1);
        assert_eq!(second_propagation.roots(), &[root_id]);
        let second_marked = second_propagation.marked_dependencies()[0];
        assert_eq!(second_marked.dependency(), second_read.dependency());
        assert_eq!(second_marked.fiber(), second_function_component);
        assert_eq!(second_marked.memoized_value(), previous_inner_value);
        assert_eq!(second_marked.previous_dependency_lanes(), Lanes::NO);
        assert_eq!(second_marked.dependency_lanes(), propagation_lanes);

        for read in [first_read, second_read] {
            assert_eq!(
                context_store
                    .context_dependency(read.dependency())
                    .unwrap()
                    .dependency_lanes(),
                propagation_lanes
            );
        }

        for consumer in [first_function_component, second_function_component] {
            let consumer_node = store.fiber_arena().get(consumer).unwrap();
            assert!(consumer_node.lanes().contains_all(propagation_lanes));
            assert_eq!(consumer_node.dependencies(), DependenciesHandle::NONE);
            assert!(
                !consumer_node
                    .flags()
                    .contains_any(FiberFlags::NEEDS_PROPAGATION)
            );
        }
        assert!(
            store
                .fiber_arena()
                .get(inner_provider)
                .unwrap()
                .child_lanes()
                .contains_all(propagation_lanes)
        );
        assert!(
            store
                .fiber_arena()
                .get(outer_provider)
                .unwrap()
                .child_lanes()
                .contains_all(propagation_lanes)
        );
        assert!(
            store
                .fiber_arena()
                .get(host_root_work_in_progress)
                .unwrap()
                .child_lanes()
                .contains_all(propagation_lanes)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_all(propagation_lanes)
        );

        assert_eq!(
            store
                .fiber_arena()
                .get(host_root_work_in_progress)
                .unwrap()
                .child(),
            Some(outer_provider)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(outer_provider)
                .unwrap()
                .return_fiber(),
            Some(host_root_work_in_progress)
        );
        assert_eq!(
            store.fiber_arena().get(outer_provider).unwrap().child(),
            Some(inner_provider)
        );
        assert_eq!(
            store.fiber_arena().get(inner_provider).unwrap().child(),
            Some(first_function_component)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(first_function_component)
                .unwrap()
                .sibling(),
            Some(second_function_component)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(second_function_component)
                .unwrap()
                .sibling(),
            None
        );
        store.fiber_arena().validate_topology().unwrap();
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn root_work_loop_nested_context_update_commit_handoff_proves_lanes_survive() {
        let (mut store, root_id, host) = root_store();
        let original_root_element = RootElementHandle::from_raw(1_127);
        let skipped_sync_element = RootElementHandle::from_raw(1_128);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        update_container_sync(&mut store, root_id, skipped_sync_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        assert_eq!(render.resulting_element(), original_root_element);
        assert_eq!(render.remaining_lanes(), Lanes::SYNC);
        let host_root_work_in_progress = render.work_in_progress();
        let (
            outer_provider,
            inner_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_nested_context_provider_two_consumer_wip_children(
            &mut store,
            host_root_work_in_progress,
        );
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_129);
        let outer_value = context_value(1_130);
        let previous_inner_value = context_value(1_131);
        let next_inner_value = context_value(1_132);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            first_component,
            UseContextBehavior::ReadOnce { context },
        );
        registry.register(second_component, UseContextBehavior::ReadOnce { context });

        let record = handoff_nested_context_provider_two_consumer_update_to_test_render_commit(
            &mut store,
            render,
            HostRootNestedContextProviderTwoConsumerPropagationGateRequest::new(
                root_id,
                host_root_work_in_progress,
                Lanes::DEFAULT,
                context,
                outer_value,
                context,
                previous_inner_value,
                next_inner_value,
                Lanes::SYNC,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            host_root_work_in_progress
        );
        assert_eq!(record.original_root_element(), original_root_element);
        assert_eq!(record.outer_provider(), outer_provider);
        assert_eq!(record.inner_provider(), inner_provider);
        assert_eq!(record.first_function_component(), first_function_component);
        assert_eq!(
            record.second_function_component(),
            second_function_component
        );

        let begin_work = record.begin_work();
        assert_eq!(begin_work.outer_provider(), outer_provider);
        assert_eq!(begin_work.inner_provider(), inner_provider);
        assert_eq!(begin_work.outer_value(), outer_value);
        assert_eq!(begin_work.inner_value(), previous_inner_value);
        assert_eq!(begin_work.render_lanes(), Lanes::DEFAULT);
        assert_eq!(begin_work.first_child(), first_function_component);
        assert_eq!(begin_work.second_child(), second_function_component);
        assert_eq!(begin_work.first_child_context_read_count(), 1);
        assert_eq!(begin_work.second_child_context_read_count(), 1);
        assert_eq!(registry.reads().len(), 2);
        assert_eq!(registry.reads()[0], begin_work.first_child_context_read());
        assert_eq!(registry.reads()[1], begin_work.second_child_context_read());

        let provider_update = record.provider_update();
        assert_eq!(provider_update.root(), root_id);
        assert_eq!(
            provider_update.host_root_work_in_progress(),
            host_root_work_in_progress
        );
        assert_eq!(provider_update.outer_provider(), outer_provider);
        assert_eq!(provider_update.inner_provider(), inner_provider);
        assert_eq!(provider_update.context(), context);
        assert_eq!(provider_update.previous_value(), previous_inner_value);
        assert_eq!(provider_update.next_value(), next_inner_value);
        assert_eq!(provider_update.render_lanes(), Lanes::DEFAULT);
        assert_eq!(provider_update.propagation_lanes(), Lanes::SYNC);
        assert!(provider_update.provider_changed());
        assert_eq!(provider_update.marked_dependency_count(), 2);
        assert_eq!(provider_update.dependent_consumer_count(), 2);
        assert!(provider_update.all_marked_consumers_include_propagation_lanes());
        assert!(provider_update.public_context_compatibility_blocked());

        let consumers = provider_update.dependent_consumers();
        for (consumer_record, consumer, read) in [
            (
                consumers[0],
                first_function_component,
                begin_work.first_child_context_read(),
            ),
            (
                consumers[1],
                second_function_component,
                begin_work.second_child_context_read(),
            ),
        ] {
            assert_eq!(consumer_record.consumer(), consumer);
            assert_eq!(consumer_record.dependency(), read.dependency());
            assert_eq!(consumer_record.context(), context);
            assert_eq!(consumer_record.memoized_value(), previous_inner_value);
            assert_eq!(consumer_record.previous_value(), previous_inner_value);
            assert_eq!(consumer_record.next_value(), next_inner_value);
            assert_eq!(consumer_record.render_lanes(), Lanes::DEFAULT);
            assert_eq!(consumer_record.propagation_lanes(), Lanes::SYNC);
            assert_eq!(consumer_record.dependency_lanes(), Lanes::SYNC);
            assert!(consumer_record.marked_changed_provider_lanes());
        }

        let finished_work_handoff = record.finished_work_handoff();
        assert_eq!(finished_work_handoff.commit_order(), 2);
        assert!(finished_work_handoff.proves_private_finished_work_commit_execution());
        assert_eq!(
            finished_work_handoff
                .pending()
                .pending_lanes_before_commit(),
            Lanes::DEFAULT.merge_lane(Lane::SYNC)
        );
        assert_eq!(
            finished_work_handoff.pending().finished_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(
            finished_work_handoff.pending().remaining_lanes(),
            Lanes::SYNC
        );

        let context_commit = record.context_update_commit_handoff();
        assert_eq!(context_commit.request_order(), 3);
        assert_eq!(context_commit.provider_update(), provider_update);
        assert_eq!(
            context_commit.finished_work_handoff().pending(),
            finished_work_handoff.pending()
        );
        assert!(context_commit.marked_consumer_lanes_survived_to_commit());
        assert!(context_commit.ancestor_child_lanes_survived_to_commit());
        assert!(context_commit.root_pending_lanes_survived_to_commit());
        assert!(context_commit.proves_marked_consumer_lanes_survive_to_commit());
        assert!(
            context_commit
                .host_root_child_lanes_after_commit()
                .contains_all(Lanes::SYNC)
        );
        assert!(
            context_commit
                .outer_provider_child_lanes_after_commit()
                .contains_all(Lanes::SYNC)
        );
        assert!(
            context_commit
                .inner_provider_child_lanes_after_commit()
                .contains_all(Lanes::SYNC)
        );
        assert!(
            context_commit
                .root_pending_lanes_after_commit()
                .contains_all(Lanes::SYNC)
        );

        for (committed, consumer) in context_commit.committed_consumers().iter().zip([
            (
                ContextProviderUpdateConsumerOrder::First,
                first_function_component,
            ),
            (
                ContextProviderUpdateConsumerOrder::Second,
                second_function_component,
            ),
        ]) {
            let (order, consumer) = consumer;
            assert_eq!(committed.order(), order);
            assert_eq!(committed.consumer(), consumer);
            assert_eq!(committed.dependency_lanes(), Lanes::SYNC);
            assert_eq!(committed.propagation_lanes(), Lanes::SYNC);
            assert!(
                committed
                    .fiber_lanes_after_render()
                    .contains_all(Lanes::SYNC)
            );
            assert!(
                committed
                    .fiber_lanes_after_commit()
                    .contains_all(Lanes::SYNC)
            );
            assert!(committed.lanes_survived());
        }

        let commit = record.commit();
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), current);
        assert_eq!(commit.current(), host_root_work_in_progress);
        assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.remaining_lanes(), Lanes::SYNC);
        assert_eq!(commit.pending_lanes(), Lanes::SYNC);
        assert!(commit.has_remaining_work());
        assert!(commit.mutation_log().is_empty());
        assert!(commit.mutation_apply_log().is_empty());

        let committed_root = store.root(root_id).unwrap();
        assert_eq!(committed_root.current(), host_root_work_in_progress);
        assert_eq!(committed_root.finished_work(), None);
        assert_eq!(committed_root.finished_lanes(), Lanes::NO);
        assert_eq!(committed_root.lanes().pending_lanes(), Lanes::SYNC);
        for consumer in [first_function_component, second_function_component] {
            let node = store.fiber_arena().get(consumer).unwrap();
            assert!(node.lanes().contains_all(Lanes::SYNC));
            assert_eq!(node.dependencies(), DependenciesHandle::NONE);
            assert!(!node.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));
        }
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
        store.fiber_arena().validate_topology().unwrap();
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_work_loop_context_changed_bailout_gate_skips_unchanged_provider_propagation() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(138), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let host_root_work_in_progress = render.work_in_progress();
        let (
            outer_provider,
            inner_provider,
            first_function_component,
            first_component,
            second_function_component,
            second_component,
        ) = attach_nested_context_provider_two_consumer_wip_children(
            &mut store,
            host_root_work_in_progress,
        );
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_124);
        let outer_value = context_value(1_125);
        let previous_inner_value = context_value(1_126);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            first_component,
            UseContextBehavior::ReadOnce { context },
        );
        registry.register(second_component, UseContextBehavior::ReadOnce { context });
        let begin_work = begin_work_nested_context_provider_two_consumer_use_context_children(
            store.fiber_arena_mut(),
            NestedContextProviderBeginWorkRequest::new(
                outer_provider,
                Lanes::DEFAULT,
                context,
                outer_value,
                context,
                previous_inner_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let propagation_lanes = Lanes::SYNC
            .merge_lane(Lane::TRANSITION_2)
            .merge_lane(Lane::RETRY_2);

        let record = record_context_provider_update_two_consumer_lane_gate(
            &mut store,
            &mut context_store,
            begin_work,
            ContextProviderUpdateTwoConsumerLaneRequest::new(
                root_id,
                host_root_work_in_progress,
                begin_work.outer_provider_token(),
                begin_work.inner_provider_token(),
                context,
                previous_inner_value,
                previous_inner_value,
                propagation_lanes,
                ContextProviderUpdateDependencyPath::from_begin_work(begin_work),
            ),
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            host_root_work_in_progress
        );
        assert_eq!(record.outer_provider(), outer_provider);
        assert_eq!(record.inner_provider(), inner_provider);
        assert!(record.unchanged_provider_bailout());
        assert_eq!(record.marked_dependency_count(), 0);
        assert!(record.public_context_compatibility_blocked());

        let consumers = record.dependent_consumers();
        for (consumer, dependency) in [
            (consumers[0], begin_work.first_child_context_dependency()),
            (consumers[1], begin_work.second_child_context_dependency()),
        ] {
            assert_eq!(consumer.dependency(), dependency);
            assert_eq!(consumer.context(), context);
            assert_eq!(consumer.memoized_value(), previous_inner_value);
            assert_eq!(consumer.previous_value(), previous_inner_value);
            assert_eq!(consumer.next_value(), previous_inner_value);
            assert_eq!(consumer.propagation_lanes(), propagation_lanes);
            assert_eq!(consumer.previous_dependency_lanes(), Lanes::NO);
            assert_eq!(consumer.dependency_lanes(), Lanes::NO);
            assert_eq!(consumer.marked_dependency_count(), 0);
            assert!(consumer.unchanged_provider_bailout());
            assert_eq!(consumer.scanned_dependency_count(), 1);
            assert_eq!(
                context_store
                    .context_dependency(dependency)
                    .unwrap()
                    .dependency_lanes(),
                Lanes::NO
            );
        }

        for consumer in [first_function_component, second_function_component] {
            let node = store.fiber_arena().get(consumer).unwrap();
            assert_eq!(node.lanes(), Lanes::NO);
            assert_eq!(node.dependencies(), DependenciesHandle::NONE);
            assert!(!node.flags().contains_any(FiberFlags::NEEDS_PROPAGATION));
        }
        for fiber in [inner_provider, outer_provider, host_root_work_in_progress] {
            assert_eq!(
                store.fiber_arena().get(fiber).unwrap().child_lanes(),
                Lanes::NO
            );
        }
        assert!(
            !store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_any(propagation_lanes)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn root_work_loop_context_provider_use_context_hands_consumer_output_to_complete_work() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let child_element = source.insert_host_element_with_text("article", "provided child");
        let original_root_element = RootElementHandle::from_raw(133);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (provider, function_component, component) =
            attach_context_provider_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_000);
        let provided_value = context_value(child_element.raw());
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );

        let record = handoff_completed_context_provider_use_context_child_to_test_complete_work(
            &mut store,
            &mut host,
            render,
            &source,
            HostRootContextProviderUseContextCompleteWorkHandoffRequest::new(
                context,
                provided_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.original_root_element(), original_root_element);
        assert_eq!(record.provider(), provider);
        assert_eq!(record.function_component(), function_component);
        assert_eq!(record.child_element(), child_element);
        assert_eq!(record.child_tag(), FiberTag::HostComponent);

        let begin_work = record.begin_work();
        assert_eq!(begin_work.provider(), provider);
        assert_eq!(begin_work.child(), function_component);
        assert_eq!(begin_work.context(), context);
        assert_eq!(begin_work.value(), provided_value);
        assert_eq!(
            begin_work.child_output(),
            FunctionComponentOutputHandle::from_raw(child_element.raw())
        );
        assert_eq!(begin_work.child_context_read_count(), 1);
        assert_eq!(
            begin_work.single_child().function_component(),
            function_component
        );
        assert_eq!(begin_work.single_child().child_element(), child_element);
        assert_eq!(
            begin_work.single_child().child_tag(),
            FiberTag::HostComponent
        );
        assert_eq!(begin_work.pushed_stack_depth(), 1);
        assert_eq!(begin_work.restored_stack_depth(), 0);

        let read = begin_work.child_context_read();
        assert_eq!(read.fiber(), function_component);
        assert_eq!(read.context(), context);
        assert_eq!(read.default_value(), default_value);
        assert_eq!(read.value(), provided_value);
        assert_eq!(read.active_provider_count(), 1);
        assert_eq!(registry.reads(), &[read]);
        assert_eq!(
            context_store.context_reads_for_record(begin_work.child_render()),
            &[read]
        );
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);

        let complete_work = record.complete_work();
        assert_eq!(complete_work.root(), root_id);
        assert_eq!(
            complete_work.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(complete_work.root_child(), Some(provider));
        assert_eq!(
            complete_work.root_child_tag(),
            Some(FiberTag::ContextProvider)
        );
        assert_eq!(complete_work.root_child_count(), 1);
        assert_eq!(
            complete_work.completed_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(complete_work.completed_child_count(), 1);
        assert_eq!(complete_work.resulting_element(), child_element);
        assert_eq!(complete_work.detached_instance_count(), 1);
        assert_eq!(complete_work.detached_text_count(), 1);

        let host_child = complete_work.completed_child().unwrap();
        assert_eq!(
            store
                .fiber_arena()
                .get(render.work_in_progress())
                .unwrap()
                .child(),
            Some(provider)
        );
        assert_eq!(
            store.fiber_arena().get(provider).unwrap().return_fiber(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            store.fiber_arena().get(provider).unwrap().child(),
            Some(function_component)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .return_fiber(),
            Some(provider)
        );
        assert_eq!(
            store.fiber_arena().get(function_component).unwrap().child(),
            Some(host_child)
        );
        assert_eq!(
            store.fiber_arena().get(host_child).unwrap().return_fiber(),
            Some(function_component)
        );
        assert!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .flags()
                .contains_all(FiberFlags::PERFORMED_WORK)
        );
        assert!(
            store
                .fiber_arena()
                .get(provider)
                .unwrap()
                .subtree_flags()
                .contains_all(FiberFlags::PLACEMENT)
        );
        store.fiber_arena().validate_topology().unwrap();
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
            ]
        );
    }

    #[test]
    fn root_work_loop_context_provider_complete_unwind_restores_after_descendant_complete() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let child_element = source.insert_host_element_with_text("main", "provider traversal");
        let original_root_element = RootElementHandle::from_raw(135);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (provider, function_component, component) =
            attach_context_provider_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_020);
        let provided_value = context_value(child_element.raw());
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );

        let record =
            handoff_completed_context_provider_use_context_child_to_test_complete_work_with_provider_unwind(
                &mut store,
                &mut host,
                render,
                &source,
                HostRootContextProviderUseContextCompleteWorkHandoffRequest::new(
                    context,
                    provided_value,
                ),
                &mut context_store,
                &mut registry,
            )
            .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.original_root_element(), original_root_element);
        assert_eq!(record.provider(), provider);
        assert_eq!(record.function_component(), function_component);
        assert_eq!(record.child_element(), child_element);
        assert_eq!(record.child_tag(), FiberTag::HostComponent);
        assert_eq!(record.stack_depth_after_begin(), 1);
        assert_eq!(record.stack_depth_after_host_child_complete(), 1);

        let begin_work = record.begin_work();
        assert_eq!(begin_work.provider(), provider);
        assert_eq!(begin_work.child(), function_component);
        assert_eq!(begin_work.context(), context);
        assert_eq!(begin_work.value(), provided_value);
        assert_eq!(begin_work.pushed_stack_depth(), 1);
        assert_eq!(begin_work.child_context_read_count(), 1);
        assert_eq!(
            begin_work.child_output(),
            FunctionComponentOutputHandle::from_raw(child_element.raw())
        );

        let read = begin_work.child_context_read();
        assert_eq!(read.fiber(), function_component);
        assert_eq!(read.context(), context);
        assert_eq!(read.default_value(), default_value);
        assert_eq!(read.value(), provided_value);
        assert_eq!(read.active_provider_count(), 1);
        assert_eq!(registry.reads(), &[read]);

        let provider_complete = record.provider_complete();
        assert_eq!(provider_complete.provider(), provider);
        assert_eq!(provider_complete.context(), context);
        assert_eq!(provider_complete.value(), provided_value);
        assert_eq!(
            provider_complete.provider_snapshot(),
            begin_work.provider_snapshot()
        );
        assert_eq!(
            provider_complete.phase(),
            ContextProviderStackRestorationPhase::Complete
        );
        assert_eq!(provider_complete.stack_depth_before_restore(), 1);
        assert_eq!(provider_complete.restored_stack_depth(), 0);
        assert!(
            provider_complete
                .subtree_flags()
                .contains_all(FiberFlags::PLACEMENT)
        );

        let complete_work = record.complete_work();
        assert_eq!(complete_work.root_child(), Some(provider));
        assert_eq!(
            complete_work.root_child_tag(),
            Some(FiberTag::ContextProvider)
        );
        assert_eq!(complete_work.completed_child_count(), 1);
        assert_eq!(
            complete_work.completed_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(complete_work.resulting_element(), child_element);
        assert_eq!(complete_work.detached_instance_count(), 1);
        assert_eq!(complete_work.detached_text_count(), 1);

        let host_child = complete_work.completed_child().unwrap();
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
        assert_eq!(
            store
                .fiber_arena()
                .get(render.work_in_progress())
                .unwrap()
                .child(),
            Some(provider)
        );
        assert_eq!(
            store.fiber_arena().get(provider).unwrap().return_fiber(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            store.fiber_arena().get(provider).unwrap().child(),
            Some(function_component)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .return_fiber(),
            Some(provider)
        );
        assert_eq!(
            store.fiber_arena().get(function_component).unwrap().child(),
            Some(host_child)
        );
        store.fiber_arena().validate_topology().unwrap();
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
            ]
        );
    }

    #[test]
    fn root_work_loop_context_provider_update_lanes_survive_private_render_commit_traversal() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let child_element = source.insert_host_element_with_text("main", "updated provider");
        let original_root_element = RootElementHandle::from_raw(1_039);
        let skipped_sync_element = RootElementHandle::from_raw(1_040);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        update_container_sync(&mut store, root_id, skipped_sync_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        assert_eq!(render.resulting_element(), original_root_element);
        assert_eq!(render.applied_update_count(), 1);
        assert_eq!(render.skipped_update_count(), 1);
        assert_eq!(render.remaining_lanes(), Lanes::SYNC);

        let (provider, function_component, component) =
            attach_context_provider_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_041);
        let previous_value = context_value(child_element.raw());
        let next_value = context_value(child_element.raw() + 1);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );

        let record = handoff_context_provider_update_to_test_render_commit_traversal(
            &mut store,
            &mut host,
            render,
            &source,
            HostRootContextProviderUseContextPropagationGateRequest::new(
                context,
                previous_value,
                next_value,
                Lanes::SYNC,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.original_root_element(), original_root_element);
        assert_eq!(record.provider(), provider);
        assert_eq!(record.function_component(), function_component);
        assert_eq!(record.child_element(), child_element);
        assert_eq!(record.child_tag(), FiberTag::HostComponent);
        assert!(record.public_context_compatibility_blocked());
        assert_eq!(record.stack_depth_after_begin(), 1);
        assert_eq!(record.stack_depth_after_provider_update(), 1);
        assert_eq!(record.stack_depth_after_host_child_complete(), 1);

        let begin_work = record.begin_work();
        assert_eq!(begin_work.provider(), provider);
        assert_eq!(begin_work.child(), function_component);
        assert_eq!(begin_work.context(), context);
        assert_eq!(begin_work.value(), previous_value);
        assert!(begin_work.provider_token().is_some());
        assert_eq!(begin_work.pushed_stack_depth(), 1);
        assert_eq!(begin_work.child_context_read_count(), 1);
        assert_eq!(
            begin_work.child_output(),
            FunctionComponentOutputHandle::from_raw(child_element.raw())
        );
        let read = begin_work.child_context_read();
        assert_eq!(read.fiber(), function_component);
        assert_eq!(read.context(), context);
        assert_eq!(read.default_value(), default_value);
        assert_eq!(read.value(), previous_value);
        assert_eq!(read.active_provider_count(), 1);
        assert_eq!(registry.reads(), &[read]);

        let provider_update = record.provider_update();
        assert_eq!(provider_update.root(), root_id);
        assert_eq!(
            provider_update.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(provider_update.provider(), provider);
        assert_eq!(provider_update.consumer(), function_component);
        assert_eq!(provider_update.context(), context);
        assert_eq!(provider_update.previous_value(), previous_value);
        assert_eq!(provider_update.next_value(), next_value);
        assert_eq!(provider_update.propagation_lanes(), Lanes::SYNC);
        assert!(provider_update.provider_changed());
        assert_eq!(provider_update.marked_dependency_count(), 1);
        assert!(provider_update.public_context_compatibility_blocked());
        let provider_stack = provider_update.provider_stack_push();
        assert_eq!(provider_stack.provider(), provider);
        assert_eq!(
            provider_stack.provider_snapshot(),
            begin_work.provider_snapshot()
        );
        assert_eq!(provider_stack.provider_token(), begin_work.provider_token());
        assert_eq!(provider_stack.pushed_stack_depth(), 1);

        let consumer = provider_update.dependent_consumer();
        assert_eq!(consumer.consumer(), function_component);
        assert_eq!(consumer.dependency(), read.dependency());
        assert_eq!(consumer.context(), context);
        assert_eq!(consumer.memoized_value(), previous_value);
        assert_eq!(consumer.previous_value(), previous_value);
        assert_eq!(consumer.next_value(), next_value);
        assert_eq!(consumer.render_lanes(), Lanes::DEFAULT);
        assert_eq!(consumer.propagation_lanes(), Lanes::SYNC);
        assert_eq!(consumer.previous_dependency_lanes(), Lanes::NO);
        assert_eq!(consumer.dependency_lanes(), Lanes::SYNC);
        assert_eq!(consumer.marked_dependency_count(), 1);
        assert!(consumer.marked_changed_provider_lanes());
        assert_eq!(consumer.scanned_dependency_count(), 1);
        assert_eq!(consumer.root(), root_id);
        assert_eq!(
            context_store
                .context_dependency(read.dependency())
                .unwrap()
                .dependency_lanes(),
            Lanes::SYNC
        );

        let provider_complete = record.provider_complete();
        assert_eq!(provider_complete.provider(), provider);
        assert_eq!(provider_complete.context(), context);
        assert_eq!(provider_complete.value(), previous_value);
        assert_eq!(
            provider_complete.phase(),
            ContextProviderStackRestorationPhase::Complete
        );
        assert_eq!(provider_complete.stack_depth_before_restore(), 1);
        assert_eq!(provider_complete.restored_stack_depth(), 0);
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);

        let complete_work = record.complete_work();
        assert_eq!(complete_work.root_child(), Some(provider));
        assert_eq!(
            complete_work.root_child_tag(),
            Some(FiberTag::ContextProvider)
        );
        assert_eq!(complete_work.completed_child_count(), 1);
        assert_eq!(
            complete_work.completed_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(complete_work.resulting_element(), child_element);

        let finished_work_handoff = record.finished_work_handoff();
        let pending_finished_work = finished_work_handoff.pending();
        let expected_pending_before_commit = Lanes::DEFAULT.merge_lane(Lane::SYNC);
        assert_eq!(
            pending_finished_work.pending_lanes_before_commit(),
            expected_pending_before_commit
        );
        assert_eq!(pending_finished_work.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(pending_finished_work.remaining_lanes(), Lanes::SYNC);
        assert!(finished_work_handoff.consumed_finished_work_record());
        assert!(finished_work_handoff.mutation_execution_blocked());
        assert!(finished_work_handoff.public_root_rendering_blocked());
        assert!(finished_work_handoff.effects_refs_and_hydration_blocked());

        let commit = record.commit();
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), current);
        assert_eq!(commit.current(), render.work_in_progress());
        assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.remaining_lanes(), Lanes::SYNC);
        assert_eq!(commit.pending_lanes(), Lanes::SYNC);
        assert!(commit.has_remaining_work());
        assert!(commit.mutation_log().is_empty());
        assert!(commit.mutation_apply_log().is_empty());
        assert!(record.placement_apply_diagnostics().is_empty());
        assert!(record.host_operations_unchanged_by_commit());

        let committed_root = store.root(root_id).unwrap();
        assert_eq!(committed_root.current(), render.work_in_progress());
        assert_eq!(committed_root.finished_work(), None);
        assert_eq!(committed_root.finished_lanes(), Lanes::NO);
        assert_eq!(committed_root.lanes().pending_lanes(), Lanes::SYNC);
        assert!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .lanes()
                .contains_all(Lanes::SYNC)
        );
        assert!(
            store
                .fiber_arena()
                .get(provider)
                .unwrap()
                .child_lanes()
                .contains_all(Lanes::SYNC)
        );
        assert!(
            store
                .fiber_arena()
                .get(render.work_in_progress())
                .unwrap()
                .child_lanes()
                .contains_all(Lanes::SYNC)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .dependencies(),
            DependenciesHandle::NONE
        );
        assert!(
            !store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .flags()
                .contains_any(FiberFlags::NEEDS_PROPAGATION)
        );
        store.fiber_arena().validate_topology().unwrap();
        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
            ]
        );
    }

    #[test]
    fn root_work_loop_context_provider_complete_unwind_restores_after_descendant_complete_error() {
        let (mut store, root_id, mut host) = root_store();
        let source = TestHostTree::new();
        let missing_child_element = RootElementHandle::from_raw(1_036);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(136), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (provider, function_component, component) =
            attach_context_provider_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_030);
        let provided_value = context_value(1_031);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );
        let output = FunctionComponentOutputHandle::from_raw(provided_value.raw());
        let resolver = StaticSingleChildOutputResolver::new(
            FunctionComponentSingleChildOutput::host_component(
                output,
                missing_child_element,
                ElementTypeHandle::from_raw(1_037),
                PropsHandle::from_raw(1_038),
            ),
        );

        let begin_work =
            begin_work_context_provider_use_context_single_child_for_complete_traversal(
                store.fiber_arena_mut(),
                ContextProviderBeginWorkRequest::new(
                    provider,
                    Lanes::DEFAULT,
                    context,
                    provided_value,
                ),
                &mut context_store,
                &mut registry,
                &resolver,
            )
            .unwrap();
        assert_eq!(
            context_store.current_value(context).unwrap(),
            provided_value
        );
        assert_eq!(context_store.stack_depth(), 1);

        let complete_error =
            mount_test_context_provider_function_component_single_host_child_work_until_provider_complete(
                &mut store,
                &mut host,
                render,
                provider,
                function_component,
                missing_child_element,
                &source,
            )
            .unwrap_err();
        assert_eq!(
            complete_error,
            HostRootCompleteWorkHandoffError::HostWork(HostWorkError::MissingTestRootElement {
                handle: missing_child_element,
            },)
        );

        let unwind = unwind_context_provider_for_test(
            store.fiber_arena_mut(),
            &mut context_store,
            begin_work.begin_work(),
        )
        .unwrap();

        assert_eq!(unwind.provider(), provider);
        assert_eq!(unwind.context(), context);
        assert_eq!(unwind.value(), provided_value);
        assert_eq!(unwind.phase(), ContextProviderStackRestorationPhase::Unwind);
        assert_eq!(unwind.stack_depth_before_restore(), 1);
        assert_eq!(unwind.restored_stack_depth(), 0);
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(
            store
                .fiber_arena()
                .get(render.work_in_progress())
                .unwrap()
                .child(),
            Some(provider)
        );
        assert_eq!(
            store.fiber_arena().get(provider).unwrap().child(),
            Some(function_component)
        );
        assert_eq!(
            store.fiber_arena().get(function_component).unwrap().child(),
            None
        );
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn root_work_loop_context_provider_use_context_complete_work_unwinds_before_output_error() {
        let (mut store, root_id, mut host) = root_store();
        let source = TestHostTree::new();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(134), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (provider, function_component, component) =
            attach_context_provider_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(1_010);
        let missing_value = context_value(1_011);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );

        let error = handoff_completed_context_provider_use_context_child_to_test_complete_work(
            &mut store,
            &mut host,
            render,
            &source,
            HostRootContextProviderUseContextCompleteWorkHandoffRequest::new(
                context,
                missing_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootContextProviderUseContextCompleteWorkHandoffError::ContextProvider(
                ContextProviderBeginWorkError::ChildBeginWork {
                    provider,
                    child: function_component,
                    error: Box::new(BeginWorkError::FunctionComponentSingleChild(
                        FunctionComponentSingleChildReconciliationError::UnknownOutput {
                            fiber: function_component,
                            output: FunctionComponentOutputHandle::from_raw(missing_value.raw()),
                        },
                    )),
                },
            )
        );
        assert_eq!(registry.calls().len(), 1);
        assert_eq!(registry.reads().len(), 1);
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(
            store
                .fiber_arena()
                .get(render.work_in_progress())
                .unwrap()
                .child(),
            Some(provider)
        );
        assert_eq!(
            store.fiber_arena().get(provider).unwrap().child(),
            Some(function_component)
        );
        assert_eq!(
            store.fiber_arena().get(function_component).unwrap().child(),
            None
        );
        assert_eq!(
            store.fiber_arena().get(function_component).unwrap().flags(),
            FiberFlags::NO
        );
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn root_work_loop_context_provider_use_context_complete_work_rejects_non_provider_before_push()
    {
        let (mut store, root_id, mut host) = root_store();
        let source = TestHostTree::new();
        update_container(&mut store, root_id, RootElementHandle::from_raw(135), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (_current_child, function_component, component) =
            attach_function_component_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let context = context_store.create_context(context_value(1_020));
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );

        let error = handoff_completed_context_provider_use_context_child_to_test_complete_work(
            &mut store,
            &mut host,
            render,
            &source,
            HostRootContextProviderUseContextCompleteWorkHandoffRequest::new(
                context,
                context_value(1_021),
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootContextProviderUseContextCompleteWorkHandoffError::ExpectedContextProviderChild {
                root: root_id,
                host_root_work_in_progress: render.work_in_progress(),
                child: function_component,
                tag: FiberTag::FunctionComponent,
            }
        );
        assert!(registry.calls().is_empty());
        assert!(registry.reads().is_empty());
        assert_eq!(
            context_store.current_value(context).unwrap(),
            context_value(1_020)
        );
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_work_loop_nested_context_provider_handoff_pushes_child_reads_and_unwinds() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(128), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (outer_provider, inner_provider, function_component, component) =
            attach_nested_context_provider_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let outer_default = context_value(930);
        let inner_default = context_value(940);
        let outer_value = context_value(931);
        let inner_value = context_value(941);
        let outer_context = context_store.create_context(outer_default);
        let inner_context = context_store.create_context(inner_default);
        let output = FunctionComponentOutputHandle::from_raw(942);
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));

        let root_record = handoff_host_root_nested_context_provider_child_begin_work(
            &mut store,
            HostRootNestedContextProviderBeginWorkHandoffRequest::new(
                root_id,
                render.work_in_progress(),
                Lanes::DEFAULT,
                outer_context,
                outer_value,
                inner_context,
                inner_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let record = root_record.begin_work();

        assert_eq!(root_record.root(), root_id);
        assert_eq!(
            root_record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(root_record.outer_provider(), outer_provider);
        assert_eq!(root_record.inner_provider(), inner_provider);
        assert_eq!(root_record.function_component(), function_component);
        assert_eq!(record.outer_provider(), outer_provider);
        assert_eq!(record.inner_provider(), inner_provider);
        assert_eq!(record.child(), function_component);
        assert_eq!(record.outer_context(), outer_context);
        assert_eq!(record.outer_value(), outer_value);
        assert_eq!(record.inner_context(), inner_context);
        assert_eq!(record.inner_value(), inner_value);
        assert_eq!(record.child_output(), output);
        assert_eq!(record.child_context_read_count(), 2);
        assert_eq!(record.outer_pushed_stack_depth(), 1);
        assert_eq!(record.inner_pushed_stack_depth(), 2);
        assert_eq!(record.inner_restored_stack_depth(), 1);
        assert_eq!(record.outer_restored_stack_depth(), 0);
        assert_eq!(registry.calls().len(), 1);
        let context_state = registry.calls()[0].context_state().unwrap();
        assert_eq!(context_state.render_fiber(), function_component);
        assert_eq!(context_state.stack_depth(), 2);

        let reads = context_store.context_reads_for_record(record.child_render());
        assert_eq!(reads.len(), 2);
        assert_eq!(reads[0].fiber(), function_component);
        assert_eq!(reads[0].context(), outer_context);
        assert_eq!(reads[0].default_value(), outer_default);
        assert_eq!(reads[0].value(), outer_value);
        assert_eq!(reads[1].fiber(), function_component);
        assert_eq!(reads[1].context(), inner_context);
        assert_eq!(reads[1].default_value(), inner_default);
        assert_eq!(reads[1].value(), inner_value);
        assert_eq!(
            context_store.current_value(outer_context).unwrap(),
            outer_default
        );
        assert_eq!(
            context_store.current_value(inner_context).unwrap(),
            inner_default
        );
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store
                .fiber_arena()
                .get(outer_provider)
                .unwrap()
                .return_fiber(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(inner_provider)
                .unwrap()
                .return_fiber(),
            Some(outer_provider)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .return_fiber(),
            Some(inner_provider)
        );
    }

    #[test]
    fn root_work_loop_nested_context_provider_use_context_reads_nearest_provider_value() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(131), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (outer_provider, inner_provider, function_component, component) =
            attach_nested_context_provider_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(990);
        let outer_value = context_value(991);
        let inner_value = context_value(992);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadOnce { context },
        );

        let root_record = handoff_host_root_nested_context_provider_use_context_child_begin_work(
            &mut store,
            HostRootNestedContextProviderBeginWorkHandoffRequest::new(
                root_id,
                render.work_in_progress(),
                Lanes::DEFAULT,
                context,
                outer_value,
                context,
                inner_value,
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap();
        let record = root_record.begin_work();

        assert_eq!(root_record.root(), root_id);
        assert_eq!(
            root_record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(root_record.outer_provider(), outer_provider);
        assert_eq!(root_record.inner_provider(), inner_provider);
        assert_eq!(root_record.function_component(), function_component);
        assert_eq!(record.outer_provider(), outer_provider);
        assert_eq!(record.inner_provider(), inner_provider);
        assert_eq!(record.child(), function_component);
        assert_eq!(record.outer_context(), context);
        assert_eq!(record.inner_context(), context);
        assert_eq!(record.outer_value(), outer_value);
        assert_eq!(record.inner_value(), inner_value);
        assert_eq!(record.child_context_read_count(), 1);
        assert_eq!(
            record.child_output(),
            FunctionComponentOutputHandle::from_raw(inner_value.raw())
        );
        assert_eq!(record.outer_pushed_stack_depth(), 1);
        assert_eq!(record.inner_pushed_stack_depth(), 2);
        assert_eq!(record.inner_restored_stack_depth(), 1);
        assert_eq!(record.outer_restored_stack_depth(), 0);
        assert_eq!(registry.calls().len(), 1);
        let context_state = registry.calls()[0].context_state().unwrap();
        assert_eq!(context_state.render_fiber(), function_component);
        assert_eq!(context_state.stack_depth(), 2);

        let read = record.child_context_read();
        assert_eq!(read.fiber(), function_component);
        assert_eq!(read.context(), context);
        assert_eq!(read.default_value(), default_value);
        assert_eq!(read.value(), inner_value);
        assert_eq!(read.active_provider_count(), 2);
        assert_eq!(registry.reads(), &[read]);
        assert_eq!(
            context_store.context_reads_for_record(record.child_render()),
            &[read]
        );
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    }

    #[test]
    fn root_work_loop_nested_context_provider_use_context_unwinds_after_unsupported_consumer_shape()
    {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(132), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (outer_provider, inner_provider, function_component, component) =
            attach_nested_context_provider_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(993);
        let context = context_store.create_context(default_value);
        let mut registry = TestUseContextComponentRegistry::new(
            component,
            UseContextBehavior::ReadTwice { context },
        );

        let error = handoff_host_root_nested_context_provider_use_context_child_begin_work(
            &mut store,
            HostRootNestedContextProviderBeginWorkHandoffRequest::new(
                root_id,
                render.work_in_progress(),
                Lanes::DEFAULT,
                context,
                context_value(994),
                context,
                context_value(995),
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootNestedContextProviderBeginWorkHandoffError::NestedContextProvider(Box::new(
                NestedContextProviderBeginWorkError::ChildBeginWork {
                    outer_provider,
                    inner_provider,
                    child: function_component,
                    error: Box::new(BeginWorkError::FunctionComponent(
                        FunctionComponentRenderError::UnsupportedUseContextReadCount {
                            fiber: function_component,
                            read_count: 2,
                        },
                    )),
                },
            ))
        );
        assert_eq!(registry.calls().len(), 1);
        assert_eq!(registry.reads().len(), 2);
        assert_eq!(context_store.current_value(context).unwrap(), default_value);
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(context_store.active_provider_count(context).unwrap(), 0);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .memoized_props(),
            PropsHandle::NONE
        );
    }

    #[test]
    fn root_work_loop_nested_context_provider_handoff_unwinds_after_child_error() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(129), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (outer_provider, inner_provider, function_component, component) =
            attach_nested_context_provider_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let outer_default = context_value(950);
        let inner_default = context_value(960);
        let outer_context = context_store.create_context(outer_default);
        let inner_context = context_store.create_context(inner_default);
        let invocation_error =
            FunctionComponentInvocationError::component_error("root nested boom");
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Err(invocation_error.clone()));

        let error = handoff_host_root_nested_context_provider_child_begin_work(
            &mut store,
            HostRootNestedContextProviderBeginWorkHandoffRequest::new(
                root_id,
                render.work_in_progress(),
                Lanes::DEFAULT,
                outer_context,
                context_value(951),
                inner_context,
                context_value(961),
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootNestedContextProviderBeginWorkHandoffError::NestedContextProvider(Box::new(
                NestedContextProviderBeginWorkError::ChildBeginWork {
                    outer_provider,
                    inner_provider,
                    child: function_component,
                    error: Box::new(BeginWorkError::FunctionComponent(
                        FunctionComponentRenderError::Invocation {
                            fiber: function_component,
                            component,
                            error: invocation_error,
                        },
                    )),
                },
            ))
        );
        assert_eq!(registry.calls().len(), 1);
        assert_eq!(
            registry.calls()[0].context_state().unwrap().stack_depth(),
            2
        );
        assert_eq!(
            context_store.current_value(outer_context).unwrap(),
            outer_default
        );
        assert_eq!(
            context_store.current_value(inner_context).unwrap(),
            inner_default
        );
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(
            context_store.active_provider_count(outer_context).unwrap(),
            0
        );
        assert_eq!(
            context_store.active_provider_count(inner_context).unwrap(),
            0
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .memoized_props(),
            PropsHandle::NONE
        );
    }

    #[test]
    fn root_work_loop_nested_context_provider_handoff_rejects_non_provider_root_child_before_push()
    {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(130), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (_current_child, function_component, _component) =
            attach_function_component_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let outer_context = context_store.create_context(context_value(970));
        let inner_context = context_store.create_context(context_value(980));
        let mut registry = TestFunctionComponentRegistry::default();

        let error = handoff_host_root_nested_context_provider_child_begin_work(
            &mut store,
            HostRootNestedContextProviderBeginWorkHandoffRequest::new(
                root_id,
                render.work_in_progress(),
                Lanes::DEFAULT,
                outer_context,
                context_value(971),
                inner_context,
                context_value(981),
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootNestedContextProviderBeginWorkHandoffError::ExpectedContextProviderChild {
                root: root_id,
                host_root_work_in_progress: render.work_in_progress(),
                child: function_component,
                tag: FiberTag::FunctionComponent,
            }
        );
        assert!(registry.calls().is_empty());
        assert_eq!(
            context_store.current_value(outer_context).unwrap(),
            context_value(970)
        );
        assert_eq!(
            context_store.current_value(inner_context).unwrap(),
            context_value(980)
        );
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_work_loop_context_provider_handoff_fails_closed_for_non_provider_root_child() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(119), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (_current_child, function_component, _component) =
            attach_function_component_wip_child(&mut store, render.work_in_progress());
        let mut context_store = FunctionComponentContextRenderStore::new();
        let context = context_store.create_context(context_value(910));
        let mut registry = TestFunctionComponentRegistry::default();

        let error = handoff_host_root_context_provider_child_begin_work(
            &mut store,
            HostRootContextProviderBeginWorkHandoffRequest::new(
                root_id,
                render.work_in_progress(),
                Lanes::DEFAULT,
                context,
                context_value(911),
            ),
            &mut context_store,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootContextProviderBeginWorkHandoffError::ExpectedContextProviderChild {
                root: root_id,
                host_root_work_in_progress: render.work_in_progress(),
                child: function_component,
                tag: FiberTag::FunctionComponent,
            }
        );
        assert!(registry.calls().is_empty());
        assert_eq!(
            context_store.current_value(context).unwrap(),
            context_value(910)
        );
        assert_eq!(context_store.stack_depth(), 0);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_work_loop_preflight_fails_closed_for_explicit_unsupported_child_tags() {
        let cases = [
            (
                FiberTag::Suspense,
                SUSPENSE_UNSUPPORTED_FEATURE,
                Lanes::from(Lane::RETRY_1),
            ),
            (
                FiberTag::Offscreen,
                OFFSCREEN_UNSUPPORTED_FEATURE,
                Lanes::OFFSCREEN,
            ),
            (
                FiberTag::Activity,
                ACTIVITY_UNSUPPORTED_FEATURE,
                Lanes::from(Lane::RETRY_2),
            ),
            (
                FiberTag::ViewTransition,
                VIEW_TRANSITION_UNSUPPORTED_FEATURE,
                Lanes::DEFAULT,
            ),
            (
                FiberTag::SuspenseList,
                SUSPENSE_LIST_UNSUPPORTED_FEATURE,
                Lanes::from(Lane::RETRY_3),
            ),
        ];

        for (tag, feature, render_lanes) in cases {
            let (mut store, root_id, host) = root_store();
            let current = store.root(root_id).unwrap().current();
            update_container(&mut store, root_id, RootElementHandle::from_raw(19), None).unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let child = attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag);
            let mut registry = TestFunctionComponentRegistry::default();

            let error = preflight_host_root_child_begin_work(
                &mut store,
                root_id,
                render.work_in_progress(),
                render_lanes,
                &mut registry,
            )
            .unwrap_err();

            assert_root_child_preflight_blocks_unsupported_tag(
                error,
                root_id,
                render.work_in_progress(),
                child,
                tag,
                feature,
                render_lanes,
            );
            assert!(registry.calls().is_empty());
            assert_client_root_fail_closed_without_side_effects(
                &store, &host, root_id, current, render, child,
            );
            let child_node = store.fiber_arena().get(child).unwrap();
            assert_eq!(child_node.memoized_props(), PropsHandle::NONE);
            assert_eq!(child_node.memoized_state(), StateHandle::NONE);
            assert_eq!(child_node.update_queue(), UpdateQueueHandle::NONE);
            assert_eq!(child_node.flags(), FiberFlags::NO);
        }
    }

    #[test]
    fn root_work_loop_pinged_retry_scheduler_handoff_keeps_blocker_tags_fail_closed() {
        for (tag, feature) in [
            (FiberTag::Suspense, SUSPENSE_UNSUPPORTED_FEATURE),
            (FiberTag::Offscreen, OFFSCREEN_UNSUPPORTED_FEATURE),
            (FiberTag::Activity, ACTIVITY_UNSUPPORTED_FEATURE),
            (FiberTag::SuspenseList, SUSPENSE_LIST_UNSUPPORTED_FEATURE),
        ] {
            let (mut store, root_id, host) = root_store();
            let current = store.root(root_id).unwrap().current();
            let callback = scheduled_pinged_retry_callback(&mut store, root_id);

            let execution = execute_scheduled_root_callback(&mut store, callback).unwrap();
            let render = execution.render_phase().unwrap();
            let child = attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag);
            let mut registry = TestFunctionComponentRegistry::default();

            let error = preflight_host_root_child_begin_work(
                &mut store,
                root_id,
                render.work_in_progress(),
                render.render_lanes(),
                &mut registry,
            )
            .unwrap_err();

            assert_eq!(
                execution.status(),
                RootSchedulerCallbackExecutionStatus::Rendered
            );
            assert_eq!(execution.selected_lanes(), Lanes::from(Lane::RETRY_2));
            assert_eq!(render.render_lanes(), Lanes::from(Lane::RETRY_2));
            assert_eq!(render.applied_update_count(), 0);
            assert_eq!(render.skipped_update_count(), 1);
            assert_eq!(render.remaining_lanes(), Lanes::DEFAULT);
            assert_root_child_preflight_blocks_unsupported_tag(
                error,
                root_id,
                render.work_in_progress(),
                child,
                tag,
                feature,
                render.render_lanes(),
            );
            assert!(registry.calls().is_empty());
            assert_eq!(
                current_host_root_element(&store, root_id),
                RootElementHandle::NONE
            );
            assert_client_root_fail_closed_without_side_effects(
                &store, &host, root_id, current, render, child,
            );

            let child_node = store.fiber_arena().get(child).unwrap();
            assert_eq!(child_node.memoized_props(), PropsHandle::NONE);
            assert_eq!(child_node.memoized_state(), StateHandle::NONE);
            assert_eq!(child_node.update_queue(), UpdateQueueHandle::NONE);
            assert_eq!(child_node.flags(), FiberFlags::NO);
            assert_eq!(child_node.child(), None);
        }
    }

    #[test]
    fn root_work_loop_pinged_retry_path_records_suspense_thenable_blocker_metadata() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        let callback = scheduled_pinged_retry_callback(&mut store, root_id);

        let execution = execute_pinged_retry_root_callback(&mut store, callback).unwrap();
        let render = execution.render_phase().unwrap();
        let (suspense, primary, primary_child, fallback, fallback_child) =
            attach_suspense_wip_child_with_primary_and_fallback(
                &mut store,
                render.work_in_progress(),
            );
        let mut registry = TestFunctionComponentRegistry::default();

        let error = preflight_host_root_child_begin_work(
            &mut store,
            root_id,
            render.work_in_progress(),
            render.render_lanes(),
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(execution.status(), RootPingedRetryExecutionStatus::Rendered);
        assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(
            execution.selected_priority_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            execution.selected_render_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(render.render_lanes(), Lanes::from(Lane::RETRY_2));

        match error {
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape {
                root,
                host_root_work_in_progress,
                suspense: record,
            } => {
                assert_eq!(root, root_id);
                assert_eq!(host_root_work_in_progress, render.work_in_progress());
                assert_eq!(record.fiber(), suspense);
                assert_eq!(record.child(), Some(primary));
                assert_eq!(record.fallback_child(), Some(fallback));
                assert_eq!(
                    record.shape(),
                    UnsupportedSuspenseChildShapeKind::PrimaryOffscreenWithFallback
                );
                assert_eq!(record.render_lanes(), Lanes::from(Lane::RETRY_2));

                let thenable = record.thenable_ping_blocker();
                assert_eq!(
                    thenable.thenable_identity_class(),
                    UnsupportedThenableIdentityClass::OpaqueWakeable
                );
                assert_eq!(thenable.ping_lane(), Lane::RETRY_2);
                assert_eq!(thenable.ping_lanes(), Lanes::from(Lane::RETRY_2));
                assert_eq!(
                    thenable.retry_queue_kind(),
                    UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
                );
                assert_eq!(thenable.retry_queue(), UpdateQueueHandle::from_raw(747));
                assert_eq!(
                    thenable.primary_offscreen_retry_queue(),
                    Some(UpdateQueueHandle::from_raw(748))
                );
                assert!(!thenable.schedule_retry_flag());
                assert!(thenable.primary_child_rendering_blocked());
                assert!(thenable.fallback_child_rendering_blocked());
            }
            other => panic!("expected Suspense child-shape preflight, got {other:?}"),
        }

        assert!(registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &store, &host, root_id, current, render, suspense,
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(primary_child)
                .unwrap()
                .return_fiber(),
            Some(primary)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fallback_child)
                .unwrap()
                .return_fiber(),
            Some(fallback)
        );
    }

    #[test]
    fn root_work_loop_suspense_pinged_retry_handoff_reaches_complete_work_record() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("section", "retry handoff");
        update_container(&mut store, root_id, element, None).unwrap();
        let initial_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let initial_commit = commit_finished_host_root(&mut store, initial_render).unwrap();
        assert_eq!(initial_commit.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(host.operations(), Vec::<&'static str>::new());

        let current = store.root(root_id).unwrap().current();
        let (suspense, primary, primary_child, fallback, fallback_child) =
            attach_suspense_wip_child_with_primary_and_fallback(&mut store, current);
        let suspense_record = unsupported_suspense_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(suspense, Lanes::from(Lane::RETRY_2)),
        )
        .unwrap();
        {
            let lanes = store.root_mut(root_id).unwrap().lanes_mut();
            lanes.mark_updated(Lane::RETRY_2);
            lanes.mark_suspended(Lanes::from(Lane::RETRY_2), Lane::NO, true);
        }

        let request =
            request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense_record)
                .unwrap();
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let callback = processed.records()[0].scheduled_callback().unwrap();
        let render_handoff =
            execute_suspense_thenable_retry_root_render_handoff(&mut store, request, callback)
                .unwrap();
        let execution = render_handoff.execution();
        let render = render_handoff.render_phase().unwrap();
        let handoff = handoff_completed_host_root_render_to_test_complete_work(
            &mut store, &mut host, render, &source,
        )
        .unwrap();

        assert_eq!(
            request.status(),
            SuspenseThenableRetryRootSchedulerStatus::Accepted
        );
        assert!(request.accepted());
        assert!(request.thenable_ping_scheduled_expected_retry_lane());
        assert_eq!(request.boundary(), suspense);
        assert_eq!(request.retry_queue(), UpdateQueueHandle::from_raw(747));
        assert_eq!(
            request.primary_offscreen_retry_queue(),
            Some(UpdateQueueHandle::from_raw(748))
        );
        assert_eq!(request.retry_lane(), Lane::RETRY_2);
        assert_eq!(request.pinged_lanes(), Lanes::from(Lane::RETRY_2));
        assert!(!request.public_suspense_compatibility_claimed());
        assert_eq!(
            processed.records()[0].next_lanes(),
            Lanes::from(Lane::RETRY_2)
        );

        assert_eq!(render_handoff.request(), request);
        assert_eq!(render_handoff.root(), root_id);
        assert_eq!(render_handoff.boundary(), suspense);
        assert_eq!(render_handoff.retry_lane(), Lane::RETRY_2);
        assert_eq!(render_handoff.pinged_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(render_handoff.callback(), callback);
        assert!(render_handoff.thenable_ping_scheduled_expected_retry_lane());
        assert!(render_handoff.thenable_ping_reached_expected_retry_handoff());
        assert!(render_handoff.root_work_loop_reached());
        assert!(render_handoff.proves_private_thenable_ping_render_handoff());
        assert!(!render_handoff.suspense_boundary_rendering_executed());
        assert!(!render_handoff.fallback_traversal_executed());
        assert!(!render_handoff.wakeable_subscription_performed());
        assert!(!render_handoff.public_suspense_compatibility_claimed());
        assert!(!render_handoff.public_root_compatibility_claimed());

        assert_eq!(execution.status(), RootPingedRetryExecutionStatus::Rendered);
        assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(
            execution.selected_priority_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            execution.selected_render_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(render.root(), root_id);
        assert_eq!(render.current(), current);
        assert_eq!(render.render_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(render.resulting_element(), element);
        assert_eq!(render.applied_update_count(), 0);
        assert_eq!(render.skipped_update_count(), 0);

        assert_eq!(handoff.root(), root_id);
        assert_eq!(
            handoff.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(handoff.root_child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(handoff.render_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(handoff.resulting_element(), element);
        assert_eq!(handoff.detached_instance_count(), 1);
        assert_eq!(handoff.detached_text_count(), 1);
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .render_exit_status(),
            RootRenderExitStatus::Completed
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(primary_child)
                .unwrap()
                .return_fiber(),
            Some(primary)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fallback_child)
                .unwrap()
                .return_fiber(),
            Some(fallback)
        );
        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
            ]
        );
    }

    #[test]
    fn root_work_loop_suspense_retry_thenable_ping_commits_private_fallback_content_handoff() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let fallback_element = source.insert_host_element_with_text("span", "loading fallback");
        let content_element = source.insert_host_element_with_text("section", "resolved content");
        update_container(&mut store, root_id, fallback_element, None).unwrap();
        let fallback_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let fallback_commit = handoff_completed_host_root_render_to_test_complete_work_and_commit(
            &mut store,
            &mut host,
            fallback_render,
            &source,
        )
        .unwrap();
        let fallback_current = store.root(root_id).unwrap().current();
        assert_eq!(fallback_commit.commit().finished_lanes(), Lanes::DEFAULT);
        assert_eq!(fallback_commit.commit().finished_work(), fallback_current);
        assert_eq!(current_host_root_element(&store, root_id), fallback_element);
        assert!(
            fallback_commit
                .finished_work_handoff()
                .proves_private_finished_work_commit_execution()
        );

        let (suspense, primary, primary_child, fallback, fallback_child) =
            attach_suspense_wip_child_with_primary_and_fallback(&mut store, fallback_current);
        let suspense_record = unsupported_suspense_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(suspense, Lanes::from(Lane::RETRY_2)),
        )
        .unwrap();
        let retry_update =
            schedule_retry_update(&mut store, root_id, Lane::RETRY_2, content_element);
        store.root_mut(root_id).unwrap().lanes_mut().mark_suspended(
            Lanes::from(Lane::RETRY_2),
            Lane::NO,
            true,
        );

        let request =
            request_suspense_thenable_retry_root_scheduler(&mut store, root_id, &suspense_record)
                .unwrap();
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let schedule = processed.records()[0];
        let callback = schedule.scheduled_callback().unwrap();
        let render_handoff =
            execute_suspense_thenable_retry_root_render_handoff(&mut store, request, callback)
                .unwrap();
        let execution = render_handoff.execution();
        let retry_render = render_handoff.render_phase().unwrap();
        let retry_commit = handoff_completed_host_root_render_to_test_complete_work_and_commit(
            &mut store,
            &mut host,
            retry_render,
            &source,
        )
        .unwrap();
        let fallback_content_commit =
            record_host_root_suspense_fallback_content_commit_handoff_for_canary(
                &store,
                retry_commit.finished_work_handoff(),
                fallback_element,
                content_element,
                Lanes::from(Lane::RETRY_2),
            )
            .unwrap();

        assert_eq!(
            suspense_record.shape(),
            UnsupportedSuspenseChildShapeKind::PrimaryOffscreenWithFallback
        );
        assert_eq!(suspense_record.child(), Some(primary));
        assert_eq!(suspense_record.fallback_child(), Some(fallback));
        assert_eq!(
            suspense_record.thenable_ping_blocker().retry_queue_kind(),
            UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
        );
        assert!(
            suspense_record
                .thenable_ping_blocker()
                .primary_child_rendering_blocked()
        );
        assert!(
            suspense_record
                .thenable_ping_blocker()
                .fallback_child_rendering_blocked()
        );

        assert_eq!(
            request.status(),
            SuspenseThenableRetryRootSchedulerStatus::Accepted
        );
        assert!(request.accepted());
        assert!(request.thenable_ping_scheduled_expected_retry_lane());
        assert_eq!(request.boundary(), suspense);
        assert_eq!(request.retry_queue(), UpdateQueueHandle::from_raw(747));
        assert_eq!(
            request.primary_offscreen_retry_queue(),
            Some(UpdateQueueHandle::from_raw(748))
        );
        assert_eq!(request.retry_lane(), Lane::RETRY_2);
        assert_eq!(request.pinged_lanes(), Lanes::from(Lane::RETRY_2));
        assert!(!request.suspense_boundary_rendering_executed());
        assert!(!request.fallback_traversal_executed());
        assert!(!request.wakeable_subscription_performed());
        assert!(!request.public_suspense_compatibility_claimed());
        assert_eq!(schedule.root(), root_id);
        assert_eq!(schedule.outcome(), RootTaskScheduleOutcome::Scheduled);
        assert_eq!(schedule.next_lanes(), Lanes::from(Lane::RETRY_2));

        assert_eq!(render_handoff.request(), request);
        assert_eq!(render_handoff.root(), root_id);
        assert_eq!(render_handoff.boundary(), suspense);
        assert_eq!(render_handoff.retry_lane(), Lane::RETRY_2);
        assert_eq!(render_handoff.pinged_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(render_handoff.callback(), callback);
        assert!(render_handoff.thenable_ping_scheduled_expected_retry_lane());
        assert!(render_handoff.thenable_ping_reached_expected_retry_handoff());
        assert!(render_handoff.root_work_loop_reached());
        assert!(render_handoff.proves_private_thenable_ping_render_handoff());
        assert!(!render_handoff.public_suspense_compatibility_claimed());
        assert!(!render_handoff.public_root_compatibility_claimed());

        assert_eq!(execution.status(), RootPingedRetryExecutionStatus::Rendered);
        assert_eq!(execution.pinged_retry_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(
            execution.selected_priority_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            execution.selected_render_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(retry_render.root(), root_id);
        assert_eq!(retry_render.current(), fallback_current);
        assert_eq!(retry_render.render_lanes(), Lanes::from(Lane::RETRY_2));
        assert_eq!(retry_render.resulting_element(), content_element);
        assert_eq!(retry_render.applied_update_count(), 1);
        assert_eq!(retry_render.skipped_update_count(), 0);
        assert_eq!(retry_render.remaining_lanes(), Lanes::NO);

        assert_eq!(retry_commit.complete_work().root(), root_id);
        assert_eq!(
            retry_commit.complete_work().host_root_work_in_progress(),
            retry_render.work_in_progress()
        );
        assert_eq!(
            retry_commit.complete_work().root_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(
            retry_commit.complete_work().render_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            retry_commit.complete_work().resulting_element(),
            content_element
        );
        assert!(retry_commit.host_operations_unchanged_by_commit());
        assert!(retry_commit.public_render_blocked());

        let commit_handoff = retry_commit.finished_work_handoff();
        assert!(commit_handoff.proves_private_finished_work_commit_execution());
        assert_eq!(commit_handoff.pending().root(), root_id);
        assert_eq!(
            commit_handoff.pending().previous_current(),
            fallback_current
        );
        assert_eq!(
            commit_handoff.pending().finished_work(),
            retry_render.finished_work()
        );
        assert_eq!(
            commit_handoff.pending().render_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            commit_handoff.execution_request().render_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert!(
            commit_handoff
                .execution_request()
                .compatibility_claim_blocked()
        );

        assert_eq!(retry_commit.commit().root(), root_id);
        assert_eq!(retry_commit.commit().previous_current(), fallback_current);
        assert_eq!(
            retry_commit.commit().current(),
            retry_render.finished_work()
        );
        assert_eq!(
            retry_commit.commit().finished_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(retry_commit.commit().remaining_lanes(), Lanes::NO);
        assert_eq!(retry_commit.commit().pending_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            retry_render.finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(current_host_root_element(&store, root_id), content_element);

        assert_eq!(fallback_content_commit.root(), root_id);
        assert_eq!(fallback_content_commit.previous_current(), fallback_current);
        assert_eq!(
            fallback_content_commit.committed_current(),
            retry_render.finished_work()
        );
        assert_eq!(fallback_content_commit.fallback_element(), fallback_element);
        assert_eq!(fallback_content_commit.content_element(), content_element);
        assert_eq!(
            fallback_content_commit.previous_current_element(),
            fallback_element
        );
        assert_eq!(
            fallback_content_commit.committed_current_element(),
            content_element
        );
        assert_eq!(
            fallback_content_commit.retry_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            fallback_content_commit.finished_lanes(),
            Lanes::from(Lane::RETRY_2)
        );
        assert!(fallback_content_commit.private_finished_work_commit_proof());
        assert!(fallback_content_commit.fallback_to_content_element_handoff());
        assert!(fallback_content_commit.retry_lanes_committed());
        assert!(
            fallback_content_commit.proves_private_suspense_retry_fallback_content_commit_handoff()
        );
        assert!(!fallback_content_commit.suspense_boundary_rendering_executed());
        assert!(!fallback_content_commit.fallback_traversal_executed());
        assert!(!fallback_content_commit.wakeable_subscription_performed());
        assert!(!fallback_content_commit.public_suspense_compatibility_claimed());
        assert!(!fallback_content_commit.public_root_compatibility_claimed());

        assert_eq!(
            store.update_queues().update(retry_update).unwrap().lane(),
            Lanes::from(Lane::RETRY_2)
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().suspended_lanes(),
            Lanes::NO
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pinged_lanes(),
            Lanes::NO
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(primary_child)
                .unwrap()
                .return_fiber(),
            Some(primary)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fallback_child)
                .unwrap()
                .return_fiber(),
            Some(fallback)
        );
    }

    #[test]
    fn root_work_loop_preflight_and_complete_handoff_report_suspense_offscreen_child_shapes() {
        let (mut suspense_store, suspense_root, mut suspense_host) = root_store();
        let mut suspense_source = TestHostTree::new();
        let suspense_element = suspense_source.insert_host_element_with_text("section", "blocked");
        let suspense_current = suspense_store.root(suspense_root).unwrap().current();
        update_container(&mut suspense_store, suspense_root, suspense_element, None).unwrap();
        let suspense_render =
            render_host_root_for_lanes(&mut suspense_store, suspense_root, Lanes::DEFAULT).unwrap();
        let (suspense, primary, primary_child, fallback, fallback_child) =
            attach_suspense_wip_child_with_primary_and_fallback(
                &mut suspense_store,
                suspense_render.work_in_progress(),
            );
        let mut suspense_registry = TestFunctionComponentRegistry::default();

        let suspense_preflight = preflight_host_root_child_begin_work(
            &mut suspense_store,
            suspense_root,
            suspense_render.work_in_progress(),
            Lanes::from(Lane::RETRY_1),
            &mut suspense_registry,
        )
        .unwrap_err();

        match suspense_preflight {
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape {
                root,
                host_root_work_in_progress,
                suspense: record,
            } => {
                assert_eq!(root, suspense_root);
                assert_eq!(
                    host_root_work_in_progress,
                    suspense_render.work_in_progress()
                );
                assert_eq!(record.fiber(), suspense);
                assert_eq!(record.key().map(ReactKey::as_str), Some("boundary"));
                assert_eq!(record.pending_props(), PropsHandle::from_raw(741));
                assert_eq!(record.memoized_state(), StateHandle::from_raw(742));
                assert_eq!(record.child(), Some(primary));
                assert_eq!(record.child_tag(), Some(FiberTag::Offscreen));
                assert_eq!(record.fallback_child(), Some(fallback));
                assert_eq!(record.fallback_child_tag(), Some(FiberTag::Fragment));
                assert_eq!(
                    record.shape(),
                    UnsupportedSuspenseChildShapeKind::PrimaryOffscreenWithFallback
                );
                assert_eq!(record.render_lanes(), Lanes::from(Lane::RETRY_1));
                let thenable = record.thenable_ping_blocker();
                assert_eq!(
                    thenable.thenable_identity_class(),
                    UnsupportedThenableIdentityClass::OpaqueWakeable
                );
                assert_eq!(thenable.ping_lane(), Lane::RETRY_1);
                assert_eq!(thenable.ping_lanes(), Lanes::from(Lane::RETRY_1));
                assert_eq!(
                    thenable.retry_queue_kind(),
                    UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
                );
                assert_eq!(thenable.retry_queue(), UpdateQueueHandle::from_raw(747));
                assert_eq!(
                    thenable.primary_offscreen_retry_queue(),
                    Some(UpdateQueueHandle::from_raw(748))
                );
                assert!(!thenable.schedule_retry_flag());
                assert!(thenable.primary_child_rendering_blocked());
                assert!(thenable.fallback_child_rendering_blocked());
                assert_eq!(record.feature(), SUSPENSE_UNSUPPORTED_FEATURE);
            }
            other => panic!("expected Suspense child-shape preflight, got {other:?}"),
        }

        let suspense_complete_error = handoff_completed_host_root_render_to_test_complete_work(
            &mut suspense_store,
            &mut suspense_host,
            suspense_render,
            &suspense_source,
        )
        .unwrap_err();

        match suspense_complete_error {
            HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
                HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape {
                    root,
                    host_root_work_in_progress,
                    suspense: record,
                } => {
                    assert_eq!(root, suspense_root);
                    assert_eq!(
                        host_root_work_in_progress,
                        suspense_render.work_in_progress()
                    );
                    assert_eq!(record.fiber(), suspense);
                    assert_eq!(
                        record.shape(),
                        UnsupportedSuspenseChildShapeKind::PrimaryOffscreenWithFallback
                    );
                    assert_eq!(record.child(), Some(primary));
                    assert_eq!(record.fallback_child(), Some(fallback));
                    assert_eq!(record.render_lanes(), suspense_render.render_lanes());
                    assert_eq!(
                        record.thenable_ping_blocker().ping_lane(),
                        suspense_render.render_lanes().highest_priority_lane()
                    );
                    assert_eq!(
                        record.thenable_ping_blocker().retry_queue_kind(),
                        UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
                    );
                }
                other => panic!("expected Suspense child-shape preflight, got {other:?}"),
            },
            other => panic!("expected complete-work child preflight, got {other:?}"),
        }
        assert!(suspense_registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &suspense_store,
            &suspense_host,
            suspense_root,
            suspense_current,
            suspense_render,
            suspense,
        );
        assert_eq!(
            suspense_store
                .fiber_arena()
                .get(primary_child)
                .unwrap()
                .return_fiber(),
            Some(primary)
        );
        assert_eq!(
            suspense_store
                .fiber_arena()
                .get(fallback_child)
                .unwrap()
                .return_fiber(),
            Some(fallback)
        );

        let (mut offscreen_store, offscreen_root, mut offscreen_host) = root_store();
        let mut offscreen_source = TestHostTree::new();
        let offscreen_element = offscreen_source.insert_host_element_with_text("aside", "blocked");
        let offscreen_current = offscreen_store.root(offscreen_root).unwrap().current();
        update_container(
            &mut offscreen_store,
            offscreen_root,
            offscreen_element,
            None,
        )
        .unwrap();
        let offscreen_render =
            render_host_root_for_lanes(&mut offscreen_store, offscreen_root, Lanes::DEFAULT)
                .unwrap();
        let (offscreen, first_child, second_child) = attach_offscreen_wip_child_with_descendants(
            &mut offscreen_store,
            offscreen_render.work_in_progress(),
        );
        let mut offscreen_registry = TestFunctionComponentRegistry::default();

        let offscreen_preflight = preflight_host_root_child_begin_work(
            &mut offscreen_store,
            offscreen_root,
            offscreen_render.work_in_progress(),
            Lanes::OFFSCREEN,
            &mut offscreen_registry,
        )
        .unwrap_err();

        match offscreen_preflight {
            HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
                root,
                host_root_work_in_progress,
                offscreen: record,
            } => {
                assert_eq!(root, offscreen_root);
                assert_eq!(
                    host_root_work_in_progress,
                    offscreen_render.work_in_progress()
                );
                assert_eq!(record.fiber(), offscreen);
                assert_eq!(record.key().map(ReactKey::as_str), Some("hidden"));
                assert_eq!(record.pending_props(), PropsHandle::from_raw(751));
                assert_eq!(record.memoized_props(), PropsHandle::from_raw(752));
                assert_eq!(record.memoized_state(), StateHandle::from_raw(753));
                assert_eq!(record.state_node(), StateNodeHandle::from_raw(754));
                assert_eq!(record.child(), Some(first_child));
                assert_eq!(record.child_tag(), Some(FiberTag::HostText));
                assert_eq!(record.child_sibling(), Some(second_child));
                assert_eq!(record.child_sibling_tag(), Some(FiberTag::HostComponent));
                assert_eq!(
                    record.shape(),
                    UnsupportedOffscreenChildShapeKind::MultipleChildren
                );
                assert_eq!(record.render_lanes(), Lanes::OFFSCREEN);
                let thenable = record.thenable_ping_blocker();
                assert_eq!(
                    thenable.thenable_identity_class(),
                    UnsupportedThenableIdentityClass::OpaqueWakeableAndSuspenseyCommitResource
                );
                assert_eq!(thenable.ping_lane(), Lane::OFFSCREEN);
                assert_eq!(thenable.ping_lanes(), Lanes::OFFSCREEN);
                assert_eq!(
                    thenable.retry_queue_kind(),
                    UnsupportedThenableRetryQueueKind::Offscreen
                );
                assert_eq!(thenable.retry_queue(), UpdateQueueHandle::from_raw(757));
                assert_eq!(thenable.primary_offscreen_retry_queue(), None);
                assert!(thenable.schedule_retry_flag());
                assert!(thenable.primary_child_rendering_blocked());
                assert!(!thenable.fallback_child_rendering_blocked());
                assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
            }
            other => panic!("expected Offscreen child-shape preflight, got {other:?}"),
        }

        let offscreen_complete_error = handoff_completed_host_root_render_to_test_complete_work(
            &mut offscreen_store,
            &mut offscreen_host,
            offscreen_render,
            &offscreen_source,
        )
        .unwrap_err();

        match offscreen_complete_error {
            HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
                HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
                    root,
                    host_root_work_in_progress,
                    offscreen: record,
                } => {
                    assert_eq!(root, offscreen_root);
                    assert_eq!(
                        host_root_work_in_progress,
                        offscreen_render.work_in_progress()
                    );
                    assert_eq!(record.fiber(), offscreen);
                    assert_eq!(
                        record.shape(),
                        UnsupportedOffscreenChildShapeKind::MultipleChildren
                    );
                    assert_eq!(record.child(), Some(first_child));
                    assert_eq!(record.child_sibling(), Some(second_child));
                    assert_eq!(record.render_lanes(), offscreen_render.render_lanes());
                    assert_eq!(
                        record.thenable_ping_blocker().retry_queue_kind(),
                        UnsupportedThenableRetryQueueKind::Offscreen
                    );
                    assert!(record.thenable_ping_blocker().schedule_retry_flag());
                }
                other => panic!("expected Offscreen child-shape preflight, got {other:?}"),
            },
            other => panic!("expected complete-work child preflight, got {other:?}"),
        }
        assert!(offscreen_registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &offscreen_store,
            &offscreen_host,
            offscreen_root,
            offscreen_current,
            offscreen_render,
            offscreen,
        );
        assert_eq!(
            offscreen_store
                .fiber_arena()
                .get(first_child)
                .unwrap()
                .return_fiber(),
            Some(offscreen)
        );
        assert_eq!(
            offscreen_store
                .fiber_arena()
                .get(second_child)
                .unwrap()
                .return_fiber(),
            Some(offscreen)
        );
    }

    #[test]
    fn root_work_loop_offscreen_hidden_lane_reveal_commit_gate_records_private_metadata() {
        let (mut store, root_id, mut host) = root_store();
        let hidden_callback = RootUpdateCallbackHandle::from_raw(7601);
        let hidden_update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(7601),
            Some(hidden_callback),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(hidden_update.update())
            .unwrap();
        let retained_hidden_lanes = store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_hidden_update(hidden_update.lane())
            .unwrap();
        assert_eq!(
            retained_hidden_lanes,
            Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
        );

        let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
        let render = render_host_root_for_lanes(&mut store, root_id, render_lanes).unwrap();
        let (previous, offscreen, child, host_root_work_in_progress) =
            attach_offscreen_reveal_wip_child(
                &mut store,
                render.work_in_progress(),
                FiberTag::HostComponent,
            );
        let begin_work = offscreen_begin_work_record_from_host_root_preflight(
            &mut store,
            root_id,
            render.work_in_progress(),
            render_lanes,
        );
        let complete_work = complete_offscreen_visibility_transition_blocker_for_test(
            store.fiber_arena(),
            offscreen,
            &begin_work,
            render_lanes,
        )
        .unwrap();

        let record = offscreen_hidden_lane_reveal_commit_gate_for_test(
            &store,
            root_id,
            render.work_in_progress(),
            offscreen,
            hidden_update.update(),
            hidden_update.lane(),
            &begin_work,
            &complete_work,
            render_lanes,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            host_root_work_in_progress
        );
        assert_eq!(record.offscreen(), offscreen);
        assert_eq!(record.hidden_update(), hidden_update.update());
        assert_eq!(record.hidden_update_lane(), Lane::DEFAULT);
        assert_eq!(
            record.retained_hidden_update_lanes(),
            Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
        );
        assert_eq!(record.hidden_update_count(), 1);
        assert_eq!(record.begin_work().fiber(), offscreen);
        assert_eq!(
            record.begin_work().shape(),
            UnsupportedOffscreenChildShapeKind::SingleChild
        );
        let begin_transition = record
            .begin_work()
            .visibility_transition()
            .expect("reveal begin-work transition");
        assert_eq!(begin_transition.previous(), previous);
        assert!(begin_transition.is_hidden_to_visible_reveal());
        assert!(begin_transition.records_offscreen_lane_participation());
        assert_eq!(record.complete_work().offscreen(), offscreen);
        assert_eq!(record.complete_work().child(), Some(child));
        assert_eq!(
            record
                .complete_work()
                .subtree_flag_bubbling_intent()
                .as_str(),
            "bubble-visible-subtree"
        );
        assert!(record.complete_work().would_schedule_visibility_effect());
        assert!(
            !record
                .complete_work()
                .flags()
                .contains_any(FiberFlags::VISIBILITY)
        );

        let reveal = record.reveal_commit();
        assert_eq!(reveal.offscreen(), offscreen);
        assert_eq!(reveal.child(), child);
        assert_eq!(reveal.child_tag(), FiberTag::HostComponent);
        assert_eq!(reveal.committed_lanes(), render_lanes);
        assert_eq!(
            reveal.status().as_str(),
            "accepted-hidden-to-visible-reveal"
        );
        assert_eq!(
            reveal.suspensey_commit_flag(),
            FiberFlags::MAY_SUSPEND_COMMIT
        );
        assert!(reveal.child_may_suspend_commit());
        assert!(reveal.would_accumulate_newly_visible_suspensey_commit());
        assert!(reveal.would_unhide_host_children());
        assert!(reveal.visibility_effect_required());
        assert!(!reveal.visibility_flag_set());
        assert!(reveal.host_visibility_mutation_blocked());
        assert!(reveal.passive_visibility_effects_blocked());
        assert!(reveal.public_compatibility_blocked());
        assert!(record.child_traversal_blocked());
        assert!(record.host_visibility_mutation_blocked());
        assert!(record.passive_visibility_effects_deferred());
        assert!(record.public_offscreen_compatibility_blocked());
        assert!(record.public_passive_compatibility_blocked());
        assert!(record.public_activity_compatibility_blocked());

        let source = TestHostTree::new();
        let public_complete_error = handoff_completed_host_root_render_to_test_complete_work(
            &mut store, &mut host, render, &source,
        )
        .unwrap_err();
        match public_complete_error {
            HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
                HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
                    offscreen: record,
                    ..
                } => {
                    assert_eq!(record.fiber(), offscreen);
                    assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
                }
                other => panic!("expected Offscreen public blocker, got {other:?}"),
            },
            other => panic!("expected child preflight blocker, got {other:?}"),
        }
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_work_loop_offscreen_hidden_lane_reveal_commit_gate_rejects_stale_records_and_children()
    {
        let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);

        let (mut store, root_id, _host) = root_store();
        let hidden_update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(7611),
            Some(RootUpdateCallbackHandle::from_raw(7611)),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(hidden_update.update())
            .unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_hidden_update(hidden_update.lane())
            .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, render_lanes).unwrap();
        let (_, offscreen, _, _) = attach_offscreen_reveal_wip_child(
            &mut store,
            render.work_in_progress(),
            FiberTag::HostText,
        );
        let begin_work = offscreen_begin_work_record_from_host_root_preflight(
            &mut store,
            root_id,
            render.work_in_progress(),
            render_lanes,
        );
        let complete_work = complete_offscreen_visibility_transition_blocker_for_test(
            store.fiber_arena(),
            offscreen,
            &begin_work,
            render_lanes,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .get_mut(offscreen)
            .unwrap()
            .set_memoized_props(PropsHandle::from_raw(7612));
        assert_eq!(
            offscreen_hidden_lane_reveal_commit_gate_for_test(
                &store,
                root_id,
                render.work_in_progress(),
                offscreen,
                hidden_update.update(),
                hidden_update.lane(),
                &begin_work,
                &complete_work,
                render_lanes,
            ),
            Err(OffscreenHiddenLaneRevealCommitGateError::StaleBeginWorkRecord { offscreen })
        );

        let (mut store, root_id, _host) = root_store();
        let hidden_update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(7621),
            Some(RootUpdateCallbackHandle::from_raw(7621)),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(hidden_update.update())
            .unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_hidden_update(hidden_update.lane())
            .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, render_lanes).unwrap();
        let (_, offscreen, child, _) = attach_offscreen_reveal_wip_child(
            &mut store,
            render.work_in_progress(),
            FiberTag::HostText,
        );
        let begin_work = offscreen_begin_work_record_from_host_root_preflight(
            &mut store,
            root_id,
            render.work_in_progress(),
            render_lanes,
        );
        let complete_work = complete_offscreen_visibility_transition_blocker_for_test(
            store.fiber_arena(),
            offscreen,
            &begin_work,
            render_lanes,
        )
        .unwrap();
        store
            .fiber_arena_mut()
            .get_mut(child)
            .unwrap()
            .merge_flags(FiberFlags::UPDATE);
        assert_eq!(
            offscreen_hidden_lane_reveal_commit_gate_for_test(
                &store,
                root_id,
                render.work_in_progress(),
                offscreen,
                hidden_update.update(),
                hidden_update.lane(),
                &begin_work,
                &complete_work,
                render_lanes,
            ),
            Err(OffscreenHiddenLaneRevealCommitGateError::StaleCompleteWorkRecord { offscreen })
        );

        let (mut store, root_id, _host) = root_store();
        let hidden_update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(7631),
            Some(RootUpdateCallbackHandle::from_raw(7631)),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(hidden_update.update())
            .unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_hidden_update(hidden_update.lane())
            .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, render_lanes).unwrap();
        let (_, offscreen, child, _) = attach_offscreen_reveal_wip_child(
            &mut store,
            render.work_in_progress(),
            FiberTag::Fragment,
        );
        let begin_work = offscreen_begin_work_record_from_host_root_preflight(
            &mut store,
            root_id,
            render.work_in_progress(),
            render_lanes,
        );
        let complete_work = complete_offscreen_visibility_transition_blocker_for_test(
            store.fiber_arena(),
            offscreen,
            &begin_work,
            render_lanes,
        )
        .unwrap();
        match offscreen_hidden_lane_reveal_commit_gate_for_test(
            &store,
            root_id,
            render.work_in_progress(),
            offscreen,
            hidden_update.update(),
            hidden_update.lane(),
            &begin_work,
            &complete_work,
            render_lanes,
        ) {
            Err(OffscreenHiddenLaneRevealCommitGateError::RevealCommit(
                OffscreenRevealCommitMetadataError::UnsupportedOffscreenChild {
                    offscreen: rejected_offscreen,
                    child: rejected_child,
                    child_tag,
                    child_sibling,
                    child_sibling_tag,
                },
            )) => {
                assert_eq!(rejected_offscreen, offscreen);
                assert_eq!(rejected_child, child);
                assert_eq!(child_tag, FiberTag::Fragment);
                assert_eq!(child_sibling, None);
                assert_eq!(child_sibling_tag, None);
            }
            other => panic!("expected unsupported Offscreen child rejection, got {other:?}"),
        }
    }

    #[test]
    fn root_work_loop_preflight_and_complete_handoff_report_suspense_list_activity_child_shapes() {
        let (mut list_store, list_root, mut list_host) = root_store();
        let mut list_source = TestHostTree::new();
        let list_element = list_source.insert_host_element_with_text("section", "blocked");
        let list_current = list_store.root(list_root).unwrap().current();
        update_container(&mut list_store, list_root, list_element, None).unwrap();
        let list_render =
            render_host_root_for_lanes(&mut list_store, list_root, Lanes::DEFAULT).unwrap();
        let (suspense_list, first_row, second_row) = attach_suspense_list_wip_child_with_rows(
            &mut list_store,
            list_render.work_in_progress(),
        );
        let mut list_registry = TestFunctionComponentRegistry::default();

        let list_preflight = preflight_host_root_child_begin_work(
            &mut list_store,
            list_root,
            list_render.work_in_progress(),
            Lanes::from(Lane::RETRY_3),
            &mut list_registry,
        )
        .unwrap_err();

        match list_preflight {
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseListChildShape {
                root,
                host_root_work_in_progress,
                suspense_list: record,
            } => {
                assert_eq!(root, list_root);
                assert_eq!(host_root_work_in_progress, list_render.work_in_progress());
                assert_eq!(record.fiber(), suspense_list);
                assert_eq!(record.key().map(ReactKey::as_str), Some("rows"));
                assert_eq!(record.pending_props(), PropsHandle::from_raw(761));
                assert_eq!(record.memoized_props(), PropsHandle::from_raw(762));
                assert_eq!(record.memoized_state(), StateHandle::from_raw(763));
                assert_eq!(record.child(), Some(first_row));
                assert_eq!(record.child_tag(), Some(FiberTag::Suspense));
                assert_eq!(record.child_sibling(), Some(second_row));
                assert_eq!(record.child_sibling_tag(), Some(FiberTag::Suspense));
                assert_eq!(
                    record.shape(),
                    UnsupportedSuspenseListChildShapeKind::MultipleChildren
                );
                assert_eq!(record.render_lanes(), Lanes::from(Lane::RETRY_3));
                assert_eq!(record.feature(), SUSPENSE_LIST_UNSUPPORTED_FEATURE);
            }
            other => panic!("expected SuspenseList child-shape preflight, got {other:?}"),
        }

        let list_complete_error = handoff_completed_host_root_render_to_test_complete_work(
            &mut list_store,
            &mut list_host,
            list_render,
            &list_source,
        )
        .unwrap_err();

        match list_complete_error {
            HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
                HostRootChildBeginWorkPreflightError::UnsupportedSuspenseListChildShape {
                    root,
                    host_root_work_in_progress,
                    suspense_list: record,
                } => {
                    assert_eq!(root, list_root);
                    assert_eq!(host_root_work_in_progress, list_render.work_in_progress());
                    assert_eq!(record.fiber(), suspense_list);
                    assert_eq!(
                        record.shape(),
                        UnsupportedSuspenseListChildShapeKind::MultipleChildren
                    );
                    assert_eq!(record.child(), Some(first_row));
                    assert_eq!(record.child_sibling(), Some(second_row));
                    assert_eq!(record.render_lanes(), list_render.render_lanes());
                }
                other => panic!("expected SuspenseList child-shape preflight, got {other:?}"),
            },
            other => panic!("expected complete-work child preflight, got {other:?}"),
        }
        assert!(list_registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &list_store,
            &list_host,
            list_root,
            list_current,
            list_render,
            suspense_list,
        );
        assert_eq!(
            list_store
                .fiber_arena()
                .get(first_row)
                .unwrap()
                .return_fiber(),
            Some(suspense_list)
        );
        assert_eq!(
            list_store
                .fiber_arena()
                .get(second_row)
                .unwrap()
                .return_fiber(),
            Some(suspense_list)
        );

        let (mut activity_store, activity_root, mut activity_host) = root_store();
        let mut activity_source = TestHostTree::new();
        let activity_element = activity_source.insert_host_element_with_text("aside", "blocked");
        let activity_current = activity_store.root(activity_root).unwrap().current();
        update_container(&mut activity_store, activity_root, activity_element, None).unwrap();
        let activity_render =
            render_host_root_for_lanes(&mut activity_store, activity_root, Lanes::DEFAULT).unwrap();
        let (activity, primary, primary_child) = attach_activity_wip_child_with_primary(
            &mut activity_store,
            activity_render.work_in_progress(),
        );
        let mut activity_registry = TestFunctionComponentRegistry::default();

        let activity_preflight = preflight_host_root_child_begin_work(
            &mut activity_store,
            activity_root,
            activity_render.work_in_progress(),
            Lanes::from(Lane::RETRY_2),
            &mut activity_registry,
        )
        .unwrap_err();

        match activity_preflight {
            HostRootChildBeginWorkPreflightError::UnsupportedActivityChildShape {
                root,
                host_root_work_in_progress,
                activity: record,
            } => {
                assert_eq!(root, activity_root);
                assert_eq!(
                    host_root_work_in_progress,
                    activity_render.work_in_progress()
                );
                assert_eq!(record.fiber(), activity);
                assert_eq!(record.key().map(ReactKey::as_str), Some("activity"));
                assert_eq!(record.pending_props(), PropsHandle::from_raw(771));
                assert_eq!(record.memoized_props(), PropsHandle::from_raw(772));
                assert_eq!(record.memoized_state(), StateHandle::NONE);
                assert_eq!(record.state_node(), StateNodeHandle::from_raw(773));
                assert_eq!(record.child(), Some(primary));
                assert_eq!(record.child_tag(), Some(FiberTag::Offscreen));
                assert_eq!(record.child_sibling(), None);
                assert_eq!(record.child_sibling_tag(), None);
                assert_eq!(
                    record.shape(),
                    UnsupportedActivityChildShapeKind::PrimaryOffscreen
                );
                assert_eq!(record.render_lanes(), Lanes::from(Lane::RETRY_2));
                assert_eq!(record.feature(), ACTIVITY_UNSUPPORTED_FEATURE);
            }
            other => panic!("expected Activity child-shape preflight, got {other:?}"),
        }

        let activity_complete_error = handoff_completed_host_root_render_to_test_complete_work(
            &mut activity_store,
            &mut activity_host,
            activity_render,
            &activity_source,
        )
        .unwrap_err();

        match activity_complete_error {
            HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
                HostRootChildBeginWorkPreflightError::UnsupportedActivityChildShape {
                    root,
                    host_root_work_in_progress,
                    activity: record,
                } => {
                    assert_eq!(root, activity_root);
                    assert_eq!(
                        host_root_work_in_progress,
                        activity_render.work_in_progress()
                    );
                    assert_eq!(record.fiber(), activity);
                    assert_eq!(
                        record.shape(),
                        UnsupportedActivityChildShapeKind::PrimaryOffscreen
                    );
                    assert_eq!(record.child(), Some(primary));
                    assert_eq!(record.child_sibling(), None);
                    assert_eq!(record.render_lanes(), activity_render.render_lanes());
                }
                other => panic!("expected Activity child-shape preflight, got {other:?}"),
            },
            other => panic!("expected complete-work child preflight, got {other:?}"),
        }
        assert!(activity_registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &activity_store,
            &activity_host,
            activity_root,
            activity_current,
            activity_render,
            activity,
        );
        assert_eq!(
            activity_store
                .fiber_arena()
                .get(primary)
                .unwrap()
                .return_fiber(),
            Some(activity)
        );
        assert_eq!(
            activity_store
                .fiber_arena()
                .get(primary_child)
                .unwrap()
                .return_fiber(),
            Some(primary)
        );
    }

    #[test]
    fn root_work_loop_preflight_fails_closed_for_portal_child_without_delegating_or_mounting() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(21), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (portal, portal_child) = attach_portal_wip_child(&mut store, render.work_in_progress());
        let mut registry = TestFunctionComponentRegistry::default();

        let error = preflight_host_root_child_begin_work(
            &mut store,
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            &mut registry,
        )
        .unwrap_err();

        let portal_record = match error {
            HostRootChildBeginWorkPreflightError::UnsupportedPortal {
                root,
                host_root_work_in_progress,
                portal,
            } => {
                assert_eq!(root, root_id);
                assert_eq!(host_root_work_in_progress, render.work_in_progress());
                portal
            }
            other => panic!("expected portal admission diagnostic, got {other:?}"),
        };

        assert_eq!(portal_record.fiber(), portal);
        assert_eq!(
            portal_record.key().map(ReactKey::as_str),
            Some("portal-root")
        );
        assert_eq!(portal_record.pending_props(), PropsHandle::from_raw(701));
        assert_eq!(portal_record.state_node(), StateNodeHandle::from_raw(702));
        assert_eq!(portal_record.child(), Some(portal_child));
        assert_eq!(portal_record.render_lanes(), Lanes::DEFAULT);
        assert_eq!(
            portal_record.feature(),
            PORTAL_RECONCILER_UNSUPPORTED_FEATURE
        );
        assert!(registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &store, &host, root_id, current, render, portal,
        );

        let portal_node = store.fiber_arena().get(portal).unwrap();
        assert_eq!(portal_node.return_fiber(), Some(render.work_in_progress()));
        assert_eq!(portal_node.child(), Some(portal_child));
        assert_eq!(portal_node.memoized_props(), PropsHandle::NONE);
        assert_eq!(portal_node.lanes(), Lanes::NO);
        let portal_child_node = store.fiber_arena().get(portal_child).unwrap();
        assert_eq!(portal_child_node.return_fiber(), Some(portal));
        assert_eq!(portal_child_node.memoized_props(), PropsHandle::NONE);
        assert_eq!(portal_child_node.lanes(), Lanes::NO);
    }

    #[test]
    fn root_work_loop_preflight_delegates_single_host_child_fragment_without_mounting() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(22), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (fragment, fragment_child) =
            attach_fragment_wip_child_with_descendant(&mut store, render.work_in_progress());
        let mut registry = TestFunctionComponentRegistry::default();

        let record = preflight_host_root_child_begin_work(
            &mut store,
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            &mut registry,
        )
        .unwrap();
        let fragment_begin_work = record.begin_work().unwrap().fragment();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.child(), Some(fragment));
        assert_eq!(record.child_tag(), Some(FiberTag::Fragment));
        assert_eq!(record.render_lanes(), Lanes::DEFAULT);
        assert!(record.requires_begin_work());
        assert_eq!(fragment_begin_work.fragment(), fragment);
        assert_eq!(fragment_begin_work.current(), None);
        assert_eq!(fragment_begin_work.child(), fragment_child);
        assert_eq!(fragment_begin_work.child_tag(), FiberTag::HostText);
        assert_eq!(
            fragment_begin_work.pending_props(),
            PropsHandle::from_raw(801)
        );
        assert_eq!(
            fragment_begin_work.child_pending_props(),
            PropsHandle::from_raw(802)
        );
        assert_eq!(fragment_begin_work.render_lanes(), Lanes::DEFAULT);
        assert!(registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &store, &host, root_id, current, render, fragment,
        );

        let fragment_node = store.fiber_arena().get(fragment).unwrap();
        assert_eq!(fragment_node.child(), Some(fragment_child));
        assert_eq!(fragment_node.memoized_props(), PropsHandle::from_raw(801));
        assert_eq!(fragment_node.memoized_state(), StateHandle::NONE);
        assert_eq!(fragment_node.update_queue(), UpdateQueueHandle::NONE);
        assert_eq!(fragment_node.flags(), FiberFlags::NO);
        let fragment_child_node = store.fiber_arena().get(fragment_child).unwrap();
        assert_eq!(fragment_child_node.return_fiber(), Some(fragment));
        assert_eq!(fragment_child_node.lanes(), Lanes::NO);
        assert_eq!(fragment_child_node.flags(), FiberFlags::NO);
    }

    #[test]
    fn root_work_loop_preflight_fails_closed_for_keyed_multi_or_unsupported_fragment_children() {
        let (mut keyed_store, keyed_root_id, keyed_host) = root_store();
        let keyed_current = keyed_store.root(keyed_root_id).unwrap().current();
        update_container(
            &mut keyed_store,
            keyed_root_id,
            RootElementHandle::from_raw(23),
            None,
        )
        .unwrap();
        let keyed_render =
            render_host_root_for_lanes(&mut keyed_store, keyed_root_id, Lanes::DEFAULT).unwrap();
        let (keyed_fragment, keyed_child) = attach_keyed_fragment_wip_child_with_descendant(
            &mut keyed_store,
            keyed_render.work_in_progress(),
        );
        let mut registry = TestFunctionComponentRegistry::default();

        let keyed_error = preflight_host_root_child_begin_work(
            &mut keyed_store,
            keyed_root_id,
            keyed_render.work_in_progress(),
            Lanes::DEFAULT,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            keyed_error,
            HostRootChildBeginWorkPreflightError::BeginWork(
                BeginWorkError::FragmentSingleHostChild(
                    FragmentSingleHostChildBeginWorkError::KeyedFragmentUnsupported {
                        fragment: keyed_fragment,
                        key: ReactKey::from_normalized("fragment-key"),
                    },
                ),
            )
        );
        assert!(registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &keyed_store,
            &keyed_host,
            keyed_root_id,
            keyed_current,
            keyed_render,
            keyed_fragment,
        );
        assert_eq!(
            keyed_store
                .fiber_arena()
                .get(keyed_fragment)
                .unwrap()
                .memoized_props(),
            PropsHandle::NONE
        );
        assert_eq!(
            keyed_store
                .fiber_arena()
                .get(keyed_child)
                .unwrap()
                .return_fiber(),
            Some(keyed_fragment)
        );

        let (mut multi_store, multi_root_id, multi_host) = root_store();
        let multi_current = multi_store.root(multi_root_id).unwrap().current();
        update_container(
            &mut multi_store,
            multi_root_id,
            RootElementHandle::from_raw(24),
            None,
        )
        .unwrap();
        let multi_render =
            render_host_root_for_lanes(&mut multi_store, multi_root_id, Lanes::DEFAULT).unwrap();
        let (multi_fragment, first_child, sibling) =
            attach_fragment_wip_child_with_two_host_descendants(
                &mut multi_store,
                multi_render.work_in_progress(),
            );

        let multi_error = preflight_host_root_child_begin_work(
            &mut multi_store,
            multi_root_id,
            multi_render.work_in_progress(),
            Lanes::DEFAULT,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            multi_error,
            HostRootChildBeginWorkPreflightError::BeginWork(
                BeginWorkError::FragmentSingleHostChild(
                    FragmentSingleHostChildBeginWorkError::MultipleChildren {
                        fragment: multi_fragment,
                        first_child,
                        sibling,
                    },
                ),
            )
        );
        assert_client_root_fail_closed_without_side_effects(
            &multi_store,
            &multi_host,
            multi_root_id,
            multi_current,
            multi_render,
            multi_fragment,
        );
        assert_eq!(
            multi_store
                .fiber_arena()
                .get(multi_fragment)
                .unwrap()
                .memoized_props(),
            PropsHandle::NONE
        );

        for tag in [
            FiberTag::Portal,
            FiberTag::Suspense,
            FiberTag::Offscreen,
            FiberTag::Activity,
            FiberTag::ViewTransition,
            FiberTag::SuspenseList,
        ] {
            let (mut store, root_id, host) = root_store();
            let current = store.root(root_id).unwrap().current();
            update_container(&mut store, root_id, RootElementHandle::from_raw(25), None).unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let (fragment, unsupported_child) = attach_fragment_wip_child_with_tagged_descendant(
                &mut store,
                render.work_in_progress(),
                tag,
            );

            let error = preflight_host_root_child_begin_work(
                &mut store,
                root_id,
                render.work_in_progress(),
                Lanes::DEFAULT,
                &mut registry,
            )
            .unwrap_err();

            assert_eq!(
                error,
                HostRootChildBeginWorkPreflightError::BeginWork(
                    BeginWorkError::FragmentSingleHostChild(
                        FragmentSingleHostChildBeginWorkError::UnsupportedChildTag {
                            fragment,
                            child: unsupported_child,
                            tag,
                        },
                    ),
                )
            );
            assert_client_root_fail_closed_without_side_effects(
                &store, &host, root_id, current, render, fragment,
            );
            assert_eq!(
                store
                    .fiber_arena()
                    .get(unsupported_child)
                    .unwrap()
                    .return_fiber(),
                Some(fragment)
            );
            assert_eq!(
                store.fiber_arena().get(fragment).unwrap().memoized_props(),
                PropsHandle::NONE
            );
        }

        assert!(registry.calls().is_empty());
    }

    #[test]
    fn root_work_loop_complete_work_handoff_preserves_unsupported_root_child_preflight() {
        for (tag, feature) in [
            (FiberTag::Suspense, SUSPENSE_UNSUPPORTED_FEATURE),
            (FiberTag::Offscreen, OFFSCREEN_UNSUPPORTED_FEATURE),
            (FiberTag::Activity, ACTIVITY_UNSUPPORTED_FEATURE),
            (
                FiberTag::ViewTransition,
                VIEW_TRANSITION_UNSUPPORTED_FEATURE,
            ),
            (FiberTag::SuspenseList, SUSPENSE_LIST_UNSUPPORTED_FEATURE),
        ] {
            let (mut store, root_id, mut host) = root_store();
            let mut source = TestHostTree::new();
            let element = source.insert_host_element_with_text("section", "blocked");
            let current = store.root(root_id).unwrap().current();
            update_container(&mut store, root_id, element, None).unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let child = attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag);

            let error = handoff_completed_host_root_render_to_test_complete_work(
                &mut store, &mut host, render, &source,
            )
            .unwrap_err();

            match error {
                HostRootCompleteWorkHandoffError::ChildPreflight(error) => {
                    assert_root_child_preflight_blocks_unsupported_tag(
                        *error,
                        root_id,
                        render.work_in_progress(),
                        child,
                        tag,
                        feature,
                        render.render_lanes(),
                    );
                }
                other => panic!("expected child preflight error, got {other:?}"),
            }
            assert_client_root_fail_closed_without_side_effects(
                &store, &host, root_id, current, render, child,
            );
            let child_node = store.fiber_arena().get(child).unwrap();
            assert_eq!(child_node.child(), None);
            assert_eq!(child_node.memoized_props(), PropsHandle::NONE);
            assert_eq!(child_node.flags(), FiberFlags::NO);
        }

        let (mut portal_store, portal_root_id, mut portal_host) = root_store();
        let mut portal_source = TestHostTree::new();
        let portal_element = portal_source.insert_host_element_with_text("section", "blocked");
        let portal_current = portal_store.root(portal_root_id).unwrap().current();
        update_container(&mut portal_store, portal_root_id, portal_element, None).unwrap();
        let portal_render =
            render_host_root_for_lanes(&mut portal_store, portal_root_id, Lanes::DEFAULT).unwrap();
        let (portal, portal_child) =
            attach_portal_wip_child(&mut portal_store, portal_render.work_in_progress());

        let portal_error = handoff_completed_host_root_render_to_test_complete_work(
            &mut portal_store,
            &mut portal_host,
            portal_render,
            &portal_source,
        )
        .unwrap_err();

        match portal_error {
            HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
                HostRootChildBeginWorkPreflightError::UnsupportedPortal {
                    root,
                    host_root_work_in_progress,
                    portal: record,
                } => {
                    assert_eq!(root, portal_root_id);
                    assert_eq!(host_root_work_in_progress, portal_render.work_in_progress());
                    assert_eq!(record.fiber(), portal);
                    assert_eq!(record.child(), Some(portal_child));
                    assert_eq!(record.feature(), PORTAL_RECONCILER_UNSUPPORTED_FEATURE);
                }
                other => panic!("expected portal preflight diagnostic, got {other:?}"),
            },
            other => panic!("expected child preflight error, got {other:?}"),
        }
        assert_client_root_fail_closed_without_side_effects(
            &portal_store,
            &portal_host,
            portal_root_id,
            portal_current,
            portal_render,
            portal,
        );
        assert_eq!(
            portal_store
                .fiber_arena()
                .get(portal_child)
                .unwrap()
                .return_fiber(),
            Some(portal)
        );

        let (mut fragment_store, fragment_root_id, mut fragment_host) = root_store();
        let mut fragment_source = TestHostTree::new();
        let fragment_element = fragment_source.insert_host_element_with_text("section", "blocked");
        let fragment_current = fragment_store.root(fragment_root_id).unwrap().current();
        update_container(
            &mut fragment_store,
            fragment_root_id,
            fragment_element,
            None,
        )
        .unwrap();
        let fragment_render =
            render_host_root_for_lanes(&mut fragment_store, fragment_root_id, Lanes::DEFAULT)
                .unwrap();
        let (fragment, fragment_child) = attach_fragment_wip_child_with_descendant(
            &mut fragment_store,
            fragment_render.work_in_progress(),
        );

        let fragment_error = handoff_completed_host_root_render_to_test_complete_work(
            &mut fragment_store,
            &mut fragment_host,
            fragment_render,
            &fragment_source,
        )
        .unwrap_err();

        assert_eq!(
            fragment_error,
            HostRootCompleteWorkHandoffError::UnexpectedExistingRootChild {
                root: fragment_root_id,
                host_root_work_in_progress: fragment_render.work_in_progress(),
                child: fragment,
                tag: FiberTag::Fragment,
            }
        );
        assert_client_root_fail_closed_without_side_effects(
            &fragment_store,
            &fragment_host,
            fragment_root_id,
            fragment_current,
            fragment_render,
            fragment,
        );
        let fragment_node = fragment_store.fiber_arena().get(fragment).unwrap();
        assert_eq!(fragment_node.memoized_props(), PropsHandle::NONE);
        assert_eq!(fragment_node.child(), Some(fragment_child));
        assert_eq!(
            fragment_store
                .fiber_arena()
                .get(fragment_child)
                .unwrap()
                .return_fiber(),
            Some(fragment)
        );
    }

    #[test]
    fn root_work_loop_preflight_fails_closed_through_begin_work_for_unhandled_child_tags() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(20), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let child =
            attach_wip_child_with_tag(&mut store, render.work_in_progress(), FiberTag::HostText);
        let mut registry = TestFunctionComponentRegistry::default();

        let error = preflight_host_root_child_begin_work(
            &mut store,
            root_id,
            render.work_in_progress(),
            Lanes::DEFAULT,
            &mut registry,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootChildBeginWorkPreflightError::BeginWork(BeginWorkError::UnsupportedFiberTag {
                fiber: child,
                tag: FiberTag::HostText,
            },)
        );
        assert!(registry.calls().is_empty());
    }

    #[test]
    fn root_work_loop_hands_host_component_child_to_test_complete_work() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("section", "complete");
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let record = handoff_completed_host_root_render_to_test_complete_work(
            &mut store, &mut host, render, &source,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.root_child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(record.render_lanes(), Lanes::DEFAULT);
        assert_eq!(record.resulting_element(), element);
        assert_eq!(record.detached_instance_count(), 1);
        assert_eq!(record.detached_text_count(), 1);

        let child = record.root_child().unwrap();
        let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
        assert_eq!(root_node.child(), Some(child));
        assert!(
            root_node
                .subtree_flags()
                .contains_all(FiberFlags::PLACEMENT)
        );
        assert_eq!(root_node.child_lanes(), Lanes::NO);
        let child_node = store.fiber_arena().get(child).unwrap();
        assert_eq!(child_node.tag(), FiberTag::HostComponent);
        assert!(child_node.state_node().is_some());
        assert!(child_node.flags().contains_all(FiberFlags::PLACEMENT));

        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .render_exit_status(),
            RootRenderExitStatus::Completed
        );
        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
            ]
        );
    }

    #[test]
    fn root_work_loop_hands_host_text_child_to_test_complete_work() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_text("root text");
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let record = handoff_completed_host_root_render_to_test_complete_work(
            &mut store, &mut host, render, &source,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.root_child_tag(), Some(FiberTag::HostText));
        assert_eq!(record.resulting_element(), element);
        assert_eq!(record.detached_instance_count(), 0);
        assert_eq!(record.detached_text_count(), 1);

        let child = record.root_child().unwrap();
        let child_node = store.fiber_arena().get(child).unwrap();
        assert_eq!(child_node.tag(), FiberTag::HostText);
        assert_eq!(child_node.return_fiber(), Some(render.work_in_progress()));
        assert!(child_node.state_node().is_some());
        assert!(child_node.flags().contains_all(FiberFlags::PLACEMENT));

        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            host.operations(),
            vec!["root_host_context", "create_text_instance"]
        );
    }

    #[test]
    fn root_work_loop_complete_work_handoff_commits_host_component_tree_with_diagnostics() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("section", "commit handoff");
        let public_error = crate::render_mutation_placeholder(&mut host).unwrap_err();
        assert_eq!(
            public_error,
            ReconcilerError::unimplemented(MUTATION_RENDER_PLACEHOLDER_FEATURE)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());

        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let record = handoff_completed_host_root_render_to_test_complete_work_and_commit(
            &mut store, &mut host, render, &source,
        )
        .unwrap();

        let complete_work = record.complete_work();
        assert_eq!(complete_work.root(), root_id);
        assert_eq!(
            complete_work.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(
            complete_work.root_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(
            complete_work.completed_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(complete_work.root_child_count(), 1);
        assert_eq!(complete_work.completed_child_count(), 1);
        assert_eq!(complete_work.detached_instance_count(), 1);
        assert_eq!(complete_work.detached_text_count(), 1);
        let component = complete_work.root_child().unwrap();
        let text = store.fiber_arena().get(component).unwrap().child().unwrap();
        assert_eq!(
            store.fiber_arena().get(text).unwrap().tag(),
            FiberTag::HostText
        );

        let finished_work_handoff = record.finished_work_handoff();
        let pending_finished_work = finished_work_handoff.pending();
        assert_eq!(pending_finished_work.root(), root_id);
        assert_eq!(
            pending_finished_work.root_token(),
            root_id.state_node_handle()
        );
        assert_eq!(pending_finished_work.previous_current(), current);
        assert_eq!(
            pending_finished_work.pending_work(),
            Some(render.finished_work())
        );
        assert_eq!(
            pending_finished_work.finished_work(),
            render.finished_work()
        );
        assert_eq!(pending_finished_work.render_lanes(), Lanes::DEFAULT);
        assert_eq!(pending_finished_work.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(pending_finished_work.remaining_lanes(), Lanes::NO);
        assert_eq!(
            pending_finished_work.pending_lanes_before_commit(),
            Lanes::DEFAULT
        );
        assert_eq!(pending_finished_work.handoff_order(), 1);
        assert!(pending_finished_work.records_finished_work());
        assert_eq!(
            pending_finished_work.root_finished_work(),
            Some(render.finished_work())
        );
        assert_eq!(pending_finished_work.root_finished_lanes(), Lanes::DEFAULT);
        assert!(pending_finished_work.records_root_finished_work());
        let execution_request = *finished_work_handoff.execution_request();
        assert_eq!(
            execution_request.status(),
            HostRootFinishedWorkCommitExecutionStatusForCanary::Requested
        );
        assert!(execution_request.execution_requested());
        assert!(execution_request.accepted_current_finished_work_record_shape());
        assert_eq!(execution_request.root(), root_id);
        assert_eq!(execution_request.root_token(), root_id.state_node_handle());
        assert_eq!(execution_request.previous_current(), current);
        assert_eq!(
            execution_request.pending_work(),
            Some(render.finished_work())
        );
        assert_eq!(execution_request.finished_work(), render.finished_work());
        assert_eq!(execution_request.render_lanes(), Lanes::DEFAULT);
        assert_eq!(execution_request.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(
            execution_request.root_finished_work(),
            Some(render.finished_work())
        );
        assert_eq!(execution_request.root_finished_lanes(), Lanes::DEFAULT);
        assert_eq!(execution_request.remaining_lanes(), Lanes::NO);
        assert_eq!(
            execution_request.pending_lanes_before_commit(),
            Lanes::DEFAULT
        );
        assert_eq!(execution_request.source_handoff_order(), 1);
        assert_eq!(execution_request.request_order(), 2);
        assert_eq!(
            execution_request.blockers(),
            &[
                HostRootFinishedWorkCommitExecutionBlockerForCanary::HostMutationExecution,
                HostRootFinishedWorkCommitExecutionBlockerForCanary::PublicRootRendering,
                HostRootFinishedWorkCommitExecutionBlockerForCanary::RefAttachDetach,
                HostRootFinishedWorkCommitExecutionBlockerForCanary::LayoutEffectExecution,
                HostRootFinishedWorkCommitExecutionBlockerForCanary::PassiveEffectExecution,
                HostRootFinishedWorkCommitExecutionBlockerForCanary::Hydration,
                HostRootFinishedWorkCommitExecutionBlockerForCanary::PublicCompatibilityClaim,
            ]
        );
        assert!(execution_request.host_mutation_execution_blocked());
        assert!(execution_request.public_root_rendering_blocked());
        assert!(execution_request.ref_attach_detach_blocked());
        assert!(execution_request.layout_effect_execution_blocked());
        assert!(execution_request.passive_effect_execution_blocked());
        assert!(execution_request.hydration_blocked());
        assert!(execution_request.compatibility_claim_blocked());
        assert!(execution_request.refs_effects_and_hydration_blocked());
        assert_eq!(finished_work_handoff.commit_order(), 2);
        assert!(finished_work_handoff.commit_order_after_pending_record());
        assert_eq!(
            finished_work_handoff.current_after_commit(),
            render.work_in_progress()
        );
        assert_eq!(finished_work_handoff.finished_work_after_commit(), None);
        assert_eq!(
            finished_work_handoff.finished_lanes_after_commit(),
            Lanes::NO
        );
        assert_eq!(finished_work_handoff.render_phase_work_after_commit(), None);
        assert!(finished_work_handoff.consumed_finished_work_record());
        assert!(finished_work_handoff.mutation_execution_blocked());
        assert!(finished_work_handoff.public_root_rendering_blocked());
        assert!(finished_work_handoff.effects_refs_and_hydration_blocked());
        assert!(finished_work_handoff.proves_private_root_finished_work_commit_metadata_handoff());

        let commit = record.commit();
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), current);
        assert_eq!(commit.current(), render.work_in_progress());
        assert_eq!(commit.finished_work(), render.finished_work());
        assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.pending_lanes(), Lanes::NO);
        assert_eq!(commit.mutation_log().len(), 1);
        assert_eq!(commit.mutation_apply_log().len(), 1);
        assert!(commit.root_update_callbacks().is_empty());
        assert!(commit.host_node_deletion_cleanup_log().is_empty());
        assert!(record.host_operations_unchanged_by_commit());
        assert_eq!(
            record.host_operation_count_after_complete_work(),
            record.host_operation_count_after_commit()
        );
        assert!(record.public_render_blocked());

        let diagnostics = record.placement_apply_diagnostics();
        assert_eq!(diagnostics.len(), 1);
        let diagnostic = diagnostics[0];
        let component_state_node = store.fiber_arena().get(component).unwrap().state_node();
        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(diagnostic.host_root(), render.work_in_progress());
        assert_eq!(diagnostic.fiber(), component);
        assert_eq!(diagnostic.tag(), FiberTag::HostComponent);
        assert_eq!(diagnostic.tag_name(), "HostComponent");
        assert_eq!(diagnostic.state_node(), component_state_node);
        assert_eq!(diagnostic.apply_kind(), "append-placement-to-container");
        assert_eq!(diagnostic.sibling_status(), "append");
        assert_eq!(diagnostic.sibling(), None);
        assert!(!diagnostic.can_insert_before());

        let committed_root = store.root(root_id).unwrap();
        assert_eq!(committed_root.current(), render.work_in_progress());
        assert_eq!(committed_root.finished_work(), None);
        assert_eq!(committed_root.finished_lanes(), Lanes::NO);
        assert_eq!(committed_root.scheduling().work_in_progress(), None);
        assert_eq!(
            committed_root.scheduling().render_exit_status(),
            RootRenderExitStatus::NoWork
        );
        assert_eq!(store.fiber_arena().get(current).unwrap().child(), None);
        assert_eq!(
            store
                .fiber_arena()
                .get(render.work_in_progress())
                .unwrap()
                .child(),
            Some(component)
        );

        let public_error_after_private_commit =
            crate::render_mutation_placeholder(&mut host).unwrap_err();
        assert_eq!(
            public_error_after_private_commit,
            ReconcilerError::unimplemented(MUTATION_RENDER_PLACEHOLDER_FEATURE)
        );
        assert_eq!(
            host.operations().len(),
            record.host_operation_count_after_commit()
        );
    }

    #[test]
    fn root_work_loop_managed_child_placement_handoff_executes_private_append_child_after_commit() {
        let (mut store, root_id, mut host) = root_store();
        let mut fixture = prepare_root_work_loop_managed_child_append_execution_fixture(
            &mut store, &mut host, root_id, 82_800,
        );

        let handoff = commit_managed_child_complete_work_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_REQUEST_ORDER,
        )
        .unwrap();
        let diagnostic = apply_managed_child_complete_work_handoff_for_canary(
            &mut store,
            &mut host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(fixture.previous_current, fixture.render.current());
        assert_eq!(fixture.complete_work.root(), root_id);
        assert_eq!(
            fixture.complete_work.parent_current(),
            fixture.current_parent
        );
        assert_eq!(
            fixture.complete_work.parent_work_in_progress(),
            fixture.work_parent
        );
        assert_eq!(
            fixture.complete_work.parent_state_node(),
            fixture.parent_state_node
        );
        assert_eq!(fixture.complete_work.child(), fixture.child);
        assert_eq!(
            fixture.complete_work.child_state_node(),
            fixture.child_state_node
        );
        assert_eq!(
            fixture.complete_work.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(fixture.complete_work.child_alternate(), None);
        assert_eq!(fixture.complete_work.child_flags(), FiberFlags::PLACEMENT);
        assert!(fixture.complete_work.private_reconciler_handoff_only());
        assert!(!fixture.complete_work.public_dom_compatibility_claimed());
        assert!(!fixture.complete_work.test_renderer_compatibility_claimed());
        assert!(
            !fixture
                .complete_work
                .broad_reconciliation_traversal_claimed()
        );

        assert_eq!(
            handoff.mutation().source(),
            HostRootMutationApplyRecordSource::MutationPhase(
                HostRootMutationPhaseRecordKind::Placement
            )
        );
        assert_eq!(
            handoff.mutation().kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToHostParent
        );
        assert_eq!(handoff.mutation().parent(), fixture.work_parent);
        assert_eq!(
            handoff.mutation().parent_state_node(),
            fixture.parent_state_node
        );
        assert_eq!(handoff.mutation().fiber(), fixture.child);
        assert_eq!(handoff.mutation().state_node(), fixture.child_state_node);
        let placement_sibling = handoff.mutation().placement_sibling().unwrap();
        assert_eq!(
            placement_sibling.status(),
            HostRootPlacementSiblingStatus::Append
        );
        assert_eq!(placement_sibling.sibling(), None);
        assert_eq!(placement_sibling.sibling_tag(), None);
        assert_eq!(
            placement_sibling.sibling_state_node(),
            StateNodeHandle::NONE
        );
        assert_eq!(placement_sibling.skipped_pending_sibling_count(), 0);
        assert_root_work_loop_managed_child_append_host_execution(
            &store,
            &host,
            root_id,
            &fixture,
            &handoff,
            &diagnostic,
        );
    }

    #[test]
    fn root_work_loop_managed_child_sibling_order_placement_executes_private_insert_before() {
        let (mut store, root_id, mut host) = root_store();
        let mut fixture =
            prepare_root_work_loop_managed_child_placement_sibling_order_execution_fixture(
                &mut store, &mut host, root_id, 82_900,
            );

        let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_REQUEST_ORDER,
        )
        .unwrap();
        let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            &mut host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(
            handoff.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(handoff.order_evidence_name(), "next-sibling");
        assert_eq!(
            handoff.mutation().source(),
            HostRootMutationApplyRecordSource::MutationPhase(
                HostRootMutationPhaseRecordKind::Placement
            )
        );
        assert_eq!(
            handoff.mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
        );
        let placement_sibling = handoff.mutation().placement_sibling().unwrap();
        assert_eq!(
            placement_sibling.status(),
            HostRootPlacementSiblingStatus::InsertBefore
        );
        assert_eq!(placement_sibling.sibling(), Some(fixture.order_sibling));
        assert_eq!(
            placement_sibling.sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert!(placement_sibling.can_insert_before());
        assert_root_work_loop_managed_child_sibling_order_host_execution(
            &store,
            &host,
            root_id,
            &fixture,
            &handoff,
            &diagnostic,
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore),
            "insert_before",
            0,
            fixture.token_count_before_apply,
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.order_sibling_state_node)
                .unwrap()
                .is_active()
        );
    }

    #[test]
    fn root_work_loop_managed_child_sibling_order_delete_executes_private_remove_after_commit() {
        let (mut store, root_id, mut host) = root_store();
        let mut fixture =
            prepare_root_work_loop_managed_child_delete_sibling_order_execution_fixture(
                &mut store, &mut host, root_id, 83_000,
            );
        let deletion_list = fixture.deletion_list.unwrap();

        let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER,
        )
        .unwrap();
        let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            &mut host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(
            handoff.kind(),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach
        );
        assert_eq!(handoff.order_evidence_name(), "previous-sibling");
        assert_eq!(
            handoff.mutation().source(),
            HostRootMutationApplyRecordSource::DeletionList(deletion_list)
        );
        assert_eq!(
            handoff.mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        );
        assert_eq!(handoff.mutation().placement_sibling(), None);
        assert_eq!(handoff.commit().deletion_lists().len(), 1);
        assert_eq!(handoff.commit().deletion_lists()[0].list(), deletion_list);
        assert_eq!(
            handoff.commit().deletion_lists()[0].deleted(),
            &[fixture.child]
        );
        assert_root_work_loop_managed_child_sibling_order_host_execution(
            &store,
            &host,
            root_id,
            &fixture,
            &handoff,
            &diagnostic,
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild),
            "remove_child",
            1,
            fixture.token_count_before_apply + 1,
        );
        assert!(
            !fixture
                .detached_hosts
                .instance_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.order_sibling_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            diagnostic.cleanup_status(),
            Some(
                crate::host_work::TestHostRootDeletionCleanupStatus::Applied(
                    crate::host_work::TestHostRootDeletionCleanupAction::DetachDeletedInstance
                )
            )
        );
    }

    #[test]
    fn root_work_loop_managed_child_host_text_placement_executes_private_host_work_append() {
        let (mut store, root_id, mut host) = root_store();
        let mut fixture = prepare_root_work_loop_managed_child_text_append_execution_fixture(
            &mut store, &mut host, root_id, 83_100,
        );

        let handoff = commit_managed_child_complete_work_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_APPEND_REQUEST_ORDER,
        )
        .unwrap();
        let diagnostic = apply_managed_child_complete_work_handoff_for_canary(
            &mut store,
            &mut host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(fixture.complete_work.child_tag(), FiberTag::HostText);
        assert_eq!(handoff.mutation().tag(), FiberTag::HostText);
        assert_eq!(
            handoff.mutation().kind(),
            HostRootMutationApplyRecordKind::AppendPlacementToHostParent
        );
        assert_eq!(
            handoff.mutation().placement_sibling().unwrap().status(),
            HostRootPlacementSiblingStatus::Append
        );
        assert_eq!(
            diagnostic.mutation_status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::AppendChild)
        );
        assert_eq!(diagnostic.cleanup_status(), None);
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert!(diagnostic.private_test_host_mutation_executed());
        assert!(
            fixture
                .detached_hosts
                .text_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(store.host_tokens().len(), fixture.token_count_before_apply);
        let mut expected_operations = fixture.operations_before_apply.clone();
        expected_operations.push("append_child");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn root_work_loop_managed_child_host_text_sibling_order_executes_private_host_work_insert_before()
     {
        let (mut store, root_id, mut host) = root_store();
        let mut fixture =
            prepare_root_work_loop_managed_child_text_placement_sibling_order_execution_fixture(
                &mut store, &mut host, root_id, 83_200,
            );

        let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_REQUEST_ORDER,
        )
        .unwrap();
        let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            &mut host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(fixture.complete_work.child_tag(), FiberTag::HostText);
        assert_eq!(
            fixture.complete_work.order_sibling_tag(),
            FiberTag::HostText
        );
        assert_eq!(handoff.mutation().tag(), FiberTag::HostText);
        let placement_sibling = handoff.mutation().placement_sibling().unwrap();
        assert_eq!(
            handoff.mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
        );
        assert_eq!(
            placement_sibling.status(),
            HostRootPlacementSiblingStatus::InsertBefore
        );
        assert_eq!(placement_sibling.sibling(), Some(fixture.order_sibling));
        assert_eq!(placement_sibling.sibling_tag(), Some(FiberTag::HostText));
        assert!(placement_sibling.can_insert_before());
        assert_eq!(
            diagnostic.mutation_status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::InsertBefore)
        );
        assert_eq!(diagnostic.cleanup_status(), None);
        assert!(diagnostic.private_test_host_mutation_executed());
        assert!(
            fixture
                .detached_hosts
                .text_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .detached_hosts
                .text_metadata(fixture.order_sibling_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(store.host_tokens().len(), fixture.token_count_before_apply);
        let mut expected_operations = fixture.operations_before_apply.clone();
        expected_operations.push("insert_before");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn root_work_loop_managed_child_host_text_sibling_order_delete_executes_private_host_work_remove()
     {
        let (mut store, root_id, mut host) = root_store();
        let mut fixture =
            prepare_root_work_loop_managed_child_text_delete_sibling_order_execution_fixture(
                &mut store, &mut host, root_id, 83_300,
            );
        let deletion_list = fixture.deletion_list.unwrap();

        let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER,
        )
        .unwrap();
        let diagnostic = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            &mut host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap();

        assert_eq!(fixture.complete_work.child_tag(), FiberTag::HostText);
        assert_eq!(
            fixture.complete_work.order_sibling_tag(),
            FiberTag::HostText
        );
        assert_eq!(handoff.mutation().tag(), FiberTag::HostText);
        assert_eq!(
            handoff.mutation().source(),
            HostRootMutationApplyRecordSource::DeletionList(deletion_list)
        );
        assert_eq!(
            handoff.mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        );
        assert_eq!(handoff.mutation().placement_sibling(), None);
        assert_eq!(
            diagnostic.mutation_status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
        );
        assert_eq!(
            diagnostic.cleanup_status(),
            Some(
                crate::host_work::TestHostRootDeletionCleanupStatus::Applied(
                    crate::host_work::TestHostRootDeletionCleanupAction::InvalidateDeletedText
                )
            )
        );
        assert_eq!(diagnostic.deletion_cleanup_apply_count(), 1);
        assert!(diagnostic.private_test_host_mutation_executed());
        assert!(
            !fixture
                .detached_hosts
                .text_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .detached_hosts
                .text_metadata(fixture.order_sibling_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            store.host_tokens().len(),
            fixture.token_count_before_apply + 1
        );
        let mut expected_operations = fixture.operations_before_apply.clone();
        expected_operations.push("remove_child");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn root_work_loop_deleted_subtree_teardown_executes_ref_passive_host_detach_and_cleanup_in_order()
     {
        let (mut store, root_id, mut host) = root_store();
        let mut fixture = prepare_root_work_loop_deleted_subtree_teardown_fixture(
            &mut store, &mut host, root_id, 86_700,
        );
        let queued_passive = fixture.deleted_passive_handoff.records()[0];

        let mut handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            fixture.delete_render,
            Some(fixture.pending),
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER,
        )
        .unwrap();
        handoff
            .record_function_component_deleted_subtree_passive_effects_for_canary(&[fixture
                .deleted_passive_handoff
                .clone()])
            .unwrap();
        let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
            &handoff,
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
        )
        .unwrap();
        let mut executor = RecordingDeletedSubtreeTeardownExecutor::default();

        let diagnostic = execute_test_host_root_deletion_teardown_after_commit_for_canary(
            &mut store,
            &mut host,
            &handoff,
            source_request,
            source_request,
            &mut fixture.detached_hosts,
            &mut executor,
        )
        .unwrap();

        assert_eq!(
            fixture.previous_current,
            handoff.commit().previous_current()
        );
        assert_eq!(fixture.pending.root(), root_id);
        assert_eq!(
            fixture.pending.handoff_order(),
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_SOURCE_ORDER
        );
        assert_eq!(source_request.root(), root_id);
        assert_eq!(
            source_request.source_handoff_order(),
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_SOURCE_ORDER
        );
        assert_eq!(
            source_request.commit_order(),
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER
        );
        assert_eq!(
            source_request.request_order(),
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER
        );
        assert_eq!(source_request.previous_current(), fixture.previous_current);
        assert_eq!(
            source_request.finished_work(),
            fixture.delete_render.finished_work()
        );
        assert_eq!(
            source_request.committed_current(),
            fixture.delete_render.finished_work()
        );
        assert_eq!(source_request.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(source_request.remaining_lanes(), Lanes::NO);
        assert_eq!(source_request.pending_lanes(), Lanes::NO);
        assert_eq!(source_request.deletion_list_count(), 1);
        assert_eq!(source_request.deleted_root_count(), 1);
        assert_eq!(source_request.ref_cleanup_return_count(), 1);
        assert_eq!(source_request.passive_destroy_count(), 1);
        assert_eq!(source_request.host_node_cleanup_count(), 2);
        assert!(source_request.private_test_control_execution_requested());
        assert!(!source_request.public_unmount_compatibility_claimed());
        assert!(!source_request.public_ref_or_effect_compatibility_claimed());

        let plan = source_request.host_detachment_plan();
        assert_eq!(plan.root(), root_id);
        assert_eq!(plan.finished_work(), fixture.delete_render.finished_work());
        assert_eq!(plan.deletion_list(), fixture.deletion_list);
        assert_eq!(plan.deleted_root(), fixture.deleted_host);
        assert_eq!(plan.host_parent(), fixture.work_parent);
        assert_eq!(
            plan.host_parent_state_node(),
            fixture.host_parent_state_node
        );
        assert_eq!(plan.host_child(), fixture.deleted_host);
        assert_eq!(
            plan.host_child_state_node(),
            fixture.deleted_host_state_node
        );
        assert_eq!(plan.cleanup_sequence(), 1);
        assert_eq!(plan.cleanup_order_sequence(), 3);
        assert!(!plan.public_unmount_compatibility_claimed());
        assert!(!plan.broad_host_teardown_enabled());

        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(
            diagnostic.finished_work(),
            fixture.delete_render.finished_work()
        );
        assert_eq!(diagnostic.request(), source_request);
        assert_eq!(
            diagnostic.host_detachment_status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::RemoveChild)
        );
        assert!(diagnostic.ref_cleanup_return_callbacks_invoked());
        assert!(diagnostic.passive_destroy_callbacks_invoked());
        assert!(diagnostic.private_host_subtree_detachment_applied());
        assert!(!diagnostic.public_unmount_compatibility_claimed());
        assert!(!diagnostic.public_ref_or_effect_compatibility_claimed());

        let ref_passive = diagnostic.ref_passive_cleanup();
        assert_eq!(ref_passive.root(), root_id);
        assert_eq!(
            ref_passive.finished_work(),
            fixture.delete_render.finished_work()
        );
        assert_eq!(ref_passive.records().len(), 4);
        assert_eq!(ref_passive.ref_cleanup_return_executions().len(), 1);
        assert_eq!(executor.ref_cleanup_calls().len(), 1);
        assert_eq!(executor.destroy_calls().len(), 1);
        let ref_cleanup = ref_passive.ref_cleanup_return_executions()[0];
        assert_eq!(ref_cleanup.fiber(), fixture.deleted_host);
        assert_eq!(ref_cleanup.state_node(), fixture.deleted_host_state_node);
        assert_eq!(ref_cleanup.ref_handle(), fixture.deleted_host_ref);
        assert_eq!(executor.ref_cleanup_calls()[0], ref_cleanup.request());
        assert_eq!(
            executor.destroy_calls()[0].fiber(),
            fixture.deleted_function
        );
        assert_eq!(
            executor.destroy_calls()[0].destroy_callback(),
            fixture.passive_destroy
        );

        let snapshot = diagnostic.execution_snapshot();
        assert_eq!(snapshot.len(), 5);
        assert_eq!(snapshot.ref_cleanup_return_gate_count(), 1);
        assert_eq!(snapshot.passive_destroy_execution_count(), 1);
        assert_eq!(snapshot.host_subtree_detachment_count(), 1);
        assert_eq!(snapshot.host_cleanup_apply_count(), 2);
        assert!(snapshot.private_passive_destroy_callbacks_invoked());
        assert!(snapshot.private_host_subtree_detachment_applied());
        assert!(!snapshot.public_unmount_compatibility_claimed());
        assert!(!snapshot.public_ref_or_effect_compatibility_claimed());
        assert_eq!(
            snapshot
                .records()
                .iter()
                .map(|record| record.phase())
                .collect::<Vec<_>>(),
            vec![
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::RefCleanupReturnGate,
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::PassiveDestroyCallback,
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostSubtreeDetach,
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup,
                TestHostRootDeletionRefPassiveCleanupExecutionPhase::HostNodeCleanup,
            ]
        );
        assert_eq!(snapshot.records()[0].fiber(), fixture.deleted_host);
        assert_eq!(snapshot.records()[0].deleted_root(), fixture.deleted_host);
        assert_eq!(snapshot.records()[0].ref_cleanup_return_sequence(), Some(0));
        assert_eq!(snapshot.records()[1].fiber(), fixture.deleted_function);
        assert_eq!(
            snapshot.records()[1].passive_destroy_execution_order(),
            Some(0)
        );
        assert_eq!(snapshot.records()[2].fiber(), fixture.deleted_host);
        assert_eq!(
            snapshot.records()[2].host_detachment_cleanup_order_sequence(),
            Some(3)
        );
        assert_eq!(snapshot.records()[3].fiber(), fixture.deleted_text);
        assert_eq!(snapshot.records()[3].host_cleanup_sequence(), Some(0));
        assert_eq!(snapshot.records()[4].fiber(), fixture.deleted_host);
        assert_eq!(snapshot.records()[4].host_cleanup_sequence(), Some(1));

        assert!(
            !fixture
                .detached_hosts
                .text_metadata(fixture.deleted_text_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            !fixture
                .detached_hosts
                .instance_metadata(fixture.deleted_host_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
        );
        assert_eq!(queued_passive.create(), fixture.passive_create);
        assert_eq!(queued_passive.destroy(), Some(fixture.passive_destroy));
        assert_eq!(queued_passive.dependencies(), fixture.passive_dependencies);

        let mut expected_operations = fixture.operations_before_teardown;
        expected_operations.push("remove_child");
        expected_operations.push("detach_deleted_instance");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn root_work_loop_deleted_subtree_teardown_rejects_missing_ref_and_passive_evidence_before_host_calls()
     {
        let (mut store, root_id, mut host) = root_store();
        let fixture = prepare_root_work_loop_deleted_subtree_teardown_fixture(
            &mut store, &mut host, root_id, 86_750,
        );
        store
            .fiber_arena_mut()
            .get_mut(fixture.deleted_host)
            .unwrap()
            .set_ref_handle(RefHandle::NONE);

        let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            fixture.delete_render,
            Some(fixture.pending),
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER,
        )
        .unwrap();
        let order_gate = handoff.commit().deletion_cleanup_order_gate_for_canary();
        let executor = RecordingDeletedSubtreeTeardownExecutor::default();

        let error = test_host_root_deletion_teardown_execution_request_for_canary(
            &handoff,
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootDeletionTeardownExecutionErrorForCanary::MissingDeletionTeardownMetadata {
                root,
                finished_work,
            } if root == root_id && finished_work == fixture.delete_render.finished_work()
        ));
        assert_eq!(handoff.commit().deletion_lists().len(), 1);
        assert_eq!(
            handoff.commit().deletion_lists()[0].deleted(),
            &[fixture.deleted_host]
        );
        assert_eq!(
            handoff
                .commit()
                .host_node_deletion_cleanup_log()
                .records()
                .len(),
            2
        );
        assert_eq!(order_gate.ref_cleanup_return_count(), 0);
        assert_eq!(order_gate.passive_destroy_count(), 0);
        assert_eq!(order_gate.host_node_cleanup_count(), 2);
        assert!(executor.ref_cleanup_calls().is_empty());
        assert!(executor.destroy_calls().is_empty());
        assert_eq!(host.operations(), fixture.operations_before_teardown);
        assert!(
            fixture
                .detached_hosts
                .text_metadata(fixture.deleted_text_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            fixture
                .detached_hosts
                .instance_metadata(fixture.deleted_host_state_node)
                .unwrap()
                .is_active()
        );
    }

    #[test]
    fn root_work_loop_deleted_subtree_teardown_rejects_cross_root_source_evidence() {
        let (mut store, root_id, mut host) = root_store();
        let foreign_root = store
            .create_client_root(FakeContainer::new(867), RootOptions::new())
            .unwrap();
        let fixture = prepare_root_work_loop_deleted_subtree_teardown_fixture(
            &mut store, &mut host, root_id, 86_800,
        );
        let mut foreign_fixture = prepare_root_work_loop_deleted_subtree_teardown_fixture(
            &mut store,
            &mut host,
            foreign_root,
            86_900,
        );
        let mut handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            fixture.delete_render,
            Some(fixture.pending),
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER,
        )
        .unwrap();
        handoff
            .record_function_component_deleted_subtree_passive_effects_for_canary(&[fixture
                .deleted_passive_handoff
                .clone()])
            .unwrap();
        let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
            &handoff,
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
        )
        .unwrap();
        let mut foreign_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            foreign_fixture.delete_render,
            Some(foreign_fixture.pending),
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER + 10,
        )
        .unwrap();
        foreign_handoff
            .record_function_component_deleted_subtree_passive_effects_for_canary(&[
                foreign_fixture.deleted_passive_handoff.clone(),
            ])
            .unwrap();
        let mut executor = RecordingDeletedSubtreeTeardownExecutor::default();

        let error = execute_test_host_root_deletion_teardown_after_commit_for_canary(
            &mut store,
            &mut host,
            &foreign_handoff,
            source_request,
            source_request,
            &mut foreign_fixture.detached_hosts,
            &mut executor,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootDeletionTeardownExecutionErrorForCanary::MismatchedRootOwnership {
                expected_root,
                actual_root,
            } if expected_root == root_id && actual_root == foreign_root
        ));
        assert!(executor.ref_cleanup_calls().is_empty());
        assert!(executor.destroy_calls().is_empty());
        assert_eq!(
            host.operations(),
            foreign_fixture.operations_before_teardown
        );
    }

    #[test]
    fn root_work_loop_deleted_subtree_teardown_rejects_caller_built_stale_evidence() {
        let (mut store, root_id, mut host) = root_store();
        let mut fixture = prepare_root_work_loop_deleted_subtree_teardown_fixture(
            &mut store, &mut host, root_id, 87_000,
        );
        let mut handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            fixture.delete_render,
            Some(fixture.pending),
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER,
        )
        .unwrap();
        handoff
            .record_function_component_deleted_subtree_passive_effects_for_canary(&[fixture
                .deleted_passive_handoff
                .clone()])
            .unwrap();
        let source_request = test_host_root_deletion_teardown_execution_request_for_canary(
            &handoff,
            ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
        )
        .unwrap();
        let caller_built_request = source_request.with_host_node_cleanup_count_for_canary(0);
        let mut executor = RecordingDeletedSubtreeTeardownExecutor::default();

        let error = execute_test_host_root_deletion_teardown_after_commit_for_canary(
            &mut store,
            &mut host,
            &handoff,
            source_request,
            caller_built_request,
            &mut fixture.detached_hosts,
            &mut executor,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootDeletionTeardownExecutionErrorForCanary::StaleFinishedWorkEvidence {
                root,
                commit_order: ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_COMMIT_ORDER,
                request_order: ROOT_WORK_LOOP_DELETED_SUBTREE_TEARDOWN_REQUEST_ORDER,
            } if root == root_id
        ));
        assert!(executor.ref_cleanup_calls().is_empty());
        assert!(executor.destroy_calls().is_empty());
        assert_eq!(host.operations(), fixture.operations_before_teardown);
    }

    #[test]
    fn root_work_loop_managed_child_host_text_sibling_order_delete_rejects_stale_text_sibling() {
        let (mut store, root_id, mut host) = root_store();
        let mut fixture =
            prepare_root_work_loop_managed_child_text_delete_sibling_order_execution_fixture(
                &mut store, &mut host, root_id, 83_400,
            );

        let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER,
        )
        .unwrap();
        fixture
            .detached_hosts
            .invalidate_text_for_canary(fixture.order_sibling_state_node)
            .unwrap();

        let error = apply_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            &mut host,
            &handoff,
            &mut fixture.detached_hosts,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            crate::host_work::TestHostRootManagedChildExecutionErrorForCanary::HostWork(
                crate::host_work::HostWorkError::HostNode(ref error)
            ) if error.violation() == crate::host_nodes::HostNodeViolation::Stale
        ));
        assert_eq!(host.operations(), fixture.operations_before_apply);
        assert!(
            fixture
                .detached_hosts
                .text_metadata(fixture.child_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            store.host_tokens().len(),
            fixture.token_count_before_apply + 1
        );
    }

    #[test]
    fn root_work_loop_managed_child_sibling_order_placement_handoff_survives_finished_work_commit()
    {
        let (mut store, root_id, host) = root_store();
        let fixture = prepare_root_work_loop_managed_child_placement_sibling_order_fixture(
            &mut store, root_id, 82_600,
        );

        let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_REQUEST_ORDER,
        )
        .unwrap();

        assert_root_work_loop_managed_child_sibling_order_handoff_common(
            &store,
            &host,
            root_id,
            fixture,
            &handoff,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_PLACEMENT_REQUEST_ORDER,
        );

        assert_eq!(
            fixture.complete_work.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(
            handoff.kind(),
            HostComponentManagedChildMutationKindForCanary::Placement
        );
        assert_eq!(fixture.complete_work.child_alternate(), None);
        assert_eq!(fixture.complete_work.child_flags(), FiberFlags::PLACEMENT);
        assert_eq!(
            handoff.mutation().source(),
            HostRootMutationApplyRecordSource::MutationPhase(
                HostRootMutationPhaseRecordKind::Placement
            )
        );
        assert_eq!(
            handoff.mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInHostParentBefore
        );
        assert_eq!(handoff.mutation().parent(), fixture.work_parent);
        assert_eq!(
            handoff.mutation().parent_state_node(),
            fixture.parent_state_node
        );
        assert_eq!(handoff.mutation().fiber(), fixture.child);
        assert_eq!(handoff.mutation().state_node(), fixture.child_state_node);
        assert_eq!(handoff.mutation().pending_props(), fixture.child_props);
        assert_eq!(handoff.mutation().memoized_props(), fixture.child_props);
        assert_eq!(handoff.mutation().alternate_fiber(), None);
        assert!(
            handoff
                .mutation()
                .effect_flag()
                .contains_all(FiberFlags::PLACEMENT)
        );
        let placement_sibling = handoff.mutation().placement_sibling().unwrap();
        assert_eq!(
            placement_sibling.status(),
            HostRootPlacementSiblingStatus::InsertBefore
        );
        assert_eq!(placement_sibling.sibling(), Some(fixture.order_sibling));
        assert_eq!(
            placement_sibling.sibling_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(
            placement_sibling.sibling_state_node(),
            fixture.order_sibling_state_node
        );
        assert_eq!(placement_sibling.skipped_pending_sibling_count(), 0);
        assert!(placement_sibling.can_insert_before());

        let finished_parent = store.fiber_arena().get(fixture.work_parent).unwrap();
        assert_eq!(finished_parent.child(), Some(fixture.child));
        assert_eq!(
            store.fiber_arena().get(fixture.child).unwrap().sibling(),
            Some(fixture.order_sibling)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.order_sibling)
                .unwrap()
                .sibling(),
            None
        );
    }

    #[test]
    fn root_work_loop_managed_child_sibling_order_delete_handoff_survives_finished_work_commit() {
        let (mut store, root_id, host) = root_store();
        let fixture = prepare_root_work_loop_managed_child_delete_sibling_order_fixture(
            &mut store, root_id, 82_700,
        );
        let deletion_list = fixture.deletion_list.unwrap();

        let handoff = commit_managed_child_sibling_order_complete_work_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.complete_work,
            0,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER,
        )
        .unwrap();

        assert_root_work_loop_managed_child_sibling_order_handoff_common(
            &store,
            &host,
            root_id,
            fixture,
            &handoff,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_COMMIT_ORDER,
            ROOT_WORK_LOOP_MANAGED_CHILD_SIBLING_ORDER_DELETE_REQUEST_ORDER,
        );

        assert_eq!(
            fixture.complete_work.kind(),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach
        );
        assert_eq!(
            handoff.kind(),
            HostComponentManagedChildMutationKindForCanary::DeleteDetach
        );
        assert_eq!(fixture.complete_work.child_alternate(), None);
        assert_eq!(fixture.complete_work.deletion_list(), Some(deletion_list));
        assert_eq!(
            fixture.complete_work.parent_flags(),
            FiberFlags::CHILD_DELETION
        );
        assert_eq!(
            handoff.mutation().source(),
            HostRootMutationApplyRecordSource::DeletionList(deletion_list)
        );
        assert_eq!(
            handoff.mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromHostParent
        );
        assert_eq!(handoff.mutation().parent(), fixture.work_parent);
        assert_eq!(
            handoff.mutation().parent_state_node(),
            fixture.parent_state_node
        );
        assert_eq!(handoff.mutation().fiber(), fixture.child);
        assert_eq!(handoff.mutation().state_node(), fixture.child_state_node);
        assert_eq!(handoff.mutation().pending_props(), fixture.child_props);
        assert_eq!(handoff.mutation().memoized_props(), fixture.child_props);
        assert!(
            handoff
                .mutation()
                .effect_flag()
                .contains_all(FiberFlags::CHILD_DELETION)
        );
        assert_eq!(handoff.mutation().placement_sibling(), None);
        assert_eq!(handoff.commit().deletion_lists().len(), 1);
        assert_eq!(handoff.commit().deletion_lists()[0].list(), deletion_list);
        assert_eq!(
            handoff.commit().deletion_lists()[0].deleted(),
            &[fixture.child]
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.order_sibling_current)
                .unwrap()
                .sibling(),
            Some(fixture.child)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.work_parent)
                .unwrap()
                .child(),
            Some(fixture.order_sibling)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.order_sibling)
                .unwrap()
                .sibling(),
            None
        );
    }

    #[test]
    fn root_work_loop_complete_work_commit_handoff_rejects_finished_lanes_mismatch() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("section", "stale lanes");
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let complete_work = handoff_completed_host_root_render_to_test_complete_work(
            &mut store, &mut host, render, &source,
        )
        .unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .record_finished_work_for_canary(render.finished_work(), render.render_lanes());
        let pending =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, 31).unwrap();
        let host_operation_count_after_complete_work = host.operations().len();
        store
            .root_mut(root_id)
            .unwrap()
            .record_finished_work_for_canary(
                render.finished_work(),
                Lanes::from(Lane::SYNC_HYDRATION),
            );

        let error = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            render,
            Some(pending),
            32,
        )
        .unwrap_err();

        assert_eq!(complete_work.root(), root_id);
        assert_eq!(
            complete_work.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(
            complete_work.root_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(pending.root_finished_work(), Some(render.finished_work()));
        assert_eq!(pending.root_finished_lanes(), Lanes::DEFAULT);
        assert!(matches!(
            error,
            HostRootFinishedWorkCommitHandoffErrorForCanary::FinishedWorkRootMetadataMismatch {
                root,
                expected_finished_work,
                actual_finished_work,
                expected_finished_lanes,
                actual_finished_lanes,
            } if root == root_id
                && expected_finished_work == Some(render.finished_work())
                && actual_finished_work == Some(render.finished_work())
                && expected_finished_lanes == Lanes::DEFAULT
                && actual_finished_lanes == Lanes::from(Lane::SYNC_HYDRATION)
        ));
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(
            store.root(root_id).unwrap().finished_work(),
            Some(render.finished_work())
        );
        assert_eq!(
            store.root(root_id).unwrap().finished_lanes(),
            Lanes::from(Lane::SYNC_HYDRATION)
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.finished_work())
        );
        assert_eq!(
            host.operations().len(),
            host_operation_count_after_complete_work
        );
    }

    #[test]
    fn root_work_loop_complete_work_handoff_feeds_private_sync_scheduler_continuation() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("section", "scheduler commit");
        let current = store.root(root_id).unwrap().current();
        let sync_update = update_container_sync(&mut store, root_id, element, None).unwrap();
        ensure_root_is_scheduled(&mut store, sync_update.schedule()).unwrap();
        let rendered =
            flush_sync_work_on_all_roots(&mut store, &ExecutionContextState::new()).unwrap();
        let sync_handoff = rendered.records()[0];
        let render = sync_handoff.render_phase();

        let complete_work = handoff_completed_host_root_render_to_test_complete_work(
            &mut store, &mut host, render, &source,
        )
        .unwrap();
        let pending_finished_work =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, 596).unwrap();
        let host_operation_count_after_complete_work = host.operations().len();

        let execution = execute_sync_scheduler_continuation_for_render_handoff(
            &mut store,
            sync_handoff,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(complete_work.root(), root_id);
        assert_eq!(
            complete_work.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(
            complete_work.root_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(complete_work.completed_child_count(), 1);
        assert_eq!(pending_finished_work.root(), root_id);
        assert_eq!(pending_finished_work.previous_current(), current);
        assert_eq!(
            pending_finished_work.finished_work(),
            render.finished_work()
        );
        assert_eq!(pending_finished_work.render_lanes(), Lanes::SYNC);
        assert_eq!(pending_finished_work.finished_lanes(), Lanes::SYNC);
        assert_eq!(pending_finished_work.remaining_lanes(), Lanes::NO);
        assert_eq!(
            pending_finished_work.pending_lanes_before_commit(),
            Lanes::SYNC
        );
        assert!(pending_finished_work.records_finished_work());
        assert_eq!(
            execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
        );
        assert_eq!(execution.handoff(), sync_handoff);
        assert_eq!(execution.selected_lanes(), Lanes::SYNC);
        assert!(execution.did_execute_private_sync_scheduler_continuation());
        assert!(execution.consumed_accepted_render_handoff());
        assert!(execution.async_callback_execution_blocked());
        assert!(execution.public_update_scheduling_blocked());
        assert!(!execution.public_root_compatibility_claimed());
        assert!(!execution.executes_public_effects());
        let root_commit_handoff = execution.root_commit_handoff_for_canary().unwrap();
        assert!(root_commit_handoff.proves_private_root_finished_work_commit_metadata_handoff());
        assert_eq!(
            root_commit_handoff.pending().root_finished_work(),
            Some(render.finished_work())
        );
        assert_eq!(
            root_commit_handoff
                .execution_request()
                .root_finished_lanes(),
            Lanes::SYNC
        );
        let commit = execution.commit().unwrap();
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), current);
        assert_eq!(commit.current(), render.finished_work());
        assert_eq!(commit.finished_lanes(), Lanes::SYNC);
        assert_eq!(commit.pending_lanes(), Lanes::NO);
        assert_eq!(commit.mutation_log().len(), 1);
        assert_eq!(commit.mutation_apply_log().len(), 1);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            None
        );
        assert_eq!(
            host.operations().len(),
            host_operation_count_after_complete_work
        );
    }

    #[test]
    fn root_work_loop_complete_work_handoff_feeds_expired_lane_sync_scheduler_continuation() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_host_element_with_text("main", "expired scheduler commit");
        let current = store.root(root_id).unwrap().current();
        let update = update_container(&mut store, root_id, element, None).unwrap();
        ensure_root_is_scheduled(&mut store, update.schedule()).unwrap();
        assert!(
            store
                .root_mut(root_id)
                .unwrap()
                .lanes_mut()
                .set_expiration_time(Lane::DEFAULT, 625)
        );
        store
            .root_mut(root_id)
            .unwrap()
            .lanes_mut()
            .mark_starved_lanes_as_expired(625);

        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let complete_work = handoff_completed_host_root_render_to_test_complete_work(
            &mut store, &mut host, render, &source,
        )
        .unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .record_finished_work_for_canary(render.finished_work(), render.render_lanes());
        let pending_finished_work =
            record_host_root_finished_work_pending_commit_for_canary(&store, render, 625).unwrap();
        let host_operation_count_after_complete_work = host.operations().len();
        let expired_handoff = root_sync_flush_record_for_canary(0, root_id, Lanes::DEFAULT, render);

        let execution = execute_sync_scheduler_continuation_for_render_handoff(
            &mut store,
            expired_handoff,
            RootSchedulerCallbackHandle::NONE,
        )
        .unwrap();

        assert_eq!(complete_work.root(), root_id);
        assert_eq!(
            complete_work.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(
            complete_work.root_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(complete_work.completed_child_count(), 1);
        assert_eq!(pending_finished_work.root(), root_id);
        assert_eq!(pending_finished_work.previous_current(), current);
        assert_eq!(
            pending_finished_work.finished_work(),
            render.finished_work()
        );
        assert_eq!(pending_finished_work.render_lanes(), Lanes::DEFAULT);
        assert_eq!(pending_finished_work.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(pending_finished_work.remaining_lanes(), Lanes::NO);
        assert_eq!(
            pending_finished_work.pending_lanes_before_commit(),
            Lanes::DEFAULT
        );
        assert!(pending_finished_work.records_finished_work());
        assert_eq!(
            execution.status(),
            RootSyncSchedulerContinuationExecutionStatus::RenderedAndCommitted
        );
        assert_eq!(execution.handoff(), expired_handoff);
        assert_eq!(execution.selected_lanes(), Lanes::DEFAULT);
        assert!(execution.did_execute_private_sync_scheduler_continuation());
        assert!(execution.consumed_accepted_render_handoff());
        assert!(execution.async_callback_execution_blocked());
        assert!(execution.public_update_scheduling_blocked());
        assert!(!execution.public_root_compatibility_claimed());
        assert!(!execution.executes_public_effects());
        let root_commit_handoff = execution.root_commit_handoff_for_canary().unwrap();
        assert!(root_commit_handoff.proves_private_root_finished_work_commit_metadata_handoff());
        assert_eq!(
            root_commit_handoff.pending().root_finished_work(),
            Some(render.finished_work())
        );
        assert_eq!(
            root_commit_handoff
                .execution_request()
                .root_finished_lanes(),
            Lanes::DEFAULT
        );
        let commit = execution.commit().unwrap();
        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), current);
        assert_eq!(commit.current(), render.finished_work());
        assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.pending_lanes(), Lanes::NO);
        assert_eq!(commit.mutation_log().len(), 1);
        assert_eq!(commit.mutation_apply_log().len(), 1);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            None
        );
        assert_eq!(
            host.operations().len(),
            host_operation_count_after_complete_work
        );
    }

    #[test]
    fn root_work_loop_complete_work_commit_handoff_records_root_text_diagnostic() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_text("root text commit");
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let record = handoff_completed_host_root_render_to_test_complete_work_and_commit(
            &mut store, &mut host, render, &source,
        )
        .unwrap();

        let complete_work = record.complete_work();
        assert_eq!(complete_work.root_child_tag(), Some(FiberTag::HostText));
        assert_eq!(
            complete_work.completed_child_tag(),
            Some(FiberTag::HostText)
        );
        assert_eq!(complete_work.detached_instance_count(), 0);
        assert_eq!(complete_work.detached_text_count(), 1);
        assert_eq!(record.commit().previous_current(), current);
        assert_eq!(record.commit().current(), render.work_in_progress());
        assert_eq!(
            record.finished_work_handoff().pending().finished_work(),
            render.finished_work()
        );
        assert_eq!(
            record.finished_work_handoff().pending().root_token(),
            root_id.state_node_handle()
        );
        assert!(
            record
                .finished_work_handoff()
                .commit_order_after_pending_record()
        );
        assert_eq!(record.commit().mutation_log().len(), 1);
        assert_eq!(record.commit().mutation_apply_log().len(), 1);
        assert!(record.host_operations_unchanged_by_commit());

        let text = complete_work.root_child().unwrap();
        let text_state_node = store.fiber_arena().get(text).unwrap().state_node();
        let diagnostics = record.placement_apply_diagnostics();
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].fiber(), text);
        assert_eq!(diagnostics[0].tag(), FiberTag::HostText);
        assert_eq!(diagnostics[0].tag_name(), "HostText");
        assert_eq!(diagnostics[0].state_node(), text_state_node);
        assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
        assert_eq!(diagnostics[0].sibling_status(), "append");
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.work_in_progress()
        );
    }

    #[test]
    fn root_work_loop_hands_multiple_host_siblings_to_test_complete_work() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let first_element = source.insert_host_element_with_text("article", "first");
        let second_element = source.insert_text("second");
        let original_root_element = RootElementHandle::from_raw(980);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let record = handoff_completed_host_root_render_to_test_complete_work_for_siblings(
            &mut store,
            &mut host,
            render,
            &source,
            &[first_element, second_element],
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.root_child_count(), 2);
        assert_eq!(record.completed_child_count(), 2);
        assert_eq!(record.root_child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(record.last_root_child_tag(), Some(FiberTag::HostText));
        assert_eq!(record.completed_child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(record.last_completed_child_tag(), Some(FiberTag::HostText));
        assert_eq!(record.render_lanes(), Lanes::DEFAULT);
        assert_eq!(record.resulting_element(), original_root_element);
        assert_eq!(record.detached_instance_count(), 1);
        assert_eq!(record.detached_text_count(), 2);

        let first = record.root_child().unwrap();
        let second = record.last_root_child().unwrap();
        assert_eq!(record.completed_child(), Some(first));
        assert_eq!(record.last_completed_child(), Some(second));
        let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
        assert_eq!(root_node.child(), Some(first));
        assert!(
            root_node
                .subtree_flags()
                .contains_all(FiberFlags::PLACEMENT)
        );
        assert_eq!(root_node.child_lanes(), Lanes::NO);

        let first_node = store.fiber_arena().get(first).unwrap();
        let second_node = store.fiber_arena().get(second).unwrap();
        assert_eq!(first_node.tag(), FiberTag::HostComponent);
        assert_eq!(first_node.return_fiber(), Some(render.work_in_progress()));
        assert_eq!(first_node.sibling(), Some(second));
        assert!(first_node.state_node().is_some());
        assert!(first_node.flags().contains_all(FiberFlags::PLACEMENT));
        assert_eq!(second_node.tag(), FiberTag::HostText);
        assert_eq!(second_node.return_fiber(), Some(render.work_in_progress()));
        assert_eq!(second_node.sibling(), None);
        assert!(second_node.state_node().is_some());
        assert!(second_node.flags().contains_all(FiberFlags::PLACEMENT));
        store.fiber_arena().validate_topology().unwrap();

        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
                "create_text_instance",
            ]
        );
    }

    #[test]
    fn root_work_loop_hands_one_level_array_or_fragment_child_set_to_test_complete_work() {
        for (index, kind) in [
            HostRootOneLevelChildSetKind::Array,
            HostRootOneLevelChildSetKind::Fragment,
        ]
        .into_iter()
        .enumerate()
        {
            let raw = index as u64;
            let (mut store, root_id, mut host) = root_store();
            let mut source = TestHostTree::new();
            let first_element =
                source.insert_host_element_with_text("article", format!("first {raw}"));
            let second_element = source.insert_text(format!("second {raw}"));
            let original_root_element = RootElementHandle::from_raw(1_200 + raw);
            let current = store.root(root_id).unwrap().current();
            update_container(&mut store, root_id, original_root_element, None).unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let entries = vec![
                HostRootOneLevelChildSetEntry::host(first_element),
                HostRootOneLevelChildSetEntry::host(second_element),
            ];
            let child_set = match kind {
                HostRootOneLevelChildSetKind::Array => {
                    HostRootOneLevelChildSet::array(original_root_element, entries)
                }
                HostRootOneLevelChildSetKind::Fragment => {
                    HostRootOneLevelChildSet::fragment(original_root_element, None, entries)
                }
            };

            let record =
                handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
                    &mut store, &mut host, render, &source, &child_set,
                )
                .unwrap();

            assert_eq!(record.kind(), kind);
            assert_eq!(record.root_element(), original_root_element);
            assert_eq!(record.child_count(), 2);
            assert_eq!(
                record.begin_work().children(),
                &[first_element, second_element]
            );
            assert_eq!(record.begin_work().first_child(), first_element);
            assert_eq!(record.begin_work().last_child(), second_element);

            let completion = record.child_set_completion();
            assert_eq!(completion.host_root(), render.work_in_progress());
            assert_eq!(completion.child_count(), 2);
            assert_eq!(completion.first_child_tag(), FiberTag::HostComponent);
            assert_eq!(completion.last_child_tag(), FiberTag::HostText);
            assert!(
                completion
                    .subtree_flags()
                    .contains_all(FiberFlags::PLACEMENT)
            );

            let complete_work = record.complete_work();
            assert_eq!(complete_work.root(), root_id);
            assert_eq!(
                complete_work.host_root_work_in_progress(),
                render.work_in_progress()
            );
            assert_eq!(complete_work.root_child_count(), 2);
            assert_eq!(complete_work.completed_child_count(), 2);
            assert_eq!(
                complete_work.root_child_tag(),
                Some(FiberTag::HostComponent)
            );
            assert_eq!(
                complete_work.last_root_child_tag(),
                Some(FiberTag::HostText)
            );
            assert_eq!(
                complete_work.completed_child_tag(),
                Some(FiberTag::HostComponent)
            );
            assert_eq!(
                complete_work.last_completed_child_tag(),
                Some(FiberTag::HostText)
            );
            assert_eq!(complete_work.render_lanes(), Lanes::DEFAULT);
            assert_eq!(complete_work.resulting_element(), original_root_element);
            assert_eq!(complete_work.detached_instance_count(), 1);
            assert_eq!(complete_work.detached_text_count(), 2);

            let first = complete_work.root_child().unwrap();
            let second = complete_work.last_root_child().unwrap();
            assert_eq!(completion.first_child(), first);
            assert_eq!(completion.last_child(), second);
            assert_eq!(complete_work.completed_child(), Some(first));
            assert_eq!(complete_work.last_completed_child(), Some(second));

            let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
            assert_eq!(root_node.child(), Some(first));
            assert!(
                root_node
                    .subtree_flags()
                    .contains_all(FiberFlags::PLACEMENT)
            );
            assert_eq!(root_node.child_lanes(), Lanes::NO);

            let first_node = store.fiber_arena().get(first).unwrap();
            let second_node = store.fiber_arena().get(second).unwrap();
            assert_eq!(first_node.tag(), FiberTag::HostComponent);
            assert_eq!(first_node.return_fiber(), Some(render.work_in_progress()));
            assert_eq!(first_node.sibling(), Some(second));
            assert!(first_node.state_node().is_some());
            assert!(first_node.flags().contains_all(FiberFlags::PLACEMENT));
            assert_eq!(second_node.tag(), FiberTag::HostText);
            assert_eq!(second_node.return_fiber(), Some(render.work_in_progress()));
            assert_eq!(second_node.sibling(), None);
            assert!(second_node.state_node().is_some());
            assert!(second_node.flags().contains_all(FiberFlags::PLACEMENT));
            store.fiber_arena().validate_topology().unwrap();

            assert_eq!(store.root(root_id).unwrap().current(), current);
            assert_eq!(store.root(root_id).unwrap().finished_work(), None);
            assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
            assert_eq!(
                store.root(root_id).unwrap().scheduling().work_in_progress(),
                Some(render.work_in_progress())
            );
            assert_eq!(
                host.operations(),
                vec![
                    "root_host_context",
                    "child_host_context",
                    "should_set_text_content",
                    "create_text_instance",
                    "create_instance",
                    "append_initial_child",
                    "finalize_initial_children",
                    "create_text_instance",
                ]
            );
        }
    }

    #[test]
    fn root_work_loop_one_level_child_set_executes_private_container_appends_after_commit() {
        for (index, kind) in [
            HostRootOneLevelChildSetKind::Array,
            HostRootOneLevelChildSetKind::Fragment,
        ]
        .into_iter()
        .enumerate()
        {
            let raw = index as u64;
            let (mut store, root_id, mut host) = root_store();
            let mut source = TestHostTree::new();
            let first_element =
                source.insert_host_element_with_text("article", format!("first {raw}"));
            let second_element = source.insert_text(format!("second {raw}"));
            let original_root_element = RootElementHandle::from_raw(85_500 + raw);
            let current = store.root(root_id).unwrap().current();
            update_container(&mut store, root_id, original_root_element, None).unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let entries = vec![
                HostRootOneLevelChildSetEntry::host(first_element),
                HostRootOneLevelChildSetEntry::host(second_element),
            ];
            let child_set = match kind {
                HostRootOneLevelChildSetKind::Array => {
                    HostRootOneLevelChildSet::array(original_root_element, entries)
                }
                HostRootOneLevelChildSetKind::Fragment => {
                    HostRootOneLevelChildSet::fragment(original_root_element, None, entries)
                }
            };

            let (record, mut host_work) =
                handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
                    &mut store,
                    &mut host,
                    render,
                    &source,
                    &child_set,
                    DetachedHostRecords::default(),
                )
                .unwrap();
            let host_operation_count_after_complete_work = host.operations().len();
            let finished_work_handoff =
                commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                    &mut store,
                    render,
                    855_001 + index,
                    855_101 + index,
                )
                .unwrap();
            let operations_before_apply = host.operations();
            let apply = apply_test_host_root_commit_mutations_for_canary(
                &mut store,
                &mut host,
                finished_work_handoff.commit(),
                &mut host_work,
            )
            .unwrap();

            assert_eq!(record.kind(), kind);
            assert_eq!(record.root_element(), original_root_element);
            assert_eq!(
                record.begin_work().children(),
                &[first_element, second_element]
            );
            assert_eq!(record.child_count(), 2);
            assert_eq!(
                host_operation_count_after_complete_work,
                operations_before_apply.len()
            );
            assert_eq!(
                store.root(root_id).unwrap().current(),
                render.work_in_progress()
            );
            assert_eq!(finished_work_handoff.pending().previous_current(), current);
            assert!(finished_work_handoff.mutation_execution_blocked());
            assert!(finished_work_handoff.public_root_rendering_blocked());

            let complete_work = record.complete_work();
            let first = complete_work.root_child().unwrap();
            let second = complete_work.last_root_child().unwrap();
            let first_state_node = store.fiber_arena().get(first).unwrap().state_node();
            let second_state_node = store.fiber_arena().get(second).unwrap().state_node();
            assert_eq!(complete_work.root_child_count(), 2);
            assert_eq!(complete_work.completed_child_count(), 2);
            assert_eq!(
                complete_work.root_child_tag(),
                Some(FiberTag::HostComponent)
            );
            assert_eq!(
                complete_work.last_root_child_tag(),
                Some(FiberTag::HostText)
            );

            let diagnostics = finished_work_handoff
                .commit()
                .host_root_placement_apply_diagnostics_for_canary();
            assert_eq!(diagnostics.len(), 2);
            assert_eq!(diagnostics[0].fiber(), first);
            assert_eq!(diagnostics[0].tag(), FiberTag::HostComponent);
            assert_eq!(diagnostics[0].state_node(), first_state_node);
            assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
            assert_eq!(diagnostics[0].sibling_status(), "append");
            assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
            assert!(!diagnostics[0].can_insert_before());
            assert_eq!(diagnostics[1].fiber(), second);
            assert_eq!(diagnostics[1].tag(), FiberTag::HostText);
            assert_eq!(diagnostics[1].state_node(), second_state_node);
            assert_eq!(diagnostics[1].apply_kind(), "append-placement-to-container");
            assert_eq!(diagnostics[1].sibling_status(), "append");
            assert_eq!(diagnostics[1].skipped_pending_sibling_count(), 0);
            assert!(!diagnostics[1].can_insert_before());

            assert_eq!(apply.root(), root_id);
            assert_eq!(apply.finished_work(), render.work_in_progress());
            assert_eq!(apply.records().len(), 2);
            assert_eq!(apply.records()[0].mutation().fiber(), first);
            assert_eq!(
                apply.records()[0].mutation().kind(),
                HostRootMutationApplyRecordKind::AppendPlacementToContainer
            );
            assert_eq!(
                apply.records()[0].status(),
                TestHostRootMutationApplyStatus::Applied(
                    TestHostRootMutationHostCall::AppendChildToContainer
                )
            );
            assert_eq!(apply.records()[1].mutation().fiber(), second);
            assert_eq!(
                apply.records()[1].mutation().kind(),
                HostRootMutationApplyRecordKind::AppendPlacementToContainer
            );
            assert_eq!(
                apply.records()[1].status(),
                TestHostRootMutationApplyStatus::Applied(
                    TestHostRootMutationHostCall::AppendChildToContainer
                )
            );
            assert_eq!(apply.applied_host_call_count(), 2);
            assert_eq!(apply.private_host_store_update_count(), 0);
            let mut expected_operations = operations_before_apply;
            expected_operations.push("append_child_to_container");
            expected_operations.push("append_child_to_container");
            assert_eq!(host.operations(), expected_operations);
        }
    }

    #[test]
    fn root_work_loop_one_level_child_set_executes_private_insert_before_stable_root_sibling() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let stable_element = source.insert_text("stable sibling");
        update_container(&mut store, root_id, stable_element, None).unwrap();
        let stable_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut stable_host_work =
            mount_test_host_work(&mut store, &mut host, stable_render, &source).unwrap();
        let stable_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store,
                stable_render,
                855_201,
                855_202,
            )
            .unwrap();
        let stable_apply = apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            stable_handoff.commit(),
            &mut stable_host_work,
        )
        .unwrap();
        assert_eq!(stable_apply.applied_host_call_count(), 1);
        assert_eq!(
            stable_apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::AppendChildToContainer
            )
        );

        let stable_current = stable_host_work.root_child().unwrap();
        let stable_node = store.fiber_arena().get(stable_current).unwrap();
        let stable_state_node = stable_node.state_node();
        let stable_props = stable_node.memoized_props();
        let detached_hosts = stable_host_work.into_detached_hosts_for_canary();

        let first_element = source.insert_host_element_with_text("article", "inserted component");
        let second_element = source.insert_text("inserted text");
        let update_root_element = RootElementHandle::from_raw(85_520);
        update_container(&mut store, root_id, update_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let child_set = HostRootOneLevelChildSet::array(
            update_root_element,
            vec![
                HostRootOneLevelChildSetEntry::host(first_element),
                HostRootOneLevelChildSetEntry::host(second_element),
            ],
        );
        let (record, mut host_work) =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
                &mut store,
                &mut host,
                render,
                &source,
                &child_set,
                detached_hosts,
            )
            .unwrap();
        let first = record.complete_work().root_child().unwrap();
        let second = record.complete_work().last_root_child().unwrap();
        let stable_work = append_stable_root_text_work_after_one_level_child_set(
            &mut store,
            render,
            first,
            second,
            stable_current,
            stable_state_node,
            stable_props,
        );
        let finished_work_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store, render, 855_203, 855_204,
            )
            .unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            finished_work_handoff.commit(),
            &mut host_work,
        )
        .unwrap();

        assert_eq!(
            record.begin_work().children(),
            &[first_element, second_element]
        );
        assert_eq!(
            record.complete_work().root_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(
            record.complete_work().last_root_child_tag(),
            Some(FiberTag::HostText)
        );

        let diagnostics = finished_work_handoff
            .commit()
            .host_root_placement_apply_diagnostics_for_canary();
        assert_eq!(diagnostics.len(), 2);
        assert_eq!(diagnostics[0].fiber(), first);
        assert_eq!(
            diagnostics[0].apply_kind(),
            "insert-placement-in-container-before"
        );
        assert_eq!(diagnostics[0].sibling_status(), "insert-before");
        assert_eq!(diagnostics[0].sibling(), Some(stable_work));
        assert_eq!(diagnostics[0].sibling_tag(), Some(FiberTag::HostText));
        assert_eq!(diagnostics[0].sibling_state_node(), stable_state_node);
        assert_eq!(diagnostics[0].skipped_pending_sibling_count(), 1);
        assert!(diagnostics[0].can_insert_before());
        assert_eq!(diagnostics[1].fiber(), second);
        assert_eq!(
            diagnostics[1].apply_kind(),
            "insert-placement-in-container-before"
        );
        assert_eq!(diagnostics[1].sibling_status(), "insert-before");
        assert_eq!(diagnostics[1].sibling(), Some(stable_work));
        assert_eq!(diagnostics[1].sibling_state_node(), stable_state_node);
        assert_eq!(diagnostics[1].skipped_pending_sibling_count(), 0);
        assert!(diagnostics[1].can_insert_before());

        assert_eq!(apply.records().len(), 2);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::InsertInContainerBefore
            )
        );
        assert_eq!(
            apply.records()[1].mutation().kind(),
            HostRootMutationApplyRecordKind::InsertPlacementInContainerBefore
        );
        assert_eq!(
            apply.records()[1].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::InsertInContainerBefore
            )
        );
        assert_eq!(apply.applied_host_call_count(), 2);
        let mut expected_operations = operations_before_apply;
        expected_operations.push("insert_in_container_before");
        expected_operations.push("insert_in_container_before");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn root_work_loop_one_level_child_set_records_only_for_unproven_stable_sibling() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let first_element = source.insert_host_element_with_text("article", "blocked component");
        let second_element = source.insert_text("blocked text");
        let root_element = RootElementHandle::from_raw(85_530);
        update_container(&mut store, root_id, root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let child_set = HostRootOneLevelChildSet::array(
            root_element,
            vec![
                HostRootOneLevelChildSetEntry::host(first_element),
                HostRootOneLevelChildSetEntry::host(second_element),
            ],
        );
        let (record, mut host_work) =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
                &mut store,
                &mut host,
                render,
                &source,
                &child_set,
                DetachedHostRecords::default(),
            )
            .unwrap();
        let first = record.complete_work().root_child().unwrap();
        let second = record.complete_work().last_root_child().unwrap();
        let mode = store
            .fiber_arena()
            .get(render.work_in_progress())
            .unwrap()
            .mode();
        let unproven_sibling = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(85_531),
            mode,
        );
        store
            .fiber_arena_mut()
            .get_mut(unproven_sibling)
            .unwrap()
            .set_memoized_props(PropsHandle::from_raw(85_531));
        store
            .fiber_arena_mut()
            .set_children(
                render.work_in_progress(),
                &[first, second, unproven_sibling],
            )
            .unwrap();
        complete_host_root_one_level_child_set_for_test(
            store.fiber_arena_mut(),
            render.work_in_progress(),
            3,
        )
        .unwrap();
        let finished_work_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store, render, 855_301, 855_302,
            )
            .unwrap();
        let operations_before_apply = host.operations();
        let apply = apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            finished_work_handoff.commit(),
            &mut host_work,
        )
        .unwrap();

        let diagnostics = finished_work_handoff
            .commit()
            .host_root_placement_apply_diagnostics_for_canary();
        assert_eq!(diagnostics.len(), 2);
        assert_eq!(
            diagnostics[0].apply_kind(),
            "record-placement-insertion-blocked"
        );
        assert_eq!(
            diagnostics[0].sibling_status(),
            "blocked-missing-state-node"
        );
        assert_eq!(diagnostics[0].sibling(), Some(unproven_sibling));
        assert_eq!(
            diagnostics[1].apply_kind(),
            "record-placement-insertion-blocked"
        );
        assert_eq!(
            diagnostics[1].sibling_status(),
            "blocked-missing-state-node"
        );
        assert_eq!(diagnostics[1].sibling(), Some(unproven_sibling));
        assert_eq!(apply.records().len(), 2);
        assert_eq!(
            apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
        );
        assert_eq!(
            apply.records()[0].status(),
            TestHostRootMutationApplyStatus::RecordedOnly
        );
        assert_eq!(
            apply.records()[1].mutation().kind(),
            HostRootMutationApplyRecordKind::RecordPlacementInsertionBlocked
        );
        assert_eq!(
            apply.records()[1].status(),
            TestHostRootMutationApplyStatus::RecordedOnly
        );
        assert_eq!(apply.applied_host_call_count(), 0);
        assert_eq!(host.operations(), operations_before_apply);
    }

    #[test]
    fn root_work_loop_one_level_child_set_rejects_stale_insert_before_sibling_before_host_call() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let stable_element = source.insert_text("stale sibling");
        update_container(&mut store, root_id, stable_element, None).unwrap();
        let stable_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut stable_host_work =
            mount_test_host_work(&mut store, &mut host, stable_render, &source).unwrap();
        let stable_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store,
                stable_render,
                855_401,
                855_402,
            )
            .unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            stable_handoff.commit(),
            &mut stable_host_work,
        )
        .unwrap();

        let stable_current = stable_host_work.root_child().unwrap();
        let stable_node = store.fiber_arena().get(stable_current).unwrap();
        let stable_state_node = stable_node.state_node();
        let stable_props = stable_node.memoized_props();
        let detached_hosts = stable_host_work.into_detached_hosts_for_canary();

        let first_element = source.insert_host_element_with_text("article", "stale component");
        let second_element = source.insert_text("stale text");
        let update_root_element = RootElementHandle::from_raw(85_540);
        update_container(&mut store, root_id, update_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let child_set = HostRootOneLevelChildSet::array(
            update_root_element,
            vec![
                HostRootOneLevelChildSetEntry::host(first_element),
                HostRootOneLevelChildSetEntry::host(second_element),
            ],
        );
        let (record, mut host_work) =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set_retaining_host_work(
                &mut store,
                &mut host,
                render,
                &source,
                &child_set,
                detached_hosts,
            )
            .unwrap();
        let first = record.complete_work().root_child().unwrap();
        let second = record.complete_work().last_root_child().unwrap();
        append_stable_root_text_work_after_one_level_child_set(
            &mut store,
            render,
            first,
            second,
            stable_current,
            stable_state_node,
            stable_props,
        );
        let finished_work_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store, render, 855_403, 855_404,
            )
            .unwrap();
        let operations_before_apply = host.operations();
        host_work
            .detached_hosts_mut_for_canary()
            .invalidate_text_for_canary(stable_state_node)
            .unwrap();

        let error = apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            finished_work_handoff.commit(),
            &mut host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostWorkError::HostNode(error) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(host.operations(), operations_before_apply);
    }

    #[test]
    fn root_work_loop_root_unmount_one_level_child_set_sync_executes_container_removal_and_cleanup()
    {
        let (mut store, root_id, mut host) = root_store();
        let mut mounted =
            mount_one_level_root_host_output_for_unmount(&mut store, &mut host, root_id, 86_200);
        let update =
            update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        let unmount_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();

        let execution = execute_root_unmount_from_mounted_one_level_output(
            &mut store,
            &mut host,
            unmount_render,
            &mounted.complete_work,
            &mut mounted.host_work,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER + 10,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 10,
        )
        .unwrap();

        assert_eq!(update.lane(), Lane::SYNC);
        assert_eq!(
            execution.render.resulting_element(),
            RootElementHandle::NONE
        );
        assert_eq!(execution.render.render_lanes(), Lanes::SYNC);
        assert_eq!(
            execution.deleted_children,
            vec![mounted.first_child, mounted.second_child]
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            execution.render.finished_work()
        );
        assert_eq!(
            current_host_root_element(&store, root_id),
            RootElementHandle::NONE
        );
        assert_eq!(
            execution.finished_work_handoff.commit_order(),
            ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 10
        );
        assert!(execution.finished_work_handoff.mutation_execution_blocked());
        assert!(
            execution
                .finished_work_handoff
                .public_root_rendering_blocked()
        );

        let commit = execution.finished_work_handoff.commit();
        assert_eq!(commit.finished_lanes(), Lanes::SYNC);
        assert_eq!(commit.deletion_lists().len(), 1);
        assert_eq!(
            commit.deletion_lists()[0].parent(),
            execution.render.finished_work()
        );
        assert_eq!(
            commit.deletion_lists()[0].deleted(),
            &[mounted.first_child, mounted.second_child]
        );
        assert_eq!(commit.host_node_deletion_cleanup_log().len(), 3);

        assert_eq!(execution.mutation_apply.records().len(), 2);
        assert_eq!(
            execution.mutation_apply.records()[0].mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        );
        assert_eq!(
            execution.mutation_apply.records()[0].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer
            )
        );
        assert_eq!(
            execution.mutation_apply.records()[1].mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        );
        assert_eq!(
            execution.mutation_apply.records()[1].status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer
            )
        );
        assert_eq!(execution.mutation_apply.applied_host_call_count(), 2);

        assert_eq!(execution.deletion_cleanup.root(), root_id);
        assert_eq!(
            execution.deletion_cleanup.finished_work(),
            execution.render.finished_work()
        );
        assert_eq!(execution.deletion_cleanup.records().len(), 3);
        assert_eq!(execution.deletion_cleanup.applied_record_count(), 3);
        assert_eq!(execution.deletion_cleanup.detached_instance_count(), 1);
        assert_eq!(execution.deletion_cleanup.invalidated_text_count(), 2);
        assert_eq!(
            execution
                .deletion_cleanup
                .records()
                .iter()
                .filter(|record| record.previous_metadata().is_some())
                .count(),
            3
        );
        assert!(execution.deletion_cleanup.records().iter().any(|record| {
            record.cleanup().fiber() == mounted.first_child
                && record.status()
                    == TestHostRootDeletionCleanupStatus::Applied(
                        TestHostRootDeletionCleanupAction::DetachDeletedInstance,
                    )
        }));
        assert!(execution.deletion_cleanup.records().iter().any(|record| {
            record.cleanup().fiber() == mounted.second_child
                && record.status()
                    == TestHostRootDeletionCleanupStatus::Applied(
                        TestHostRootDeletionCleanupAction::InvalidateDeletedText,
                    )
        }));

        assert!(
            !mounted
                .host_work
                .detached_hosts_mut_for_canary()
                .instance_metadata(mounted.first_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            !mounted
                .host_work
                .detached_hosts_mut_for_canary()
                .text_metadata(mounted.second_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            store.host_tokens().len(),
            mounted.token_count_after_mount + execution.deletion_cleanup.records().len()
        );

        let mut expected_operations = mounted.operations_after_mount.clone();
        expected_operations.push("remove_child_from_container");
        expected_operations.push("remove_child_from_container");
        expected_operations.push("detach_deleted_instance");
        assert_eq!(
            execution.operations_before_apply,
            mounted.operations_after_mount
        );
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn root_work_loop_root_unmount_rejects_stale_detached_host_before_container_remove() {
        let (mut store, root_id, mut host) = root_store();
        let mut mounted =
            mount_one_level_root_host_output_for_unmount(&mut store, &mut host, root_id, 86_210);
        update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        let unmount_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        mounted
            .host_work
            .detached_hosts_mut_for_canary()
            .invalidate_text_for_canary(mounted.second_state_node)
            .unwrap();
        let operations_before_unmount = host.operations();

        let error = execute_root_unmount_from_mounted_one_level_output(
            &mut store,
            &mut host,
            unmount_render,
            &mounted.complete_work,
            &mut mounted.host_work,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER + 20,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 20,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            RootWorkLoopRootUnmountExecutionError::HostWork(HostWorkError::HostNode(error))
                if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(host.operations(), operations_before_unmount);
    }

    #[test]
    fn root_work_loop_root_unmount_rejects_cross_root_mount_evidence_before_host_call() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let first_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let mut host = RecordingHost::default();
        let mut mounted =
            mount_one_level_root_host_output_for_unmount(&mut store, &mut host, first_root, 86_220);
        let first_current_after_mount = store.root(first_root).unwrap().current();
        update_container_sync(&mut store, second_root, RootElementHandle::NONE, None).unwrap();
        let second_render =
            render_host_root_for_lanes(&mut store, second_root, Lanes::SYNC).unwrap();
        let operations_before_unmount = host.operations();

        let error = execute_root_unmount_from_mounted_one_level_output(
            &mut store,
            &mut host,
            second_render,
            &mounted.complete_work,
            &mut mounted.host_work,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER + 30,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 30,
        )
        .unwrap_err();

        assert_eq!(
            error,
            RootWorkLoopRootUnmountExecutionError::MountRootMismatch {
                expected: first_root,
                actual: second_root,
            }
        );
        assert_eq!(host.operations(), operations_before_unmount);
        assert_eq!(
            store.root(first_root).unwrap().current(),
            first_current_after_mount
        );
    }

    #[test]
    fn root_work_loop_root_unmount_rejects_double_unmount_and_render_after_unmount_before_host_call()
     {
        let (mut store, root_id, mut host) = root_store();
        let mut mounted =
            mount_one_level_root_host_output_for_unmount(&mut store, &mut host, root_id, 86_230);
        update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        let unmount_render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        let execution = execute_root_unmount_from_mounted_one_level_output(
            &mut store,
            &mut host,
            unmount_render,
            &mounted.complete_work,
            &mut mounted.host_work,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER + 40,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 40,
        )
        .unwrap();
        let operations_after_unmount = host.operations();

        let replay_error = preflight_test_host_root_deletion_apply_and_cleanup_for_canary(
            &store,
            execution.finished_work_handoff.commit(),
            &mounted.host_work,
        )
        .unwrap_err();
        assert!(matches!(
            replay_error,
            HostWorkError::HostNode(error) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(host.operations(), operations_after_unmount);

        update_container_sync(&mut store, root_id, RootElementHandle::NONE, None).unwrap();
        let render_after_unmount =
            render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();
        let render_after_error = execute_root_unmount_from_mounted_one_level_output(
            &mut store,
            &mut host,
            render_after_unmount,
            &mounted.complete_work,
            &mut mounted.host_work,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_SOURCE_ORDER + 41,
            ROOT_WORK_LOOP_ROOT_UNMOUNT_COMMIT_ORDER + 41,
        )
        .unwrap_err();

        assert!(matches!(
            render_after_error,
            RootWorkLoopRootUnmountExecutionError::AlreadyUnmounted { root, .. }
                if root == root_id
        ));
        assert_eq!(host.operations(), operations_after_unmount);
    }

    #[test]
    fn root_work_loop_one_level_child_set_handoff_fails_closed_for_keyed_or_nested_shapes() {
        let (mut keyed_fragment_store, keyed_fragment_root, mut keyed_fragment_host) = root_store();
        let keyed_fragment_source = TestHostTree::new();
        let keyed_fragment_element = RootElementHandle::from_raw(1_230);
        let keyed_fragment_current = keyed_fragment_store
            .root(keyed_fragment_root)
            .unwrap()
            .current();
        update_container(
            &mut keyed_fragment_store,
            keyed_fragment_root,
            keyed_fragment_element,
            None,
        )
        .unwrap();
        let keyed_fragment_render = render_host_root_for_lanes(
            &mut keyed_fragment_store,
            keyed_fragment_root,
            Lanes::DEFAULT,
        )
        .unwrap();
        let keyed_fragment_set = HostRootOneLevelChildSet::fragment(
            keyed_fragment_element,
            Some(ReactKey::from_normalized("root-fragment")),
            vec![
                HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(1_231)),
                HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(1_232)),
            ],
        );

        let keyed_fragment_error =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
                &mut keyed_fragment_store,
                &mut keyed_fragment_host,
                keyed_fragment_render,
                &keyed_fragment_source,
                &keyed_fragment_set,
            )
            .unwrap_err();

        assert_eq!(
            keyed_fragment_error,
            HostRootOneLevelChildSetCompleteWorkHandoffError::BeginWork(
                HostRootOneLevelChildSetBeginWorkError::KeyedFragmentUnsupported {
                    root_element: keyed_fragment_element,
                    key: ReactKey::from_normalized("root-fragment"),
                },
            )
        );
        assert_one_level_child_set_handoff_failed_before_host_work(
            &keyed_fragment_store,
            &keyed_fragment_host,
            keyed_fragment_root,
            keyed_fragment_current,
            keyed_fragment_render,
        );

        let (mut keyed_host_store, keyed_host_root, mut keyed_host_host) = root_store();
        let mut keyed_host_source = TestHostTree::new();
        let keyed_host_element = RootElementHandle::from_raw(1_240);
        let keyed_child = keyed_host_source.insert_text("keyed child");
        let second_child = keyed_host_source.insert_text("plain child");
        let keyed_host_current = keyed_host_store.root(keyed_host_root).unwrap().current();
        update_container(
            &mut keyed_host_store,
            keyed_host_root,
            keyed_host_element,
            None,
        )
        .unwrap();
        let keyed_host_render =
            render_host_root_for_lanes(&mut keyed_host_store, keyed_host_root, Lanes::DEFAULT)
                .unwrap();
        let keyed_host_set = HostRootOneLevelChildSet::array(
            keyed_host_element,
            vec![
                HostRootOneLevelChildSetEntry::keyed_host(
                    keyed_child,
                    ReactKey::from_normalized("child"),
                ),
                HostRootOneLevelChildSetEntry::host(second_child),
            ],
        );

        let keyed_host_error =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
                &mut keyed_host_store,
                &mut keyed_host_host,
                keyed_host_render,
                &keyed_host_source,
                &keyed_host_set,
            )
            .unwrap_err();

        assert_eq!(
            keyed_host_error,
            HostRootOneLevelChildSetCompleteWorkHandoffError::BeginWork(
                HostRootOneLevelChildSetBeginWorkError::KeyedHostChildUnsupported {
                    root_element: keyed_host_element,
                    kind: HostRootOneLevelChildSetKind::Array,
                    child_index: 0,
                    element: keyed_child,
                    key: ReactKey::from_normalized("child"),
                },
            )
        );
        assert_one_level_child_set_handoff_failed_before_host_work(
            &keyed_host_store,
            &keyed_host_host,
            keyed_host_root,
            keyed_host_current,
            keyed_host_render,
        );

        let (mut nested_array_store, nested_array_root, mut nested_array_host) = root_store();
        let mut nested_array_source = TestHostTree::new();
        let nested_array_element = RootElementHandle::from_raw(1_250);
        let nested_first = nested_array_source.insert_text("nested first");
        let nested_second = nested_array_source.insert_text("nested second");
        let nested_array_current = nested_array_store
            .root(nested_array_root)
            .unwrap()
            .current();
        update_container(
            &mut nested_array_store,
            nested_array_root,
            nested_array_element,
            None,
        )
        .unwrap();
        let nested_array_render =
            render_host_root_for_lanes(&mut nested_array_store, nested_array_root, Lanes::DEFAULT)
                .unwrap();
        let nested_array_set = HostRootOneLevelChildSet::array(
            nested_array_element,
            vec![
                HostRootOneLevelChildSetEntry::host(nested_first),
                HostRootOneLevelChildSetEntry::nested_array(Some(nested_second)),
            ],
        );

        let nested_array_error =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
                &mut nested_array_store,
                &mut nested_array_host,
                nested_array_render,
                &nested_array_source,
                &nested_array_set,
            )
            .unwrap_err();

        assert_eq!(
            nested_array_error,
            HostRootOneLevelChildSetCompleteWorkHandoffError::BeginWork(
                HostRootOneLevelChildSetBeginWorkError::NestedChildSetUnsupported {
                    root_element: nested_array_element,
                    kind: HostRootOneLevelChildSetKind::Array,
                    child_index: 1,
                    nested_kind: HostRootOneLevelChildSetKind::Array,
                    first_child: Some(nested_second),
                },
            )
        );
        assert_one_level_child_set_handoff_failed_before_host_work(
            &nested_array_store,
            &nested_array_host,
            nested_array_root,
            nested_array_current,
            nested_array_render,
        );

        let (mut nested_fragment_store, nested_fragment_root, mut nested_fragment_host) =
            root_store();
        let mut nested_fragment_source = TestHostTree::new();
        let nested_fragment_element = RootElementHandle::from_raw(1_260);
        let fragment_first = nested_fragment_source.insert_text("fragment first");
        let fragment_second = nested_fragment_source.insert_text("fragment second");
        let nested_fragment_current = nested_fragment_store
            .root(nested_fragment_root)
            .unwrap()
            .current();
        update_container(
            &mut nested_fragment_store,
            nested_fragment_root,
            nested_fragment_element,
            None,
        )
        .unwrap();
        let nested_fragment_render = render_host_root_for_lanes(
            &mut nested_fragment_store,
            nested_fragment_root,
            Lanes::DEFAULT,
        )
        .unwrap();
        let nested_fragment_set = HostRootOneLevelChildSet::fragment(
            nested_fragment_element,
            None,
            vec![
                HostRootOneLevelChildSetEntry::nested_fragment(
                    Some(ReactKey::from_normalized("nested-fragment")),
                    Some(fragment_first),
                ),
                HostRootOneLevelChildSetEntry::host(fragment_second),
            ],
        );

        let nested_fragment_error =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
                &mut nested_fragment_store,
                &mut nested_fragment_host,
                nested_fragment_render,
                &nested_fragment_source,
                &nested_fragment_set,
            )
            .unwrap_err();

        assert_eq!(
            nested_fragment_error,
            HostRootOneLevelChildSetCompleteWorkHandoffError::BeginWork(
                HostRootOneLevelChildSetBeginWorkError::NestedChildSetUnsupported {
                    root_element: nested_fragment_element,
                    kind: HostRootOneLevelChildSetKind::Fragment,
                    child_index: 0,
                    nested_kind: HostRootOneLevelChildSetKind::Fragment,
                    first_child: Some(fragment_first),
                },
            )
        );
        assert_one_level_child_set_handoff_failed_before_host_work(
            &nested_fragment_store,
            &nested_fragment_host,
            nested_fragment_root,
            nested_fragment_current,
            nested_fragment_render,
        );
    }

    #[test]
    fn root_work_loop_one_level_child_set_handoff_fails_closed_for_mismatch_or_missing_source() {
        let (mut mismatch_store, mismatch_root, mut mismatch_host) = root_store();
        let mut mismatch_source = TestHostTree::new();
        let render_element = RootElementHandle::from_raw(1_270);
        let child_set_element = RootElementHandle::from_raw(1_271);
        let first = mismatch_source.insert_text("mismatch first");
        let second = mismatch_source.insert_text("mismatch second");
        let mismatch_current = mismatch_store.root(mismatch_root).unwrap().current();
        update_container(&mut mismatch_store, mismatch_root, render_element, None).unwrap();
        let mismatch_render =
            render_host_root_for_lanes(&mut mismatch_store, mismatch_root, Lanes::DEFAULT).unwrap();
        let mismatch_set = HostRootOneLevelChildSet::array(
            child_set_element,
            vec![
                HostRootOneLevelChildSetEntry::host(first),
                HostRootOneLevelChildSetEntry::host(second),
            ],
        );

        let mismatch_error =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
                &mut mismatch_store,
                &mut mismatch_host,
                mismatch_render,
                &mismatch_source,
                &mismatch_set,
            )
            .unwrap_err();

        assert_eq!(
            mismatch_error,
            HostRootOneLevelChildSetCompleteWorkHandoffError::RootElementMismatch {
                render_element,
                child_set_element,
            }
        );
        assert_one_level_child_set_handoff_failed_before_host_work(
            &mismatch_store,
            &mismatch_host,
            mismatch_root,
            mismatch_current,
            mismatch_render,
        );

        let (mut missing_store, missing_root, mut missing_host) = root_store();
        let mut missing_source = TestHostTree::new();
        let root_element = RootElementHandle::from_raw(1_280);
        let missing_child = RootElementHandle::from_raw(1_281);
        let present_child = missing_source.insert_text("present child");
        let missing_current = missing_store.root(missing_root).unwrap().current();
        update_container(&mut missing_store, missing_root, root_element, None).unwrap();
        let missing_render =
            render_host_root_for_lanes(&mut missing_store, missing_root, Lanes::DEFAULT).unwrap();
        let missing_set = HostRootOneLevelChildSet::array(
            root_element,
            vec![
                HostRootOneLevelChildSetEntry::host(missing_child),
                HostRootOneLevelChildSetEntry::host(present_child),
            ],
        );

        let missing_error =
            handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
                &mut missing_store,
                &mut missing_host,
                missing_render,
                &missing_source,
                &missing_set,
            )
            .unwrap_err();

        assert_eq!(
            missing_error,
            HostRootOneLevelChildSetCompleteWorkHandoffError::MissingTestRootElement {
                element: missing_child,
            }
        );
        assert_one_level_child_set_handoff_failed_before_host_work(
            &missing_store,
            &missing_host,
            missing_root,
            missing_current,
            missing_render,
        );
    }

    #[test]
    fn root_work_loop_multiple_sibling_handoff_preserves_fragment_portal_suspense_blockers() {
        for (index, tag) in [FiberTag::Fragment, FiberTag::Portal, FiberTag::Suspense]
            .into_iter()
            .enumerate()
        {
            let raw = index as u64;
            let (mut store, root_id, mut host) = root_store();
            let mut source = TestHostTree::new();
            let first_element = source.insert_text(format!("blocked first {raw}"));
            let second_element = source.insert_text(format!("blocked second {raw}"));
            let current = store.root(root_id).unwrap().current();
            update_container(
                &mut store,
                root_id,
                RootElementHandle::from_raw(990 + raw),
                None,
            )
            .unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let blocked_child = match tag {
                FiberTag::Fragment => {
                    attach_fragment_wip_child_with_descendant(&mut store, render.work_in_progress())
                        .0
                }
                FiberTag::Portal => {
                    attach_portal_wip_child(&mut store, render.work_in_progress()).0
                }
                FiberTag::Suspense => {
                    attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag)
                }
                _ => unreachable!("test only covers explicit blocker tags"),
            };

            let error = handoff_completed_host_root_render_to_test_complete_work_for_siblings(
                &mut store,
                &mut host,
                render,
                &source,
                &[first_element, second_element],
            )
            .unwrap_err();

            match tag {
                FiberTag::Fragment => assert_eq!(
                    error,
                    HostRootCompleteWorkHandoffError::ExistingRootChildUnsupported {
                        root: root_id,
                        host_root_work_in_progress: render.work_in_progress(),
                        child: blocked_child,
                        tag: FiberTag::Fragment,
                    }
                ),
                FiberTag::Portal => match error {
                    HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
                        HostRootChildBeginWorkPreflightError::UnsupportedPortal {
                            root,
                            host_root_work_in_progress,
                            portal,
                        } => {
                            assert_eq!(root, root_id);
                            assert_eq!(host_root_work_in_progress, render.work_in_progress());
                            assert_eq!(portal.fiber(), blocked_child);
                            assert_eq!(portal.feature(), PORTAL_RECONCILER_UNSUPPORTED_FEATURE);
                        }
                        other => panic!("expected portal blocker, got {other:?}"),
                    },
                    other => panic!("expected child preflight blocker, got {other:?}"),
                },
                FiberTag::Suspense => match error {
                    HostRootCompleteWorkHandoffError::ChildPreflight(error) => {
                        assert_root_child_preflight_blocks_unsupported_tag(
                            *error,
                            root_id,
                            render.work_in_progress(),
                            blocked_child,
                            FiberTag::Suspense,
                            SUSPENSE_UNSUPPORTED_FEATURE,
                            render.render_lanes(),
                        );
                    }
                    other => panic!("expected child preflight blocker, got {other:?}"),
                },
                _ => unreachable!("test only covers explicit blocker tags"),
            }

            assert_client_root_fail_closed_without_side_effects(
                &store,
                &host,
                root_id,
                current,
                render,
                blocked_child,
            );
        }
    }

    #[test]
    fn root_work_loop_hands_function_component_host_component_output_to_test_complete_work() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let child_element = source.insert_host_element_with_text("main", "from function");
        let original_root_element = RootElementHandle::from_raw(900);
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (_current_child, function_component, component) =
            attach_function_component_wip_child(&mut store, render.work_in_progress());
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);

        let record = handoff_completed_function_component_single_child_to_test_complete_work(
            &mut store,
            &mut host,
            render,
            &source,
            &mut registry,
            &resolver,
        )
        .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.original_root_element(), original_root_element);
        assert_eq!(record.function_component(), function_component);
        assert_eq!(record.begin_work().output(), output);
        assert_eq!(
            record.begin_work().single_child().function_component(),
            function_component
        );
        assert_eq!(record.child_element(), child_element);
        assert_eq!(record.child_tag(), FiberTag::HostComponent);
        assert_eq!(record.complete_work().resulting_element(), child_element);
        assert_eq!(
            record.complete_work().root_child_tag(),
            Some(FiberTag::FunctionComponent)
        );
        assert_eq!(
            record.complete_work().completed_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(record.complete_work().detached_instance_count(), 1);
        assert_eq!(record.complete_work().detached_text_count(), 1);

        let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
        assert_eq!(root_node.child(), Some(function_component));
        let function_node = store.fiber_arena().get(function_component).unwrap();
        let host_child = record.complete_work().completed_child().unwrap();
        assert_eq!(
            function_node.return_fiber(),
            Some(render.work_in_progress())
        );
        assert_eq!(function_node.sibling(), None);
        assert_eq!(function_node.child(), Some(host_child));
        assert!(
            function_node
                .flags()
                .contains_all(FiberFlags::PERFORMED_WORK)
        );
        assert!(
            function_node
                .subtree_flags()
                .contains_all(FiberFlags::PLACEMENT)
        );
        assert_eq!(
            store.fiber_arena().get(host_child).unwrap().tag(),
            FiberTag::HostComponent
        );
        assert_eq!(
            store.fiber_arena().get(host_child).unwrap().return_fiber(),
            Some(function_component)
        );
        store.fiber_arena().validate_topology().unwrap();
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
            ]
        );
    }

    #[test]
    fn root_work_loop_hands_function_component_host_text_output_to_test_complete_work() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let child_element = source.insert_text("function text");
        let original_root_element = RootElementHandle::from_raw(901);
        update_container(&mut store, root_id, original_root_element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (_current_child, function_component, component) =
            attach_function_component_wip_child(&mut store, render.work_in_progress());
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);

        let record = handoff_completed_function_component_single_child_to_test_complete_work(
            &mut store,
            &mut host,
            render,
            &source,
            &mut registry,
            &resolver,
        )
        .unwrap();

        assert_eq!(record.function_component(), function_component);
        assert_eq!(record.original_root_element(), original_root_element);
        assert_eq!(record.child_element(), child_element);
        assert_eq!(record.child_tag(), FiberTag::HostText);
        assert_eq!(
            record.complete_work().root_child_tag(),
            Some(FiberTag::FunctionComponent)
        );
        assert_eq!(
            record.complete_work().completed_child_tag(),
            Some(FiberTag::HostText)
        );
        assert_eq!(record.complete_work().detached_instance_count(), 0);
        assert_eq!(record.complete_work().detached_text_count(), 1);
        let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
        assert_eq!(root_node.child(), Some(function_component));
        let function_node = store.fiber_arena().get(function_component).unwrap();
        let host_child = record.complete_work().completed_child().unwrap();
        assert_eq!(
            function_node.return_fiber(),
            Some(render.work_in_progress())
        );
        assert_eq!(function_node.child(), Some(host_child));
        let host_child_node = store.fiber_arena().get(host_child).unwrap();
        assert_eq!(host_child_node.tag(), FiberTag::HostText);
        assert_eq!(host_child_node.return_fiber(), Some(function_component));
        assert!(host_child_node.state_node().is_some());
        store.fiber_arena().validate_topology().unwrap();
        assert_eq!(
            host.operations(),
            vec!["root_host_context", "create_text_instance"]
        );
    }

    #[test]
    fn root_work_loop_function_component_single_child_executes_private_container_append_after_commit()
     {
        for (index, expected_tag) in [FiberTag::HostText, FiberTag::HostComponent]
            .into_iter()
            .enumerate()
        {
            let (mut store, root_id, mut host) = root_store();
            let mut source = TestHostTree::new();
            let child_element = match expected_tag {
                FiberTag::HostText => source.insert_text("function text execution"),
                FiberTag::HostComponent => {
                    source.insert_host_element_with_text("main", "function host execution")
                }
                _ => unreachable!("test only covers HostText and HostComponent"),
            };
            let root_element = RootElementHandle::from_raw(86_500 + index as u64);
            let mut fixture = function_component_single_child_commit_fixture(
                &mut store,
                &mut host,
                root_id,
                &source,
                root_element,
                child_element,
            );
            let completed_child = fixture.complete_work.completed_child().unwrap();
            let operations_before_execute = host.operations();

            let apply = execute_function_component_single_child_host_mutation_for_canary(
                &mut store,
                &mut host,
                fixture.render,
                fixture.function_component,
                fixture.single_child,
                fixture.complete_work,
                fixture.finished_work_handoff.commit(),
                &mut fixture.host_work,
            )
            .unwrap();

            assert!(fixture.finished_work_handoff.mutation_execution_blocked());
            assert!(
                fixture
                    .finished_work_handoff
                    .public_root_rendering_blocked()
            );
            assert!(
                fixture
                    .finished_work_handoff
                    .effects_refs_and_hydration_blocked()
            );
            assert_eq!(fixture.single_child.child_tag(), expected_tag);
            assert_single_function_component_container_append(
                &apply,
                root_id,
                fixture.render.work_in_progress(),
                completed_child,
                expected_tag,
            );
            assert_eq!(
                store.root(root_id).unwrap().current(),
                fixture.render.work_in_progress()
            );
            let mut expected_operations = operations_before_execute;
            expected_operations.push("append_child_to_container");
            assert_eq!(host.operations(), expected_operations);
        }
    }

    #[test]
    fn root_work_loop_function_component_host_mutation_rejects_stale_cross_root_or_missing_child_evidence()
     {
        let (mut missing_store, missing_root, mut missing_host) = root_store();
        let mut missing_source = TestHostTree::new();
        let missing_child = missing_source.insert_text("missing child evidence");
        let mut missing_fixture = function_component_single_child_commit_fixture(
            &mut missing_store,
            &mut missing_host,
            missing_root,
            &missing_source,
            RootElementHandle::from_raw(86_600),
            missing_child,
        );
        let missing_completed_child = missing_fixture.complete_work.completed_child().unwrap();
        missing_store
            .fiber_arena_mut()
            .set_children(missing_fixture.function_component, &[])
            .unwrap();
        let missing_operations_before_execute = missing_host.operations();

        let missing_error = execute_function_component_single_child_host_mutation_for_canary(
            &mut missing_store,
            &mut missing_host,
            missing_fixture.render,
            missing_fixture.function_component,
            missing_fixture.single_child,
            missing_fixture.complete_work,
            missing_fixture.finished_work_handoff.commit(),
            &mut missing_fixture.host_work,
        )
        .unwrap_err();

        assert_eq!(
            missing_error,
            HostRootFunctionComponentSingleChildHostMutationExecutionError::FunctionComponentHostChildMismatch {
                root: missing_root,
                function_component: missing_fixture.function_component,
                expected_child: missing_completed_child,
                actual_child: None,
            }
        );
        assert_eq!(missing_host.operations(), missing_operations_before_execute);

        let (mut root_child_store, root_child_root, mut root_child_host) = root_store();
        let mut root_child_source = TestHostTree::new();
        let root_child_element = root_child_source.insert_text("detached root child evidence");
        let mut root_child_fixture = function_component_single_child_commit_fixture(
            &mut root_child_store,
            &mut root_child_host,
            root_child_root,
            &root_child_source,
            RootElementHandle::from_raw(86_605),
            root_child_element,
        );
        root_child_store
            .fiber_arena_mut()
            .set_children(root_child_fixture.render.work_in_progress(), &[])
            .unwrap();
        assert_eq!(
            root_child_store.root(root_child_root).unwrap().current(),
            root_child_fixture.render.work_in_progress()
        );
        let root_child_operations_before_execute = root_child_host.operations();

        let root_child_error = execute_function_component_single_child_host_mutation_for_canary(
            &mut root_child_store,
            &mut root_child_host,
            root_child_fixture.render,
            root_child_fixture.function_component,
            root_child_fixture.single_child,
            root_child_fixture.complete_work,
            root_child_fixture.finished_work_handoff.commit(),
            &mut root_child_fixture.host_work,
        )
        .unwrap_err();

        assert_eq!(
            root_child_error,
            HostRootFunctionComponentSingleChildHostMutationExecutionError::RootFunctionComponentMismatch {
                root: root_child_root,
                expected_function_component: root_child_fixture.function_component,
                actual_root_child: None,
            }
        );
        assert_eq!(
            root_child_host.operations(),
            root_child_operations_before_execute
        );

        let (mut stale_store, stale_root, mut stale_host) = root_store();
        let mut stale_source = TestHostTree::new();
        let stale_child = stale_source.insert_text("stale function evidence");
        let mut stale_fixture = function_component_single_child_commit_fixture(
            &mut stale_store,
            &mut stale_host,
            stale_root,
            &stale_source,
            RootElementHandle::from_raw(86_610),
            stale_child,
        );
        let stale_current = stale_store.fiber_arena_mut().create_fiber(
            FiberTag::HostRoot,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        stale_store
            .root_mut(stale_root)
            .unwrap()
            .set_current(stale_current);
        let stale_operations_before_execute = stale_host.operations();

        let stale_error = execute_function_component_single_child_host_mutation_for_canary(
            &mut stale_store,
            &mut stale_host,
            stale_fixture.render,
            stale_fixture.function_component,
            stale_fixture.single_child,
            stale_fixture.complete_work,
            stale_fixture.finished_work_handoff.commit(),
            &mut stale_fixture.host_work,
        )
        .unwrap_err();

        assert_eq!(
            stale_error,
            HostRootFunctionComponentSingleChildHostMutationExecutionError::StaleFinishedWorkEvidence {
                root: stale_root,
                expected_current: stale_fixture.finished_work_handoff.commit().current(),
                actual_current: stale_current,
            }
        );
        assert_eq!(stale_host.operations(), stale_operations_before_execute);

        let mut cross_store = FiberRootStore::<RecordingHost>::new();
        let mut cross_host = RecordingHost::default();
        let cross_root = cross_store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let other_root = cross_store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let mut cross_source = TestHostTree::new();
        let cross_child = cross_source.insert_text("cross root function evidence");
        let other_child = cross_source.insert_text("other root function evidence");
        let cross_fixture = function_component_single_child_commit_fixture(
            &mut cross_store,
            &mut cross_host,
            cross_root,
            &cross_source,
            RootElementHandle::from_raw(86_620),
            cross_child,
        );
        let mut other_fixture = function_component_single_child_commit_fixture(
            &mut cross_store,
            &mut cross_host,
            other_root,
            &cross_source,
            RootElementHandle::from_raw(86_630),
            other_child,
        );
        let cross_operations_before_execute = cross_host.operations();

        let cross_error = execute_function_component_single_child_host_mutation_for_canary(
            &mut cross_store,
            &mut cross_host,
            cross_fixture.render,
            cross_fixture.function_component,
            cross_fixture.single_child,
            cross_fixture.complete_work,
            cross_fixture.finished_work_handoff.commit(),
            &mut other_fixture.host_work,
        )
        .unwrap_err();

        assert_eq!(
            cross_error,
            HostRootFunctionComponentSingleChildHostMutationExecutionError::MismatchedRootOwnership {
                expected_root: cross_root,
                actual_root: other_root,
            }
        );
        assert_eq!(cross_host.operations(), cross_operations_before_execute);
    }

    #[test]
    fn root_work_loop_use_state_dispatch_renders_function_host_text_and_commits_metadata() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let child_element = source.insert_text("state text commit");
        let root_current = store.root(root_id).unwrap().current();
        let (function_current, function_work_in_progress, component) =
            attach_function_component_current_child_with_work_pair(&mut store, root_id);
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let current_state = hook_store
            .create_current_state_hook(function_current, StateHandle::from_raw(700))
            .unwrap();
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);
        let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

        let rescheduled = hook_store
            .dispatch_state_update_and_reschedule_root(
                &mut store,
                FunctionComponentStateDispatchRequest::new(
                    current_state.dispatch(),
                    action(701),
                    lane,
                ),
            )
            .unwrap();

        assert_eq!(rescheduled.root(), root_id);
        assert_eq!(rescheduled.dispatch().fiber(), function_current);
        assert_eq!(rescheduled.dispatch().queue(), current_state.queue());
        assert_eq!(rescheduled.dispatch().dispatch(), current_state.dispatch());
        assert_eq!(rescheduled.reschedule().fiber(), function_current);
        assert_eq!(rescheduled.scheduled().root(), root_id);
        assert!(rescheduled.scheduled().inserted());
        assert!(rescheduled.scheduled().microtask().is_some());
        assert!(
            store
                .fiber_arena()
                .get(function_current)
                .unwrap()
                .lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert!(
            store
                .fiber_arena()
                .get(function_work_in_progress)
                .unwrap()
                .lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert!(
            store
                .fiber_arena()
                .get(root_current)
                .unwrap()
                .child_lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        assert_eq!(processed.records().len(), 1);
        assert_eq!(processed.records()[0].root(), root_id);
        assert_eq!(processed.records()[0].next_lanes(), Lanes::DEFAULT);
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        let callback = processed.records()[0].scheduled_callback().unwrap();
        let callback_render = render_host_root_via_scheduler_callback(
            &mut store,
            root_id,
            callback.node(),
            Lanes::DEFAULT,
        )
        .unwrap();
        assert_eq!(
            callback_render.status(),
            SchedulerCallbackRenderStatus::Rendered
        );
        assert_eq!(callback_render.validation().root(), root_id);
        let render = callback_render.render_phase().unwrap();
        assert_eq!(render.root(), root_id);
        assert_eq!(render.current(), root_current);
        assert_eq!(render.render_lanes(), Lanes::DEFAULT);
        store
            .fiber_arena_mut()
            .set_children(render.work_in_progress(), &[function_work_in_progress])
            .unwrap();

        let state_request = FunctionComponentUseStateRenderRequest::new(
            StateHandle::from_raw(999),
            FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT),
        );
        let record =
            handoff_completed_function_component_use_state_host_child_to_test_complete_work_and_commit(
                &mut store,
                &mut host,
                render,
                &source,
                &mut hook_store,
                state_request,
                &mut registry,
                &resolver,
                action_as_state,
            )
            .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.original_root_element(), render.resulting_element());
        assert_eq!(record.function_component(), function_work_in_progress);
        assert_eq!(
            record.use_state_begin_work().render().current(),
            Some(function_current)
        );
        assert_eq!(
            record.use_state_begin_work().work_in_progress(),
            function_work_in_progress
        );
        assert_eq!(record.use_state_begin_work().output(), output);
        let state_update = record
            .use_state_begin_work()
            .state_hook()
            .update_record()
            .unwrap();
        assert_eq!(
            state_update.previous_memoized_state(),
            StateHandle::from_raw(700)
        );
        assert_eq!(state_update.memoized_state(), StateHandle::from_raw(701));
        assert_eq!(state_update.applied_update_count(), 1);
        assert_eq!(state_update.skipped_update_count(), 0);
        assert_eq!(state_update.remaining_lanes(), Lanes::NO);
        assert_eq!(
            hook_store
                .state_queues()
                .pending_updates(current_state.queue())
                .unwrap(),
            Vec::<fast_react_core::HookUpdateId>::new()
        );
        assert_eq!(record.single_child().child_tag(), FiberTag::HostText);
        assert_eq!(record.single_child().child_element(), child_element);
        assert_eq!(
            record.complete_work().root_child_tag(),
            Some(FiberTag::FunctionComponent)
        );
        assert_eq!(
            record.complete_work().completed_child_tag(),
            Some(FiberTag::HostText)
        );
        assert_eq!(record.complete_work().detached_text_count(), 1);
        assert_eq!(record.complete_work().detached_instance_count(), 0);

        let finished_work_handoff = record.finished_work_handoff();
        assert_eq!(finished_work_handoff.pending().root(), root_id);
        assert_eq!(
            finished_work_handoff.pending().finished_work(),
            render.finished_work()
        );
        assert_eq!(
            finished_work_handoff.pending().finished_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(
            finished_work_handoff.execution_request().finished_work(),
            render.finished_work()
        );
        assert!(finished_work_handoff.consumed_finished_work_record());
        assert!(finished_work_handoff.mutation_execution_blocked());
        assert!(finished_work_handoff.public_root_rendering_blocked());
        assert!(finished_work_handoff.effects_refs_and_hydration_blocked());
        assert_eq!(record.commit().root(), root_id);
        assert_eq!(record.commit().previous_current(), root_current);
        assert_eq!(record.commit().current(), render.work_in_progress());
        assert_eq!(record.commit().finished_lanes(), Lanes::DEFAULT);
        assert_eq!(record.commit().pending_lanes(), Lanes::NO);
        assert_eq!(record.commit().mutation_log().len(), 1);
        assert_eq!(record.commit().mutation_apply_log().len(), 1);
        assert!(record.host_operations_unchanged_by_commit());
        let completed_child = record.complete_work().completed_child().unwrap();
        assert_single_function_component_container_append(
            record.host_mutation_apply(),
            root_id,
            render.work_in_progress(),
            completed_child,
            FiberTag::HostText,
        );
        assert!(record.private_test_host_mutation_executed());
        assert_eq!(
            record.host_operation_count_after_host_mutation(),
            host.operations().len()
        );
        assert!(record.public_render_blocked());

        let diagnostics = record.placement_apply_diagnostics();
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].root(), root_id);
        assert_eq!(diagnostics[0].host_root(), render.finished_work());
        assert_eq!(diagnostics[0].tag(), FiberTag::HostText);
        assert_eq!(diagnostics[0].tag_name(), "HostText");
        assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
        assert_eq!(diagnostics[0].sibling_status(), "append");
        assert_eq!(diagnostics[0].sibling(), None);
        assert_eq!(diagnostics[0].sibling_tag(), None);
        assert!(!diagnostics[0].can_insert_before());
        assert_eq!(
            store.fiber_arena().get(completed_child).unwrap().tag(),
            FiberTag::HostText
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.work_in_progress()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .render_exit_status(),
            RootRenderExitStatus::NoWork
        );
        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "create_text_instance",
                "append_child_to_container"
            ]
        );

        let public_error = crate::render_mutation_placeholder(&mut host).unwrap_err();
        assert_eq!(
            public_error,
            ReconcilerError::unimplemented(MUTATION_RENDER_PLACEHOLDER_FEATURE)
        );
    }

    #[test]
    fn root_work_loop_use_reducer_dispatch_renders_function_host_child_and_commits_metadata() {
        let mut source = TestHostTree::new();
        let host_text = source.insert_text("reducer text commit");
        let host_component = source.insert_host_element_with_text("section", "reducer host commit");

        for (
            expected_tag,
            child_element,
            initial_state,
            action_handle,
            previous_reducer,
            next_reducer,
        ) in [
            (
                FiberTag::HostText,
                host_text,
                StateHandle::from_raw(800),
                action(8),
                reducer(801),
                reducer(802),
            ),
            (
                FiberTag::HostComponent,
                host_component,
                StateHandle::from_raw(900),
                action(9),
                reducer(901),
                reducer(902),
            ),
        ] {
            let (mut store, root_id, mut host) = root_store();
            let root_current = store.root(root_id).unwrap().current();
            let (function_current, function_work_in_progress, component) =
                attach_function_component_current_child_with_work_pair(&mut store, root_id);
            let mut hook_store = FunctionComponentHookRenderStore::new();
            let current_reducer = hook_store
                .create_current_reducer_hook(function_current, previous_reducer, initial_state)
                .unwrap();
            let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
            let mut registry = TestFunctionComponentRegistry::default();
            registry.register(component, Ok(output));
            let resolver = TestHostTreeFunctionOutputResolver::new(&source);
            let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();

            let rescheduled = hook_store
                .dispatch_reducer_update_and_reschedule_root(
                    &mut store,
                    FunctionComponentReducerDispatchRequest::new(
                        current_reducer.dispatch(),
                        action_handle,
                        lane,
                    ),
                )
                .unwrap();

            assert_eq!(rescheduled.root(), root_id);
            assert_eq!(rescheduled.dispatch().fiber(), function_current);
            assert_eq!(rescheduled.dispatch().queue(), current_reducer.queue());
            assert_eq!(
                rescheduled.dispatch().dispatch(),
                current_reducer.dispatch()
            );
            assert_eq!(rescheduled.dispatch().reducer(), previous_reducer);
            assert_eq!(rescheduled.reschedule().fiber(), function_current);
            assert_eq!(rescheduled.scheduled().root(), root_id);
            assert!(rescheduled.scheduled().inserted());
            assert!(rescheduled.scheduled().microtask().is_some());
            assert!(
                store
                    .fiber_arena()
                    .get(function_current)
                    .unwrap()
                    .lanes()
                    .contains_lane(Lane::DEFAULT)
            );
            assert!(
                store
                    .root(root_id)
                    .unwrap()
                    .lanes()
                    .pending_lanes()
                    .contains_lane(Lane::DEFAULT)
            );

            let processed = process_root_schedule_in_microtask(&mut store).unwrap();
            assert_eq!(processed.records().len(), 1);
            let callback = processed.records()[0].scheduled_callback().unwrap();
            let callback_render = render_host_root_via_scheduler_callback(
                &mut store,
                root_id,
                callback.node(),
                Lanes::DEFAULT,
            )
            .unwrap();
            assert_eq!(
                callback_render.status(),
                SchedulerCallbackRenderStatus::Rendered
            );
            let render = callback_render.render_phase().unwrap();
            assert_eq!(render.root(), root_id);
            assert_eq!(render.current(), root_current);
            assert_eq!(render.render_lanes(), Lanes::DEFAULT);
            store
                .fiber_arena_mut()
                .set_children(render.work_in_progress(), &[function_work_in_progress])
                .unwrap();

            let reducer_request = FunctionComponentUseReducerRenderRequest::new(
                next_reducer,
                StateHandle::from_raw(999),
                FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT),
            );
            let mut reducer_calls = 0;
            let record =
                handoff_completed_function_component_use_reducer_single_child_to_test_complete_work_and_commit(
                    &mut store,
                    &mut host,
                    render,
                    &source,
                    &mut hook_store,
                    reducer_request,
                    &mut registry,
                    &resolver,
                    |state, action| {
                        reducer_calls += 1;
                        StateHandle::from_raw(state.raw() + action.raw())
                    },
                )
                .unwrap();

            assert_eq!(record.root(), root_id);
            assert_eq!(
                record.host_root_work_in_progress(),
                render.work_in_progress()
            );
            assert_eq!(record.original_root_element(), render.resulting_element());
            assert_eq!(record.function_component(), function_work_in_progress);
            assert_eq!(
                record.use_reducer_render().current(),
                Some(function_current)
            );
            assert_eq!(
                record.use_reducer_render().work_in_progress(),
                function_work_in_progress
            );
            assert_eq!(record.use_reducer_render().output(), output);
            let reducer_update = record
                .use_reducer_render()
                .reducer_hook()
                .update_record()
                .unwrap();
            assert_eq!(reducer_update.reducer(), next_reducer);
            assert_eq!(reducer_update.previous_memoized_state(), initial_state);
            assert_eq!(
                reducer_update.memoized_state(),
                StateHandle::from_raw(initial_state.raw() + action_handle.raw())
            );
            assert_eq!(reducer_update.remaining_lanes(), Lanes::NO);
            assert_eq!(reducer_update.applied_update_count(), 1);
            assert_eq!(reducer_update.skipped_update_count(), 0);
            assert_eq!(reducer_calls, 1);
            assert_eq!(record.single_child().child_tag(), expected_tag);
            assert_eq!(record.single_child().child_element(), child_element);
            assert_eq!(
                record.complete_work().root_child_tag(),
                Some(FiberTag::FunctionComponent)
            );
            assert_eq!(
                record.complete_work().completed_child_tag(),
                Some(expected_tag)
            );
            assert_eq!(record.complete_work().completed_child_count(), 1);
            assert_eq!(record.finished_work_handoff().pending().root(), root_id);
            assert_eq!(
                record.finished_work_handoff().pending().finished_work(),
                render.finished_work()
            );
            assert!(
                record
                    .finished_work_handoff()
                    .consumed_finished_work_record()
            );
            assert!(record.finished_work_handoff().mutation_execution_blocked());
            assert!(
                record
                    .finished_work_handoff()
                    .public_root_rendering_blocked()
            );
            assert!(
                record
                    .finished_work_handoff()
                    .effects_refs_and_hydration_blocked()
            );
            assert_eq!(record.commit().root(), root_id);
            assert_eq!(record.commit().previous_current(), root_current);
            assert_eq!(record.commit().current(), render.work_in_progress());
            assert_eq!(record.commit().finished_lanes(), Lanes::DEFAULT);
            assert_eq!(record.commit().pending_lanes(), Lanes::NO);
            assert_eq!(record.commit().mutation_log().len(), 1);
            assert_eq!(record.commit().mutation_apply_log().len(), 1);
            assert!(record.host_operations_unchanged_by_commit());
            let completed_child = record.complete_work().completed_child().unwrap();
            assert_single_function_component_container_append(
                record.host_mutation_apply(),
                root_id,
                render.work_in_progress(),
                completed_child,
                expected_tag,
            );
            assert!(record.private_test_host_mutation_executed());
            assert_eq!(
                record.host_operation_count_after_host_mutation(),
                host.operations().len()
            );
            assert!(record.public_render_blocked());
            let diagnostics = record.placement_apply_diagnostics();
            assert_eq!(diagnostics.len(), 1);
            assert_eq!(diagnostics[0].root(), root_id);
            assert_eq!(diagnostics[0].host_root(), render.finished_work());
            assert_eq!(diagnostics[0].tag(), expected_tag);
            assert_eq!(
                diagnostics[0].tag_name(),
                match expected_tag {
                    FiberTag::HostText => "HostText",
                    FiberTag::HostComponent => "HostComponent",
                    _ => unreachable!("test only covers HostText and HostComponent"),
                }
            );
            assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
            assert_eq!(diagnostics[0].sibling_status(), "append");
            assert_eq!(diagnostics[0].sibling(), None);
            assert_eq!(diagnostics[0].sibling_tag(), None);
            assert!(!diagnostics[0].can_insert_before());
            assert_eq!(
                store.fiber_arena().get(completed_child).unwrap().tag(),
                expected_tag
            );
            assert_eq!(
                store.root(root_id).unwrap().current(),
                render.work_in_progress()
            );
            assert_eq!(store.root(root_id).unwrap().finished_work(), None);
            assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
            assert_eq!(
                store.root(root_id).unwrap().lanes().pending_lanes(),
                Lanes::NO
            );
            assert_eq!(registry.calls().len(), 1);
            assert_eq!(
                hook_store
                    .state_queues()
                    .pending_updates(current_reducer.queue())
                    .unwrap(),
                Vec::<fast_react_core::HookUpdateId>::new()
            );
            let queue = hook_store
                .state_queues()
                .queue(current_reducer.queue())
                .unwrap();
            assert_eq!(
                queue.last_rendered_reducer().copied(),
                Some(FunctionComponentStateReducerId::Reducer(next_reducer))
            );
            assert_eq!(
                *queue.last_rendered_state(),
                StateHandle::from_raw(initial_state.raw() + action_handle.raw())
            );
            let expected_operations = match expected_tag {
                FiberTag::HostText => vec![
                    "root_host_context",
                    "create_text_instance",
                    "append_child_to_container",
                ],
                FiberTag::HostComponent => vec![
                    "root_host_context",
                    "child_host_context",
                    "should_set_text_content",
                    "create_text_instance",
                    "create_instance",
                    "append_initial_child",
                    "finalize_initial_children",
                    "append_child_to_container",
                ],
                _ => unreachable!("test only covers HostText and HostComponent"),
            };
            assert_eq!(host.operations(), expected_operations);
        }
    }

    #[test]
    fn root_work_loop_use_reducer_transition_lane_rebase_then_commit() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let child_element = source.insert_text("transition reducer commit");
        let root_current = store.root(root_id).unwrap().current();
        let (function_current, function_work_in_progress, component) =
            attach_function_component_current_child_with_work_pair(&mut store, root_id);
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let reducer_id = FunctionComponentReducerHandle::from_raw(1_203);
        let current_reducer = hook_store
            .create_current_reducer_hook(function_current, reducer_id, StateHandle::from_raw(1_300))
            .unwrap();
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);
        let transition_lanes = Lanes::from(Lane::TRANSITION_1);
        let transition_lane = HookUpdateLane::from_lane(Lane::TRANSITION_1).unwrap();
        let dispatch_request = FunctionComponentReducerDispatchRequest::new(
            current_reducer.dispatch(),
            action(23),
            transition_lane,
        );

        let rescheduled = hook_store
            .dispatch_reducer_update_and_reschedule_root(&mut store, dispatch_request)
            .unwrap();

        assert_eq!(rescheduled.root(), root_id);
        assert_eq!(rescheduled.dispatch().fiber(), function_current);
        assert_eq!(rescheduled.dispatch().queue(), current_reducer.queue());
        assert_eq!(rescheduled.dispatch().reducer(), reducer_id);
        assert_eq!(rescheduled.dispatch().lane(), transition_lane);
        assert_eq!(rescheduled.reschedule().lane(), Lane::TRANSITION_1);
        assert_eq!(rescheduled.scheduled().root(), root_id);
        assert!(rescheduled.scheduled().inserted());
        assert!(rescheduled.scheduled().microtask().is_some());
        assert!(
            store
                .fiber_arena()
                .get(function_current)
                .unwrap()
                .lanes()
                .contains_lane(Lane::TRANSITION_1)
        );
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::TRANSITION_1)
        );

        let skipped_render = render_function_component_with_use_reducer(
            store.fiber_arena_mut(),
            &mut hook_store,
            function_work_in_progress,
            Lanes::SYNC,
            FunctionComponentUseReducerRenderRequest::new(
                reducer_id,
                StateHandle::from_raw(9_999),
                FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC),
            ),
            &mut registry,
            |_, _| panic!("transition reducer update should skip during sync render"),
        )
        .unwrap();
        let skipped_update = skipped_render.reducer_hook().update_record().unwrap();

        assert_eq!(skipped_render.render_lanes(), Lanes::SYNC);
        assert_eq!(
            skipped_update.memoized_state(),
            StateHandle::from_raw(1_300)
        );
        assert_eq!(skipped_update.base_state(), StateHandle::from_raw(1_300));
        assert_eq!(skipped_update.remaining_lanes(), transition_lanes);
        assert_eq!(skipped_update.applied_update_count(), 0);
        assert_eq!(skipped_update.skipped_update_count(), 1);
        let skipped_base_tail = skipped_update.base_queue().unwrap();
        let rebased = hook_store
            .state_queues()
            .update_ring(Some(skipped_base_tail))
            .unwrap();
        assert_eq!(rebased.len(), 1);
        let rebased_update = hook_store.state_queues().update(rebased[0]).unwrap();
        assert_eq!(rebased_update.lane(), transition_lane);
        assert_eq!(*rebased_update.action(), action(23));
        hook_store.bind_current_list_unchecked(
            function_current,
            skipped_render.hook_state().work_in_progress_list(),
        );

        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        assert_eq!(processed.records().len(), 1);
        assert_eq!(processed.records()[0].root(), root_id);
        assert_eq!(processed.records()[0].next_lanes(), transition_lanes);
        assert_eq!(
            processed.records()[0].outcome(),
            RootTaskScheduleOutcome::Scheduled
        );
        let callback = processed.records()[0].scheduled_callback().unwrap();
        let callback_render = render_host_root_via_scheduler_callback(
            &mut store,
            root_id,
            callback.node(),
            transition_lanes,
        )
        .unwrap();
        assert_eq!(
            callback_render.status(),
            SchedulerCallbackRenderStatus::Rendered
        );
        let render = callback_render.render_phase().unwrap();
        assert_eq!(render.root(), root_id);
        assert_eq!(render.current(), root_current);
        assert_eq!(render.render_lanes(), transition_lanes);
        store
            .fiber_arena_mut()
            .set_children(render.work_in_progress(), &[function_work_in_progress])
            .unwrap();

        let mut reducer_calls = 0;
        let record =
            handoff_completed_function_component_use_reducer_single_child_to_test_complete_work_and_commit(
                &mut store,
                &mut host,
                render,
                &source,
                &mut hook_store,
                FunctionComponentUseReducerRenderRequest::new(
                    reducer_id,
                    StateHandle::from_raw(9_999),
                    FunctionComponentStateUpdateRenderLanes::new(
                        transition_lanes,
                        transition_lanes,
                    ),
                ),
                &mut registry,
                &resolver,
                |state, action| {
                    reducer_calls += 1;
                    StateHandle::from_raw(state.raw() + action.raw())
                },
            )
            .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(
            record.host_root_work_in_progress(),
            render.work_in_progress()
        );
        assert_eq!(record.function_component(), function_work_in_progress);
        assert_eq!(
            record.use_reducer_render().current(),
            Some(function_current)
        );
        assert_eq!(record.use_reducer_render().render_lanes(), transition_lanes);
        assert_eq!(record.use_reducer_render().output(), output);
        let accepted_update = record
            .use_reducer_render()
            .reducer_hook()
            .update_record()
            .unwrap();
        assert_eq!(
            accepted_update.previous_base_queue(),
            Some(skipped_base_tail)
        );
        assert_eq!(
            accepted_update.memoized_state(),
            StateHandle::from_raw(1_323)
        );
        assert_eq!(accepted_update.base_state(), StateHandle::from_raw(1_323));
        assert_eq!(accepted_update.base_queue(), None);
        assert_eq!(accepted_update.remaining_lanes(), Lanes::NO);
        assert_eq!(accepted_update.applied_update_count(), 1);
        assert_eq!(accepted_update.skipped_update_count(), 0);
        assert_eq!(reducer_calls, 1);
        assert_eq!(record.single_child().child_tag(), FiberTag::HostText);
        assert_eq!(record.single_child().child_element(), child_element);
        assert_eq!(
            record.finished_work_handoff().pending().finished_lanes(),
            transition_lanes
        );
        assert!(
            record
                .finished_work_handoff()
                .execution_request()
                .compatibility_claim_blocked()
        );
        assert!(
            record
                .finished_work_handoff()
                .public_root_rendering_blocked()
        );
        assert!(record.public_render_blocked());
        assert_eq!(record.commit().root(), root_id);
        assert_eq!(record.commit().previous_current(), root_current);
        assert_eq!(record.commit().current(), render.work_in_progress());
        assert_eq!(record.commit().finished_lanes(), transition_lanes);
        assert_eq!(record.commit().pending_lanes(), Lanes::NO);
        let completed_child = record.complete_work().completed_child().unwrap();
        assert_single_function_component_container_append(
            record.host_mutation_apply(),
            root_id,
            render.work_in_progress(),
            completed_child,
            FiberTag::HostText,
        );
        assert!(record.private_test_host_mutation_executed());
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.work_in_progress()
        );
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            Lanes::NO
        );
        assert_eq!(registry.calls().len(), 2);
        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "create_text_instance",
                "append_child_to_container"
            ]
        );
    }

    #[test]
    fn root_work_loop_use_reducer_single_host_update_executes_host_work() {
        let mut source = TestHostTree::new();
        let updated_text = source.insert_text("reducer text update");
        let updated_component =
            source.insert_host_element_with_text("section", "reducer component update");

        for (child_element, previous_props, initial_state, action_handle, reducer_id) in [
            (
                updated_text,
                PropsHandle::from_raw(9_001),
                StateHandle::from_raw(1_000),
                action(11),
                reducer(1_101),
            ),
            (
                updated_component,
                PropsHandle::from_raw(9_002),
                StateHandle::from_raw(2_000),
                action(12),
                reducer(1_102),
            ),
        ] {
            let (expected_tag, element_type, next_props, expected_update_kind) =
                match source.root(child_element).unwrap() {
                    TestHostNode::Text(text) => (
                        FiberTag::HostText,
                        ElementTypeHandle::NONE,
                        text.props(),
                        HostRootMutationApplyRecordKind::CommitHostTextUpdate,
                    ),
                    TestHostNode::Element(element) => (
                        FiberTag::HostComponent,
                        element.element_type(),
                        element.props(),
                        HostRootMutationApplyRecordKind::CommitHostComponentUpdate,
                    ),
                };
            let (mut store, root_id, mut host) = root_store();
            let root_current = store.root(root_id).unwrap().current();
            let (function_current, function_work_in_progress, component) =
                attach_function_component_current_child_with_work_pair(&mut store, root_id);
            let current_child = attach_current_single_host_child(
                &mut store,
                function_current,
                expected_tag,
                previous_props,
                element_type,
                StateNodeHandle::NONE,
            );
            let mut detached_hosts = DetachedHostRecords::new_for_canary();
            let state_node = match source.root(child_element).unwrap() {
                TestHostNode::Text(_) => {
                    create_detached_test_host_text_for_existing_fiber_for_canary(
                        &mut store,
                        &mut host,
                        &mut detached_hosts,
                        root_id,
                        current_child,
                        "previous reducer text update",
                        previous_props,
                    )
                    .unwrap()
                }
                TestHostNode::Element(element) => {
                    create_detached_test_host_component_for_existing_fiber_for_canary(
                        &mut store,
                        &mut host,
                        &mut detached_hosts,
                        root_id,
                        current_child,
                        element.ty(),
                        previous_props,
                        &[],
                    )
                    .unwrap()
                }
            };
            let mut hook_store = FunctionComponentHookRenderStore::new();
            let current_reducer = hook_store
                .create_current_reducer_hook(function_current, reducer_id, initial_state)
                .unwrap();
            let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
            let mut registry = TestFunctionComponentRegistry::default();
            registry.register(component, Ok(output));
            let resolver = TestHostTreeFunctionOutputResolver::new(&source);
            let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
            let rescheduled = hook_store
                .dispatch_reducer_update_and_reschedule_root(
                    &mut store,
                    FunctionComponentReducerDispatchRequest::new(
                        current_reducer.dispatch(),
                        action_handle,
                        lane,
                    ),
                )
                .unwrap();
            let processed = process_root_schedule_in_microtask(&mut store).unwrap();
            let callback = processed.records()[0].scheduled_callback().unwrap();
            let render = render_host_root_via_scheduler_callback(
                &mut store,
                root_id,
                callback.node(),
                Lanes::DEFAULT,
            )
            .unwrap()
            .render_phase()
            .unwrap();
            store
                .fiber_arena_mut()
                .set_children(render.work_in_progress(), &[function_work_in_progress])
                .unwrap();

            let mut reducer_calls = 0;
            let record =
                handoff_completed_function_component_use_reducer_single_host_update_to_commit(
                    &mut store,
                    &mut host,
                    render,
                    &source,
                    detached_hosts,
                    rescheduled,
                    &mut hook_store,
                    FunctionComponentUseReducerRenderRequest::new(
                        reducer_id,
                        StateHandle::from_raw(999),
                        FunctionComponentStateUpdateRenderLanes::new(
                            Lanes::DEFAULT,
                            Lanes::DEFAULT,
                        ),
                    ),
                    &mut registry,
                    &resolver,
                    |state, action| {
                        reducer_calls += 1;
                        StateHandle::from_raw(state.raw() + action.raw())
                    },
                )
                .unwrap();

            assert_eq!(record.root(), root_id);
            assert_eq!(
                record.host_root_work_in_progress(),
                render.work_in_progress()
            );
            assert_eq!(record.original_root_element(), render.resulting_element());
            assert_eq!(record.function_component(), function_work_in_progress);
            assert_eq!(
                record.use_reducer_render().current(),
                Some(function_current)
            );
            assert_eq!(record.use_reducer_render().output(), output);
            assert_eq!(record.hook_evidence().root(), root_id);
            assert_eq!(record.hook_evidence().current(), function_current);
            assert_eq!(
                record.hook_evidence().work_in_progress(),
                function_work_in_progress
            );
            assert_eq!(record.hook_evidence().queue(), current_reducer.queue());
            assert_eq!(
                record.hook_evidence().dispatch(),
                current_reducer.dispatch()
            );
            assert_eq!(record.hook_evidence().dispatch_lane(), lane);
            assert_eq!(record.hook_evidence().render_lanes(), Lanes::DEFAULT);
            assert_eq!(record.hook_evidence().applied_update_count(), 1);
            assert_eq!(record.hook_evidence().skipped_update_count(), 0);
            assert!(!record.hook_evidence().public_hook_compatibility_claimed());
            let reducer_update = record
                .use_reducer_render()
                .reducer_hook()
                .update_record()
                .unwrap();
            assert_eq!(
                reducer_update.memoized_state(),
                StateHandle::from_raw(initial_state.raw() + action_handle.raw())
            );
            assert_eq!(reducer_update.remaining_lanes(), Lanes::NO);
            assert_eq!(reducer_update.applied_update_count(), 1);
            assert_eq!(reducer_update.skipped_update_count(), 0);
            assert_eq!(reducer_calls, 1);

            let single_child = record.single_child_update();
            assert_eq!(single_child.function_component(), function_work_in_progress);
            assert_eq!(single_child.current(), function_current);
            assert_eq!(single_child.current_child(), current_child);
            assert_eq!(single_child.output(), output);
            assert_eq!(single_child.child_element(), child_element);
            assert_eq!(single_child.child_tag(), expected_tag);
            assert_eq!(single_child.child_element_type(), element_type);
            assert_eq!(single_child.previous_child_props(), previous_props);
            assert_eq!(single_child.child_props(), next_props);
            assert_eq!(single_child.render_lanes(), Lanes::DEFAULT);

            let updated_child = single_child.work_in_progress_child();
            let updated_child_node = store.fiber_arena().get(updated_child).unwrap();
            assert_eq!(updated_child_node.alternate(), Some(current_child));
            assert_eq!(
                updated_child_node.return_fiber(),
                Some(function_work_in_progress)
            );
            assert_eq!(updated_child_node.tag(), expected_tag);
            assert_eq!(updated_child_node.state_node(), state_node);
            assert_eq!(updated_child_node.pending_props(), next_props);
            assert_eq!(updated_child_node.memoized_props(), next_props);
            assert!(updated_child_node.flags().contains_all(FiberFlags::UPDATE));
            assert!(
                store
                    .fiber_arena()
                    .get(function_work_in_progress)
                    .unwrap()
                    .subtree_flags()
                    .contains_all(FiberFlags::UPDATE)
            );
            assert!(
                store
                    .fiber_arena()
                    .get(render.work_in_progress())
                    .unwrap()
                    .subtree_flags()
                    .contains_all(FiberFlags::UPDATE)
            );
            assert_eq!(
                record.complete_work().root_child_tag(),
                Some(FiberTag::FunctionComponent)
            );
            assert_eq!(
                record.complete_work().completed_child(),
                Some(updated_child)
            );
            assert_eq!(
                record.complete_work().completed_child_tag(),
                Some(expected_tag)
            );
            assert_eq!(record.complete_work().completed_child_count(), 1);
            match expected_tag {
                FiberTag::HostText => {
                    assert_eq!(record.complete_work().detached_text_count(), 1);
                    assert_eq!(record.complete_work().detached_instance_count(), 0);
                }
                FiberTag::HostComponent => {
                    assert_eq!(record.complete_work().detached_instance_count(), 1);
                    assert_eq!(record.complete_work().detached_text_count(), 0);
                }
                _ => unreachable!("test only covers HostText and HostComponent"),
            }

            let pending_update = record.pending_host_update();
            assert_eq!(pending_update.root(), root_id);
            assert_eq!(pending_update.finished_work(), render.finished_work());
            assert_eq!(pending_update.mutation_record_count(), 1);
            assert_eq!(pending_update.host_update_record_count(), 1);
            assert_eq!(pending_update.fiber(), updated_child);
            assert_eq!(pending_update.alternate_fiber(), Some(current_child));
            assert_eq!(pending_update.state_node(), state_node);
            assert_eq!(pending_update.kind(), expected_update_kind);
            match expected_tag {
                FiberTag::HostText => {
                    assert!(pending_update.is_host_text_content_update());
                    assert!(!pending_update.is_host_component_props_update());
                }
                FiberTag::HostComponent => {
                    assert!(pending_update.is_host_component_props_update());
                    assert!(!pending_update.is_host_text_content_update());
                }
                _ => unreachable!("test only covers HostText and HostComponent"),
            }
            assert_eq!(record.committed_host_update(), pending_update);
            assert_eq!(record.host_execution().root(), root_id);
            assert_eq!(
                record.host_execution().finished_work(),
                render.finished_work()
            );
            assert_eq!(record.host_execution().source_handoff_order(), 1);
            assert_eq!(record.host_execution().commit_order(), 2);
            assert_eq!(
                record.host_execution().mutation(),
                pending_update.mutation()
            );
            assert_eq!(record.host_execution().payload().current(), current_child);
            assert_eq!(
                record.host_execution().payload().work_in_progress(),
                updated_child
            );
            assert_eq!(record.host_execution().payload().state_node(), state_node);
            assert_eq!(record.host_execution().applied_host_call_count(), 1);
            assert_eq!(record.host_execution().private_host_store_update_count(), 0);
            assert!(record.host_execution().test_host_commit_executed());
            assert!(!record.host_execution().react_dom_compatibility_claimed());
            assert!(
                !record
                    .host_execution()
                    .test_renderer_compatibility_claimed()
            );
            match expected_tag {
                FiberTag::HostText => {
                    assert!(
                        record
                            .host_execution()
                            .payload()
                            .is_host_text_content_update()
                    );
                    assert_eq!(
                        record.host_execution().payload().host_text_old_text(),
                        Some("previous reducer text update")
                    );
                    assert_eq!(
                        record.host_execution().payload().host_text_new_text(),
                        Some("reducer text update")
                    );
                }
                FiberTag::HostComponent => {
                    assert!(
                        record
                            .host_execution()
                            .payload()
                            .is_host_component_props_update()
                    );
                    assert_eq!(
                        record.host_execution().payload().host_component_prop_name(),
                        Some("testHostProperty")
                    );
                }
                _ => unreachable!("test only covers HostText and HostComponent"),
            }
            assert_eq!(record.commit().mutation_log().len(), 1);
            assert_eq!(record.commit().mutation_apply_log().len(), 1);
            assert_eq!(
                record.finished_work_handoff().pending().finished_work(),
                render.finished_work()
            );
            assert!(
                record
                    .finished_work_handoff()
                    .consumed_finished_work_record()
            );
            assert!(record.public_render_blocked());
            assert_eq!(record.commit().root(), root_id);
            assert_eq!(record.commit().previous_current(), root_current);
            assert_eq!(record.commit().current(), render.work_in_progress());
            assert_eq!(record.commit().finished_lanes(), Lanes::DEFAULT);
            assert_eq!(record.commit().pending_lanes(), Lanes::NO);
            assert_eq!(
                store.root(root_id).unwrap().current(),
                render.work_in_progress()
            );
            assert_eq!(store.root(root_id).unwrap().finished_work(), None);
            assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
            assert_eq!(
                store.root(root_id).unwrap().lanes().pending_lanes(),
                Lanes::NO
            );
        }
    }

    #[test]
    fn root_work_loop_host_update_executes_host_text_commit_after_prior_mount() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_text("before root text");
        update_container(&mut store, root_id, initial_element, None).unwrap();
        let initial_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store,
                initial_render,
                863_001,
                863_002,
            )
            .unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            initial_handoff.commit(),
            &mut initial_host_work,
        )
        .unwrap();

        let current_text = initial_host_work.root_child().unwrap();
        let state_node = store.fiber_arena().get(current_text).unwrap().state_node();
        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_text("after root text");
        update_container(&mut store, root_id, next_element, None).unwrap();
        let update_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut update_host_work = update_test_host_root_work_with_detached_hosts_for_canary(
            &mut store,
            update_render,
            &source,
            detached_hosts,
        )
        .unwrap();
        let updated_text = update_host_work.root_child().unwrap();
        let pending = record_host_root_finished_work_pending_commit_for_canary(
            &store,
            update_render,
            863_003,
        )
        .unwrap();
        let operations_before_execute = host.operations();

        let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
            &mut store,
            &mut host,
            update_render,
            Some(pending),
            863_004,
            update_host_work.detached_hosts_mut_for_canary(),
        )
        .unwrap();

        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(diagnostic.finished_work(), update_render.finished_work());
        assert_eq!(diagnostic.source_handoff_order(), 863_003);
        assert_eq!(diagnostic.commit_order(), 863_004);
        assert_eq!(diagnostic.mutation().fiber(), updated_text);
        assert_eq!(diagnostic.mutation().alternate_fiber(), Some(current_text));
        assert_eq!(
            diagnostic.status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::CommitTextUpdate
            )
        );
        assert!(diagnostic.test_host_commit_executed());
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(diagnostic.private_host_store_update_count(), 0);
        assert!(diagnostic.payload().is_host_text_content_update());
        assert_eq!(diagnostic.payload().current(), current_text);
        assert_eq!(diagnostic.payload().work_in_progress(), updated_text);
        assert_eq!(diagnostic.payload().state_node(), state_node);
        assert_eq!(
            diagnostic.payload().host_text_old_text(),
            Some("before root text")
        );
        assert_eq!(
            diagnostic.payload().host_text_new_text(),
            Some("after root text")
        );
        assert!(diagnostic.public_root_rendering_blocked());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert!(!diagnostic.test_renderer_compatibility_claimed());
        assert_eq!(
            update_host_work
                .test_host_text_record_text_for_canary(state_node)
                .unwrap(),
            "after root text"
        );
        assert_eq!(
            update_host_work
                .test_host_text_record_update_count_for_canary(state_node)
                .unwrap(),
            1
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            update_render.finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        let mut expected_operations = operations_before_execute;
        expected_operations.push("commit_text_update");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn root_work_loop_host_update_executes_host_component_commit_update_after_prior_mount() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let initial_element =
            source.insert_host_element_with_text("section", "before component text");
        update_container(&mut store, root_id, initial_element, None).unwrap();
        let initial_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store,
                initial_render,
                863_101,
                863_102,
            )
            .unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            initial_handoff.commit(),
            &mut initial_host_work,
        )
        .unwrap();

        let current_component = initial_host_work.root_child().unwrap();
        let state_node = store
            .fiber_arena()
            .get(current_component)
            .unwrap()
            .state_node();
        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_host_element_with_text("section", "after component text");
        update_container(&mut store, root_id, next_element, None).unwrap();
        let update_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut update_host_work = update_test_host_root_work_with_detached_hosts_for_canary(
            &mut store,
            update_render,
            &source,
            detached_hosts,
        )
        .unwrap();
        let updated_component = update_host_work.root_child().unwrap();
        let pending = record_host_root_finished_work_pending_commit_for_canary(
            &store,
            update_render,
            863_103,
        )
        .unwrap();
        let operations_before_execute = host.operations();
        let token_count_before_execute = store.host_tokens().len();

        let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
            &mut store,
            &mut host,
            update_render,
            Some(pending),
            863_104,
            update_host_work.detached_hosts_mut_for_canary(),
        )
        .unwrap();

        assert_eq!(diagnostic.root(), root_id);
        assert_eq!(diagnostic.finished_work(), update_render.finished_work());
        assert_eq!(diagnostic.mutation().fiber(), updated_component);
        assert_eq!(
            diagnostic.mutation().alternate_fiber(),
            Some(current_component)
        );
        assert_eq!(
            diagnostic.status(),
            TestHostRootMutationApplyStatus::Applied(TestHostRootMutationHostCall::CommitUpdate)
        );
        assert!(diagnostic.test_host_commit_executed());
        assert_eq!(diagnostic.applied_host_call_count(), 1);
        assert_eq!(diagnostic.private_host_store_update_count(), 0);
        assert!(diagnostic.payload().is_host_component_props_update());
        assert_eq!(diagnostic.payload().current(), current_component);
        assert_eq!(diagnostic.payload().work_in_progress(), updated_component);
        assert_eq!(diagnostic.payload().state_node(), state_node);
        assert_eq!(
            diagnostic.payload().host_component_property_payload_kind(),
            Some(TestHostComponentPropertyPayloadKind::SafeTestProperty)
        );
        assert!(!diagnostic.public_dom_property_compatibility_claimed());
        assert_eq!(store.host_tokens().len(), token_count_before_execute + 1);
        assert_eq!(
            update_host_work
                .instance_property_update_count_for_canary(state_node)
                .unwrap(),
            1
        );
        assert_eq!(
            update_host_work
                .instance_latest_props_for_canary(state_node)
                .unwrap(),
            None
        );
        let mut expected_operations = operations_before_execute;
        expected_operations.push("commit_update");
        assert_eq!(host.operations(), expected_operations);
    }

    #[test]
    fn root_work_loop_host_update_commits_style_payload_to_private_store_after_prior_mount() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "style before");
        update_container(&mut store, root_id, initial_element, None).unwrap();
        let initial_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store,
                initial_render,
                863_201,
                863_202,
            )
            .unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            initial_handoff.commit(),
            &mut initial_host_work,
        )
        .unwrap();

        let current_component = initial_host_work.root_child().unwrap();
        let state_node = store
            .fiber_arena()
            .get(current_component)
            .unwrap()
            .state_node();
        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_host_element_with_text("section", "style after");
        let next_props = match source.root(next_element).unwrap() {
            TestHostNode::Element(element) => element.props(),
            TestHostNode::Text(_) => unreachable!("component test source must be an element"),
        };
        update_container(&mut store, root_id, next_element, None).unwrap();
        let update_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut update_host_work = update_test_host_root_work_with_detached_hosts_for_canary(
            &mut store,
            update_render,
            &source,
            detached_hosts,
        )
        .unwrap();
        update_host_work
            .mark_completed_host_component_update_payload_as_style_for_canary()
            .unwrap();
        let pending = record_host_root_finished_work_pending_commit_for_canary(
            &store,
            update_render,
            863_203,
        )
        .unwrap();
        let operations_before_execute = host.operations();
        let token_count_before_execute = store.host_tokens().len();

        let diagnostic = apply_one_test_host_update_with_finished_work_handoff_for_canary(
            &mut store,
            &mut host,
            update_render,
            Some(pending),
            863_204,
            update_host_work.detached_hosts_mut_for_canary(),
        )
        .unwrap();

        assert_eq!(
            diagnostic.status(),
            TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
                TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps
            )
        );
        assert!(!diagnostic.test_host_commit_executed());
        assert!(diagnostic.private_host_store_only_commit_executed());
        assert_eq!(diagnostic.applied_host_call_count(), 0);
        assert_eq!(diagnostic.private_host_store_update_count(), 1);
        assert_eq!(
            diagnostic.payload().host_component_property_payload_kind(),
            Some(TestHostComponentPropertyPayloadKind::Style)
        );
        assert!(!diagnostic.public_dom_property_compatibility_claimed());
        assert!(!diagnostic.react_dom_compatibility_claimed());
        assert_eq!(store.host_tokens().len(), token_count_before_execute);
        assert_eq!(
            update_host_work
                .instance_property_update_count_for_canary(state_node)
                .unwrap(),
            1
        );
        assert_eq!(
            update_host_work
                .instance_latest_props_for_canary(state_node)
                .unwrap(),
            Some(next_props)
        );
        assert_eq!(
            update_host_work
                .instance_latest_props_update_count_for_canary(state_node)
                .unwrap(),
            1
        );
        assert_eq!(host.operations(), operations_before_execute);
    }

    #[test]
    fn root_work_loop_host_update_rejects_text_content_conflict_before_host_call() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "before conflict");
        update_container(&mut store, root_id, initial_element, None).unwrap();
        let initial_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store,
                initial_render,
                863_301,
                863_302,
            )
            .unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            initial_handoff.commit(),
            &mut initial_host_work,
        )
        .unwrap();

        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_host_element_with_text("section", "after conflict");
        update_container(&mut store, root_id, next_element, None).unwrap();
        let update_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut update_host_work =
            update_test_host_root_component_with_text_child_work_with_detached_hosts_for_canary(
                &mut store,
                update_render,
                &source,
                detached_hosts,
            )
            .unwrap();
        let updated_component = update_host_work.root_child().unwrap();
        update_host_work
            .mark_completed_host_component_update_payload_as_text_content_reset_for_canary()
            .unwrap();
        let pending = record_host_root_finished_work_pending_commit_for_canary(
            &store,
            update_render,
            863_303,
        )
        .unwrap();
        let handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(
            &mut store,
            update_render,
            Some(pending),
            863_304,
        )
        .unwrap();
        let operations_before_apply = host.operations();

        let error = apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            handoff.commit(),
            &mut update_host_work,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostWorkError::InvalidHostComponentPropertyUpdatePayload {
                root,
                fiber,
                violation,
                ..
            } if root == root_id
                && fiber == updated_component
                && violation
                    == crate::host_work::TestHostComponentPropertyPayloadViolation::ConflictingTextUpdate
        ));
        assert_eq!(host.operations(), operations_before_apply);
    }

    #[test]
    fn root_work_loop_host_update_rejects_cross_root_finished_work_record_before_host_call() {
        let (mut store, root_id, mut host) = root_store();
        let second_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let mut source = TestHostTree::new();
        let initial_element = source.insert_host_element_with_text("section", "cross before");
        update_container(&mut store, root_id, initial_element, None).unwrap();
        let initial_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut initial_host_work =
            mount_test_host_work(&mut store, &mut host, initial_render, &source).unwrap();
        let initial_handoff =
            commit_completed_host_root_render_with_finished_work_handoff_for_canary(
                &mut store,
                initial_render,
                863_401,
                863_402,
            )
            .unwrap();
        apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            initial_handoff.commit(),
            &mut initial_host_work,
        )
        .unwrap();

        let detached_hosts = initial_host_work.into_detached_hosts_for_canary();
        let next_element = source.insert_host_element_with_text("section", "cross after");
        update_container(&mut store, root_id, next_element, None).unwrap();
        let update_render =
            render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let mut update_host_work = update_test_host_root_work_with_detached_hosts_for_canary(
            &mut store,
            update_render,
            &source,
            detached_hosts,
        )
        .unwrap();
        update_container(
            &mut store,
            second_root,
            RootElementHandle::from_raw(863_405),
            None,
        )
        .unwrap();
        let second_render =
            render_host_root_for_lanes(&mut store, second_root, Lanes::DEFAULT).unwrap();
        let wrong_pending = record_host_root_finished_work_pending_commit_for_canary(
            &store,
            second_render,
            863_403,
        )
        .unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_execute = host.operations();

        let error = apply_one_test_host_update_with_finished_work_handoff_for_canary(
            &mut store,
            &mut host,
            update_render,
            Some(wrong_pending),
            863_404,
            update_host_work.detached_hosts_mut_for_canary(),
        )
        .unwrap_err();

        assert!(matches!(
            error,
            TestHostRootHostUpdateExecutionErrorForCanary::FinishedWorkHandoff(error)
                if matches!(
                    error.as_ref(),
                    HostRootFinishedWorkCommitHandoffErrorForCanary::ForeignFinishedWorkRecord {
                        expected_root,
                        actual_root,
                        ..
                    } if *expected_root == root_id && *actual_root == second_root
                )
        ));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(host.operations(), operations_before_execute);
    }

    #[test]
    fn root_work_loop_multichild_host_text_update_executes_with_stable_root_siblings() {
        let (mut store, root_id, mut host) = root_store();
        let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
            &mut store, &mut host, root_id, 878_100,
        );
        let fixture = prepare_root_work_loop_multichild_text_update_fixture(
            &mut store,
            root_id,
            &mut mounted,
            878_110,
        );
        let pending = fixture.pending;
        let render = fixture.render;
        let previous_current = fixture.previous_current;
        let stable_before_work = fixture.stable_before_work;
        let updated_work = fixture.updated_work;
        let stable_after_work = fixture.stable_after_work;
        let stable_before_state_node = fixture.stable_before_state_node;
        let updated_state_node = fixture.updated_state_node;
        let stable_after_state_node = fixture.stable_after_state_node;
        let mounted_root = mounted.complete_work.complete_work().root();
        let mounted_root_element = mounted.root_element;

        let execution = execute_root_work_loop_multichild_text_update(
            &mut store,
            &mut host,
            root_id,
            mounted_root,
            mounted_root_element,
            &mut mounted.host_work,
            fixture,
            pending,
            ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER,
        )
        .unwrap();

        assert_eq!(mounted_root, root_id);
        assert_eq!(render.current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store
                .fiber_arena()
                .child_ids(render.finished_work())
                .unwrap(),
            vec![stable_before_work, updated_work, stable_after_work]
        );
        assert_eq!(
            execution
                .finished_work_handoff
                .pending()
                .root_finished_work(),
            Some(render.finished_work())
        );
        assert!(
            execution
                .finished_work_handoff
                .consumed_finished_work_record()
        );
        assert_root_work_loop_multichild_finished_work_blockers(&execution.finished_work_handoff);
        assert_eq!(
            execution.finished_work_handoff.commit_order(),
            ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER
        );
        assert_eq!(
            execution.finished_work_handoff.commit().previous_current(),
            previous_current
        );
        assert_eq!(
            execution.finished_work_handoff.commit().finished_lanes(),
            Lanes::DEFAULT
        );

        assert_eq!(execution.mutation_apply.records().len(), 1);
        let apply_record = execution.mutation_apply.records()[0];
        assert_eq!(apply_record.mutation().fiber(), updated_work);
        assert_eq!(
            apply_record.mutation().kind(),
            HostRootMutationApplyRecordKind::CommitHostTextUpdate
        );
        assert_eq!(
            apply_record.status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::CommitTextUpdate
            )
        );
        assert_eq!(execution.mutation_apply.applied_host_call_count(), 1);
        assert_eq!(
            mounted
                .host_work
                .test_host_text_record_text_for_canary(updated_state_node)
                .unwrap(),
            "target after 878110"
        );
        assert_eq!(
            mounted
                .host_work
                .test_host_text_record_update_count_for_canary(updated_state_node)
                .unwrap(),
            1
        );
        assert_eq!(
            mounted
                .host_work
                .test_host_text_record_update_count_for_canary(stable_before_state_node)
                .unwrap(),
            0
        );
        assert_eq!(
            mounted
                .host_work
                .test_host_text_record_update_count_for_canary(stable_after_state_node)
                .unwrap(),
            0
        );
        assert!(
            mounted
                .host_work
                .detached_hosts_mut_for_canary()
                .text_metadata(stable_before_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            mounted
                .host_work
                .detached_hosts_mut_for_canary()
                .text_metadata(stable_after_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(store.host_tokens().len(), mounted.token_count_after_mount);

        let mut expected_operations = mounted.operations_after_mount.clone();
        expected_operations.push("commit_text_update");
        assert_eq!(
            execution.operations_before_apply,
            mounted.operations_after_mount
        );
        assert_eq!(host.operations(), expected_operations);

        let operations_after_first_apply = host.operations();
        let replay_error = apply_test_host_root_commit_mutations_for_canary(
            &mut store,
            &mut host,
            execution.finished_work_handoff.commit(),
            &mut mounted.host_work,
        )
        .unwrap_err();
        assert!(matches!(
            replay_error,
            HostWorkError::ConsumedHostUpdatePayload {
                root,
                fiber,
                state_node,
                kind,
            } if root == root_id
                && fiber == updated_work
                && state_node == updated_state_node
                && kind == HostRootMutationApplyRecordKind::CommitHostTextUpdate
        ));
        assert_eq!(host.operations(), operations_after_first_apply);
    }

    #[test]
    fn root_work_loop_multichild_host_text_delete_executes_with_stable_siblings() {
        let (mut store, root_id, mut host) = root_store();
        let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
            &mut store, &mut host, root_id, 878_200,
        );
        let fixture = prepare_root_work_loop_multichild_text_delete_fixture(
            &mut store,
            root_id,
            &mut mounted,
            878_210,
        );
        let pending = fixture.pending;
        let render = fixture.render;
        let previous_current = fixture.previous_current;
        let stable_before_work = fixture.stable_before_work;
        let stable_after_work = fixture.stable_after_work;
        let deleted_current = fixture.deleted_current;
        let deleted_state_node = fixture.deleted_state_node;
        let stable_before_state_node = fixture.stable_before_state_node;
        let stable_after_state_node = fixture.stable_after_state_node;
        let mounted_root = mounted.complete_work.complete_work().root();
        let mounted_root_element = mounted.root_element;

        let execution = execute_root_work_loop_multichild_text_delete(
            &mut store,
            &mut host,
            root_id,
            mounted_root,
            mounted_root_element,
            &mut mounted.host_work,
            fixture,
            pending,
            ROOT_WORK_LOOP_MULTICHILD_DELETE_COMMIT_ORDER,
        )
        .unwrap();

        assert_eq!(render.current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert_eq!(
            store
                .fiber_arena()
                .child_ids(render.finished_work())
                .unwrap(),
            vec![stable_before_work, stable_after_work]
        );
        assert_eq!(
            execution.finished_work_handoff.commit_order(),
            ROOT_WORK_LOOP_MULTICHILD_DELETE_COMMIT_ORDER
        );
        assert!(
            execution
                .finished_work_handoff
                .consumed_finished_work_record()
        );
        assert_root_work_loop_multichild_finished_work_blockers(&execution.finished_work_handoff);
        assert_eq!(
            execution
                .finished_work_handoff
                .commit()
                .deletion_lists()
                .len(),
            1
        );
        assert_eq!(
            execution.finished_work_handoff.commit().deletion_lists()[0].deleted(),
            &[deleted_current]
        );
        assert_eq!(execution.mutation_apply.records().len(), 1);
        let apply_record = execution.mutation_apply.records()[0];
        assert_eq!(apply_record.mutation().fiber(), deleted_current);
        assert_eq!(
            apply_record.mutation().kind(),
            HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
        );
        assert_eq!(
            apply_record.status(),
            TestHostRootMutationApplyStatus::Applied(
                TestHostRootMutationHostCall::RemoveChildFromContainer
            )
        );
        assert_eq!(execution.mutation_apply.applied_host_call_count(), 1);
        assert_eq!(execution.deletion_cleanup.records().len(), 1);
        assert_eq!(execution.deletion_cleanup.invalidated_text_count(), 1);
        assert_eq!(
            execution.deletion_cleanup.records()[0].status(),
            TestHostRootDeletionCleanupStatus::Applied(
                TestHostRootDeletionCleanupAction::InvalidateDeletedText
            )
        );
        assert!(
            !mounted
                .host_work
                .detached_hosts_mut_for_canary()
                .text_metadata(deleted_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            mounted
                .host_work
                .detached_hosts_mut_for_canary()
                .text_metadata(stable_before_state_node)
                .unwrap()
                .is_active()
        );
        assert!(
            mounted
                .host_work
                .detached_hosts_mut_for_canary()
                .text_metadata(stable_after_state_node)
                .unwrap()
                .is_active()
        );
        assert_eq!(
            store.host_tokens().len(),
            mounted.token_count_after_mount + execution.deletion_cleanup.records().len()
        );

        let mut expected_operations = mounted.operations_after_mount.clone();
        expected_operations.push("remove_child_from_container");
        assert_eq!(
            execution.operations_before_apply,
            mounted.operations_after_mount
        );
        assert_eq!(host.operations(), expected_operations);

        let operations_after_delete = host.operations();
        let replay_error = preflight_test_host_root_deletion_apply_and_cleanup_for_canary(
            &store,
            execution.finished_work_handoff.commit(),
            &mounted.host_work,
        )
        .unwrap_err();
        assert!(matches!(
            replay_error,
            HostWorkError::HostNode(error) if error.violation() == HostNodeViolation::Stale
        ));
        assert_eq!(host.operations(), operations_after_delete);
    }

    #[test]
    fn root_work_loop_multichild_host_text_update_rejects_stale_finished_work_before_host_call() {
        let (mut store, root_id, mut host) = root_store();
        let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
            &mut store, &mut host, root_id, 878_300,
        );
        let fixture = prepare_root_work_loop_multichild_text_update_fixture(
            &mut store,
            root_id,
            &mut mounted,
            878_310,
        );
        let render = fixture.render;
        let stale_pending = fixture
            .pending
            .with_previous_current_for_canary(render.finished_work());
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_execute = host.operations();
        let mounted_root = mounted.complete_work.complete_work().root();
        let mounted_root_element = mounted.root_element;

        let error = execute_root_work_loop_multichild_text_update(
            &mut store,
            &mut host,
            root_id,
            mounted_root,
            mounted_root_element,
            &mut mounted.host_work,
            fixture,
            stale_pending,
            ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER + 300,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            RootWorkLoopMultiChildHostMutationExecutionError::FinishedWorkCommitHandoff(error)
                if matches!(
                    error.as_ref(),
                    HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
                        root,
                        finished_work,
                        ..
                    } if *root == root_id && *finished_work == render.finished_work()
                )
        ));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(host.operations(), operations_before_execute);
    }

    #[test]
    fn root_work_loop_multichild_host_text_delete_rejects_stale_finished_work_before_host_call() {
        let (mut store, root_id, mut host) = root_store();
        let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
            &mut store, &mut host, root_id, 878_400,
        );
        let fixture = prepare_root_work_loop_multichild_text_delete_fixture(
            &mut store,
            root_id,
            &mut mounted,
            878_410,
        );
        let render = fixture.render;
        let stale_pending = fixture
            .pending
            .with_previous_current_for_canary(render.finished_work());
        let previous_current = store.root(root_id).unwrap().current();
        let operations_before_execute = host.operations();
        let mounted_root = mounted.complete_work.complete_work().root();
        let mounted_root_element = mounted.root_element;

        let error = execute_root_work_loop_multichild_text_delete(
            &mut store,
            &mut host,
            root_id,
            mounted_root,
            mounted_root_element,
            &mut mounted.host_work,
            fixture,
            stale_pending,
            ROOT_WORK_LOOP_MULTICHILD_DELETE_COMMIT_ORDER + 400,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            RootWorkLoopMultiChildHostMutationExecutionError::FinishedWorkCommitHandoff(error)
                if matches!(
                    error.as_ref(),
                    HostRootFinishedWorkCommitHandoffErrorForCanary::StaleFinishedWorkRecord {
                        root,
                        finished_work,
                        ..
                    } if *root == root_id && *finished_work == render.finished_work()
                )
        ));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(host.operations(), operations_before_execute);
    }

    #[test]
    fn root_work_loop_multichild_host_update_rejects_wrong_sibling_topology_before_host_call() {
        let (mut store, root_id, mut host) = root_store();
        let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
            &mut store, &mut host, root_id, 878_500,
        );
        let fixture = prepare_root_work_loop_multichild_text_update_fixture(
            &mut store,
            root_id,
            &mut mounted,
            878_510,
        );
        let pending = fixture.pending;
        store
            .fiber_arena_mut()
            .set_children(
                fixture.render.finished_work(),
                &[
                    fixture.updated_work,
                    fixture.stable_before_work,
                    fixture.stable_after_work,
                ],
            )
            .unwrap();
        let operations_before_execute = host.operations();
        let mounted_root = mounted.complete_work.complete_work().root();
        let mounted_root_element = mounted.root_element;

        let error = execute_root_work_loop_multichild_text_update(
            &mut store,
            &mut host,
            root_id,
            mounted_root,
            mounted_root_element,
            &mut mounted.host_work,
            fixture,
            pending,
            ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER + 500,
        )
        .unwrap_err();

        assert!(matches!(
            error,
            RootWorkLoopMultiChildHostMutationExecutionError::FinishedChildListMismatch {
                root,
                ..
            } if root == root_id
        ));
        assert_eq!(host.operations(), operations_before_execute);
    }

    #[test]
    fn root_work_loop_multichild_host_update_rejects_cross_root_mount_evidence_before_host_call() {
        let mut store = FiberRootStore::<RecordingHost>::new();
        let first_root = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        let second_root = store
            .create_client_root(FakeContainer::new(2), RootOptions::new())
            .unwrap();
        let mut host = RecordingHost::default();
        let mut mounted = mount_three_text_root_output_for_multichild_host_mutation(
            &mut store, &mut host, first_root, 878_600,
        );
        let fixture = prepare_root_work_loop_multichild_text_update_fixture(
            &mut store,
            first_root,
            &mut mounted,
            878_610,
        );
        let pending = fixture.pending;
        let operations_before_execute = host.operations();
        let mounted_root = mounted.complete_work.complete_work().root();
        let mounted_root_element = mounted.root_element;

        let error = execute_root_work_loop_multichild_text_update(
            &mut store,
            &mut host,
            second_root,
            mounted_root,
            mounted_root_element,
            &mut mounted.host_work,
            fixture,
            pending,
            ROOT_WORK_LOOP_MULTICHILD_UPDATE_COMMIT_ORDER + 600,
        )
        .unwrap_err();

        assert_eq!(
            error,
            RootWorkLoopMultiChildHostMutationExecutionError::MountRootMismatch {
                expected: second_root,
                actual: first_root,
            }
        );
        assert_eq!(host.operations(), operations_before_execute);
    }

    #[test]
    fn root_work_loop_use_reducer_single_host_update_rejects_stale_hook_render_evidence() {
        let mut source = TestHostTree::new();
        let child_element = source.insert_text("stale reducer text update");
        let (mut store, root_id, mut host) = root_store();
        let root_current = store.root(root_id).unwrap().current();
        let (function_current, function_work_in_progress, component) =
            attach_function_component_current_child_with_work_pair(&mut store, root_id);
        let previous_props = PropsHandle::from_raw(9_201);
        let current_child = attach_current_single_host_child(
            &mut store,
            function_current,
            FiberTag::HostText,
            previous_props,
            ElementTypeHandle::NONE,
            StateNodeHandle::NONE,
        );
        let mut detached_hosts = DetachedHostRecords::new_for_canary();
        create_detached_test_host_text_for_existing_fiber_for_canary(
            &mut store,
            &mut host,
            &mut detached_hosts,
            root_id,
            current_child,
            "previous stale reducer text update",
            previous_props,
        )
        .unwrap();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let reducer_id = reducer(1_201);
        let current_reducer = hook_store
            .create_current_reducer_hook(function_current, reducer_id, StateHandle::from_raw(2_100))
            .unwrap();
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);
        let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
        let rescheduled = hook_store
            .dispatch_reducer_update_and_reschedule_root(
                &mut store,
                FunctionComponentReducerDispatchRequest::new(
                    current_reducer.dispatch(),
                    action(13),
                    lane,
                ),
            )
            .unwrap();
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let callback = processed.records()[0].scheduled_callback().unwrap();
        let render = render_host_root_via_scheduler_callback(
            &mut store,
            root_id,
            callback.node(),
            Lanes::DEFAULT,
        )
        .unwrap()
        .render_phase()
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.work_in_progress(), &[function_work_in_progress])
            .unwrap();
        let operations_before = host.operations();

        let error = handoff_completed_function_component_use_reducer_single_host_update_to_commit(
            &mut store,
            &mut host,
            render,
            &source,
            detached_hosts,
            rescheduled,
            &mut hook_store,
            FunctionComponentUseReducerRenderRequest::new(
                reducer_id,
                StateHandle::from_raw(999),
                FunctionComponentStateUpdateRenderLanes::new(Lanes::SYNC, Lanes::SYNC),
            ),
            &mut registry,
            &resolver,
            |_, _| panic!("stale hook render evidence should skip the reducer update"),
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError::HookEvidence(
                FunctionComponentUseReducerAcceptedUpdateEvidenceErrorForCanary::StaleHookQueueRenderEvidence {
                    root,
                    queue,
                    render_lanes,
                    dispatch_lanes,
                    ..
                }
            ) if root == root_id
                && queue == current_reducer.queue()
                && render_lanes == Lanes::DEFAULT
                && dispatch_lanes == Lanes::DEFAULT
        ));
        assert_eq!(store.root(root_id).unwrap().current(), root_current);
        assert_eq!(host.operations(), operations_before);
    }

    #[test]
    fn root_work_loop_use_reducer_single_host_update_rejects_missing_detached_host_payload() {
        let mut source = TestHostTree::new();
        let child_element = source.insert_text("missing payload reducer text update");
        let (mut store, root_id, mut host) = root_store();
        let root_current = store.root(root_id).unwrap().current();
        let (function_current, function_work_in_progress, component) =
            attach_function_component_current_child_with_work_pair(&mut store, root_id);
        let previous_props = PropsHandle::from_raw(9_301);
        let current_child = attach_current_single_host_child(
            &mut store,
            function_current,
            FiberTag::HostText,
            previous_props,
            ElementTypeHandle::NONE,
            StateNodeHandle::NONE,
        );
        let mut source_detached_hosts = DetachedHostRecords::new_for_canary();
        let state_node = create_detached_test_host_text_for_existing_fiber_for_canary(
            &mut store,
            &mut host,
            &mut source_detached_hosts,
            root_id,
            current_child,
            "previous missing payload reducer text update",
            previous_props,
        )
        .unwrap();
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let reducer_id = reducer(1_301);
        let current_reducer = hook_store
            .create_current_reducer_hook(function_current, reducer_id, StateHandle::from_raw(3_100))
            .unwrap();
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);
        let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
        let rescheduled = hook_store
            .dispatch_reducer_update_and_reschedule_root(
                &mut store,
                FunctionComponentReducerDispatchRequest::new(
                    current_reducer.dispatch(),
                    action(14),
                    lane,
                ),
            )
            .unwrap();
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let callback = processed.records()[0].scheduled_callback().unwrap();
        let render = render_host_root_via_scheduler_callback(
            &mut store,
            root_id,
            callback.node(),
            Lanes::DEFAULT,
        )
        .unwrap()
        .render_phase()
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.work_in_progress(), &[function_work_in_progress])
            .unwrap();
        let operations_before = host.operations();

        let error = handoff_completed_function_component_use_reducer_single_host_update_to_commit(
            &mut store,
            &mut host,
            render,
            &source,
            DetachedHostRecords::new_for_canary(),
            rescheduled,
            &mut hook_store,
            FunctionComponentUseReducerRenderRequest::new(
                reducer_id,
                StateHandle::from_raw(999),
                FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT),
            ),
            &mut registry,
            &resolver,
            |state, action| StateHandle::from_raw(state.raw() + action.raw()),
        )
        .unwrap_err();

        assert!(matches!(
            error,
            HostRootFunctionComponentUseReducerSingleHostUpdateCommitHandoffError::HostWork(
                HostWorkError::InvalidDetachedText { handle }
            ) if handle == state_node
        ));
        assert_eq!(store.root(root_id).unwrap().current(), root_current);
        assert_eq!(host.operations(), operations_before);
    }

    #[test]
    fn root_work_loop_use_state_dispatch_renders_function_host_component_and_commits_metadata() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let child_element = source.insert_host_element_with_text("section", "host component state");
        let root_current = store.root(root_id).unwrap().current();
        let (function_current, function_work_in_progress, component) =
            attach_function_component_current_child_with_work_pair(&mut store, root_id);
        let mut hook_store = FunctionComponentHookRenderStore::new();
        let current_state = hook_store
            .create_current_state_hook(function_current, StateHandle::from_raw(710))
            .unwrap();
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);
        let lane = HookUpdateLane::from_lane(Lane::DEFAULT).unwrap();
        hook_store
            .dispatch_state_update_and_reschedule_root(
                &mut store,
                FunctionComponentStateDispatchRequest::new(
                    current_state.dispatch(),
                    action(711),
                    lane,
                ),
            )
            .unwrap();
        let processed = process_root_schedule_in_microtask(&mut store).unwrap();
        let callback = processed.records()[0].scheduled_callback().unwrap();
        let render = render_host_root_via_scheduler_callback(
            &mut store,
            root_id,
            callback.node(),
            Lanes::DEFAULT,
        )
        .unwrap()
        .render_phase()
        .unwrap();
        store
            .fiber_arena_mut()
            .set_children(render.work_in_progress(), &[function_work_in_progress])
            .unwrap();
        let state_request = FunctionComponentUseStateRenderRequest::new(
            StateHandle::from_raw(999),
            FunctionComponentStateUpdateRenderLanes::new(Lanes::DEFAULT, Lanes::DEFAULT),
        );

        let record =
            handoff_completed_function_component_use_state_host_child_to_test_complete_work_and_commit(
                &mut store,
                &mut host,
                render,
                &source,
                &mut hook_store,
                state_request,
                &mut registry,
                &resolver,
                action_as_state,
            )
            .unwrap();

        assert_eq!(record.root(), root_id);
        assert_eq!(record.function_component(), function_work_in_progress);
        assert_eq!(
            record.use_state_begin_work().render().current(),
            Some(function_current)
        );
        assert_eq!(
            record.use_state_begin_work().work_in_progress(),
            function_work_in_progress
        );
        assert_eq!(record.use_state_begin_work().output(), output);
        let state_update = record
            .use_state_begin_work()
            .state_hook()
            .update_record()
            .unwrap();
        assert_eq!(
            state_update.previous_memoized_state(),
            StateHandle::from_raw(710)
        );
        assert_eq!(state_update.memoized_state(), StateHandle::from_raw(711));
        assert_eq!(state_update.applied_update_count(), 1);
        assert_eq!(state_update.remaining_lanes(), Lanes::NO);
        assert_eq!(record.single_child().child_tag(), FiberTag::HostComponent);
        assert_eq!(record.single_child().child_element(), child_element);
        assert_eq!(
            record.complete_work().root_child_tag(),
            Some(FiberTag::FunctionComponent)
        );
        assert_eq!(
            record.complete_work().completed_child_tag(),
            Some(FiberTag::HostComponent)
        );
        assert_eq!(record.complete_work().detached_instance_count(), 1);
        assert_eq!(record.complete_work().detached_text_count(), 1);

        let finished_work_handoff = record.finished_work_handoff();
        assert_eq!(finished_work_handoff.pending().root(), root_id);
        assert_eq!(
            finished_work_handoff.pending().finished_work(),
            render.finished_work()
        );
        assert!(finished_work_handoff.consumed_finished_work_record());
        assert_eq!(record.commit().previous_current(), root_current);
        assert_eq!(record.commit().current(), render.work_in_progress());
        assert_eq!(record.commit().finished_lanes(), Lanes::DEFAULT);
        assert_eq!(record.commit().pending_lanes(), Lanes::NO);
        assert_eq!(record.commit().mutation_log().len(), 1);
        assert_eq!(record.commit().mutation_apply_log().len(), 1);
        assert!(record.host_operations_unchanged_by_commit());
        let completed_child = record.complete_work().completed_child().unwrap();
        assert_single_function_component_container_append(
            record.host_mutation_apply(),
            root_id,
            render.work_in_progress(),
            completed_child,
            FiberTag::HostComponent,
        );
        assert!(record.private_test_host_mutation_executed());
        assert_eq!(
            record.host_operation_count_after_host_mutation(),
            host.operations().len()
        );
        assert!(record.public_render_blocked());

        let diagnostics = record.placement_apply_diagnostics();
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].root(), root_id);
        assert_eq!(diagnostics[0].host_root(), render.finished_work());
        assert_eq!(diagnostics[0].tag(), FiberTag::HostComponent);
        assert_eq!(diagnostics[0].tag_name(), "HostComponent");
        assert_eq!(diagnostics[0].apply_kind(), "append-placement-to-container");
        assert_eq!(diagnostics[0].sibling_status(), "append");
        assert_eq!(diagnostics[0].sibling(), None);
        assert_eq!(diagnostics[0].sibling_tag(), None);
        assert!(!diagnostics[0].can_insert_before());
        assert_eq!(
            store.fiber_arena().get(completed_child).unwrap().tag(),
            FiberTag::HostComponent
        );
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.work_in_progress()
        );
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(registry.calls().len(), 1);
        assert_eq!(
            hook_store
                .state_queues()
                .pending_updates(current_state.queue())
                .unwrap(),
            Vec::<fast_react_core::HookUpdateId>::new()
        );
        assert_eq!(
            host.operations(),
            vec![
                "root_host_context",
                "child_host_context",
                "should_set_text_content",
                "create_text_instance",
                "create_instance",
                "append_initial_child",
                "finalize_initial_children",
                "append_child_to_container",
            ]
        );
    }

    #[test]
    fn root_work_loop_function_component_single_child_handoff_fails_closed_for_unknown_output() {
        let (mut store, root_id, mut host) = root_store();
        let source = TestHostTree::new();
        update_container(&mut store, root_id, RootElementHandle::from_raw(902), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (_current_child, function_component, component) =
            attach_function_component_wip_child(&mut store, render.work_in_progress());
        let output = FunctionComponentOutputHandle::from_raw(404);
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);

        let error = handoff_completed_function_component_single_child_to_test_complete_work(
            &mut store,
            &mut host,
            render,
            &source,
            &mut registry,
            &resolver,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootFunctionComponentSingleChildCompleteWorkHandoffError::BeginWork(
                BeginWorkError::FunctionComponentSingleChild(
                    FunctionComponentSingleChildReconciliationError::UnknownOutput {
                        fiber: function_component,
                        output,
                    },
                ),
            )
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(
            store
                .fiber_arena()
                .get(render.work_in_progress())
                .unwrap()
                .child(),
            Some(function_component)
        );
        assert_eq!(
            store.fiber_arena().get(function_component).unwrap().flags(),
            FiberFlags::NO
        );
    }

    #[test]
    fn root_work_loop_function_component_parent_topology_handoff_fails_closed_for_sibling() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let child_element = source.insert_text("sibling blocked");
        update_container(&mut store, root_id, RootElementHandle::from_raw(903), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (_current_child, function_component, component) =
            attach_function_component_wip_child(&mut store, render.work_in_progress());
        let sibling = store.fiber_arena_mut().create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        store
            .fiber_arena_mut()
            .set_children(render.work_in_progress(), &[function_component, sibling])
            .unwrap();
        let output = FunctionComponentOutputHandle::from_raw(child_element.raw());
        let mut registry = TestFunctionComponentRegistry::default();
        registry.register(component, Ok(output));
        let resolver = TestHostTreeFunctionOutputResolver::new(&source);

        let error = handoff_completed_function_component_single_child_to_test_complete_work(
            &mut store,
            &mut host,
            render,
            &source,
            &mut registry,
            &resolver,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootFunctionComponentSingleChildCompleteWorkHandoffError::UnexpectedFunctionComponentSibling {
                root: root_id,
                host_root_work_in_progress: render.work_in_progress(),
                function_component,
                sibling,
            }
        );
        assert!(registry.calls().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        let function_node = store.fiber_arena().get(function_component).unwrap();
        assert_eq!(
            function_node.return_fiber(),
            Some(render.work_in_progress())
        );
        assert_eq!(function_node.sibling(), Some(sibling));
        assert_eq!(function_node.child(), None);
    }

    #[test]
    fn root_work_loop_function_component_single_child_handoff_rejects_unsupported_outputs() {
        for (index, tag) in [
            FiberTag::Suspense,
            FiberTag::Offscreen,
            FiberTag::Activity,
            FiberTag::ViewTransition,
            FiberTag::Fragment,
            FiberTag::Portal,
        ]
        .into_iter()
        .enumerate()
        {
            let raw = index as u64;
            let (mut store, root_id, mut host) = root_store();
            let source = TestHostTree::new();
            let original_root_element = RootElementHandle::from_raw(930 + raw);
            let current = store.root(root_id).unwrap().current();
            update_container(&mut store, root_id, original_root_element, None).unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let (_current_child, function_component, component) =
                attach_function_component_wip_child(&mut store, render.work_in_progress());
            let output = FunctionComponentOutputHandle::from_raw(960 + raw);
            let mut registry = TestFunctionComponentRegistry::default();
            registry.register(component, Ok(output));
            let resolver =
                StaticSingleChildOutputResolver::new(FunctionComponentSingleChildOutput::new(
                    output,
                    RootElementHandle::from_raw(970 + raw),
                    tag,
                    ElementTypeHandle::from_raw(980 + raw),
                    PropsHandle::from_raw(990 + raw),
                ));

            let error = handoff_completed_function_component_single_child_to_test_complete_work(
                &mut store,
                &mut host,
                render,
                &source,
                &mut registry,
                &resolver,
            )
            .unwrap_err();

            assert_eq!(
                error,
                HostRootFunctionComponentSingleChildCompleteWorkHandoffError::BeginWork(
                    BeginWorkError::FunctionComponentSingleChild(
                        FunctionComponentSingleChildReconciliationError::UnsupportedChildTag {
                            fiber: function_component,
                            output,
                            tag,
                        },
                    ),
                )
            );
            assert_eq!(registry.calls().len(), 1);
            assert_client_root_fail_closed_without_side_effects(
                &store,
                &host,
                root_id,
                current,
                render,
                function_component,
            );
            let function_node = store.fiber_arena().get(function_component).unwrap();
            assert_eq!(function_node.child(), None);
            assert_eq!(function_node.flags(), FiberFlags::NO);
        }
    }

    #[test]
    fn root_work_loop_function_component_complete_handoff_preserves_root_preflight() {
        for (tag, feature) in [
            (FiberTag::Suspense, SUSPENSE_UNSUPPORTED_FEATURE),
            (FiberTag::Offscreen, OFFSCREEN_UNSUPPORTED_FEATURE),
            (FiberTag::Activity, ACTIVITY_UNSUPPORTED_FEATURE),
            (
                FiberTag::ViewTransition,
                VIEW_TRANSITION_UNSUPPORTED_FEATURE,
            ),
            (FiberTag::SuspenseList, SUSPENSE_LIST_UNSUPPORTED_FEATURE),
        ] {
            let (mut store, root_id, mut host) = root_store();
            let source = TestHostTree::new();
            let original_root_element = RootElementHandle::from_raw(1_020);
            let current = store.root(root_id).unwrap().current();
            update_container(&mut store, root_id, original_root_element, None).unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let child = attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag);
            let mut registry = TestFunctionComponentRegistry::default();
            let resolver = TestHostTreeFunctionOutputResolver::new(&source);

            let error = handoff_completed_function_component_single_child_to_test_complete_work(
                &mut store,
                &mut host,
                render,
                &source,
                &mut registry,
                &resolver,
            )
            .unwrap_err();

            match error {
                HostRootFunctionComponentSingleChildCompleteWorkHandoffError::ChildPreflight(
                    error,
                ) => {
                    assert_root_child_preflight_blocks_unsupported_tag(
                        *error,
                        root_id,
                        render.work_in_progress(),
                        child,
                        tag,
                        feature,
                        render.render_lanes(),
                    );
                }
                other => panic!("expected child preflight error, got {other:?}"),
            }
            assert!(registry.calls().is_empty());
            assert_client_root_fail_closed_without_side_effects(
                &store, &host, root_id, current, render, child,
            );
            let child_node = store.fiber_arena().get(child).unwrap();
            assert_eq!(child_node.memoized_props(), PropsHandle::NONE);
            assert_eq!(child_node.flags(), FiberFlags::NO);
        }

        let (mut portal_store, portal_root_id, mut portal_host) = root_store();
        let portal_source = TestHostTree::new();
        let portal_current = portal_store.root(portal_root_id).unwrap().current();
        update_container(
            &mut portal_store,
            portal_root_id,
            RootElementHandle::from_raw(1_021),
            None,
        )
        .unwrap();
        let portal_render =
            render_host_root_for_lanes(&mut portal_store, portal_root_id, Lanes::DEFAULT).unwrap();
        let (portal, portal_child) =
            attach_portal_wip_child(&mut portal_store, portal_render.work_in_progress());
        let mut portal_registry = TestFunctionComponentRegistry::default();
        let portal_resolver = TestHostTreeFunctionOutputResolver::new(&portal_source);

        let portal_error = handoff_completed_function_component_single_child_to_test_complete_work(
            &mut portal_store,
            &mut portal_host,
            portal_render,
            &portal_source,
            &mut portal_registry,
            &portal_resolver,
        )
        .unwrap_err();

        match portal_error {
            HostRootFunctionComponentSingleChildCompleteWorkHandoffError::ChildPreflight(error) => {
                match *error {
                    HostRootChildBeginWorkPreflightError::UnsupportedPortal {
                        root,
                        host_root_work_in_progress,
                        portal: record,
                    } => {
                        assert_eq!(root, portal_root_id);
                        assert_eq!(host_root_work_in_progress, portal_render.work_in_progress());
                        assert_eq!(record.fiber(), portal);
                        assert_eq!(record.child(), Some(portal_child));
                        assert_eq!(record.feature(), PORTAL_RECONCILER_UNSUPPORTED_FEATURE);
                    }
                    other => panic!("expected portal preflight diagnostic, got {other:?}"),
                }
            }
            other => panic!("expected child preflight error, got {other:?}"),
        }
        assert!(portal_registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &portal_store,
            &portal_host,
            portal_root_id,
            portal_current,
            portal_render,
            portal,
        );

        let (mut fragment_store, fragment_root_id, mut fragment_host) = root_store();
        let fragment_source = TestHostTree::new();
        let fragment_current = fragment_store.root(fragment_root_id).unwrap().current();
        update_container(
            &mut fragment_store,
            fragment_root_id,
            RootElementHandle::from_raw(1_022),
            None,
        )
        .unwrap();
        let fragment_render =
            render_host_root_for_lanes(&mut fragment_store, fragment_root_id, Lanes::DEFAULT)
                .unwrap();
        let (fragment, fragment_child) = attach_fragment_wip_child_with_descendant(
            &mut fragment_store,
            fragment_render.work_in_progress(),
        );
        let mut fragment_registry = TestFunctionComponentRegistry::default();
        let fragment_resolver = TestHostTreeFunctionOutputResolver::new(&fragment_source);

        let fragment_error =
            handoff_completed_function_component_single_child_to_test_complete_work(
                &mut fragment_store,
                &mut fragment_host,
                fragment_render,
                &fragment_source,
                &mut fragment_registry,
                &fragment_resolver,
            )
            .unwrap_err();

        assert_eq!(
            fragment_error,
            HostRootFunctionComponentSingleChildCompleteWorkHandoffError::ExpectedFunctionComponentChild {
                root: fragment_root_id,
                host_root_work_in_progress: fragment_render.work_in_progress(),
                child: fragment,
                tag: FiberTag::Fragment,
            }
        );
        assert!(fragment_registry.calls().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &fragment_store,
            &fragment_host,
            fragment_root_id,
            fragment_current,
            fragment_render,
            fragment,
        );
        let fragment_node = fragment_store.fiber_arena().get(fragment).unwrap();
        assert_eq!(fragment_node.memoized_props(), PropsHandle::NONE);
        assert_eq!(fragment_node.child(), Some(fragment_child));
    }

    #[test]
    fn root_work_loop_context_handoff_preserves_unsupported_child_preflight() {
        let cases = [
            (
                FiberTag::Suspense,
                Some(SUSPENSE_UNSUPPORTED_FEATURE),
                Lanes::from(Lane::RETRY_1),
            ),
            (
                FiberTag::Offscreen,
                Some(OFFSCREEN_UNSUPPORTED_FEATURE),
                Lanes::OFFSCREEN,
            ),
            (
                FiberTag::Activity,
                Some(ACTIVITY_UNSUPPORTED_FEATURE),
                Lanes::from(Lane::RETRY_2),
            ),
            (
                FiberTag::ViewTransition,
                Some(VIEW_TRANSITION_UNSUPPORTED_FEATURE),
                Lanes::DEFAULT,
            ),
            (FiberTag::Portal, None, Lanes::DEFAULT),
        ];

        for (index, (tag, feature, render_lanes)) in cases.into_iter().enumerate() {
            let raw = index as u64;
            let (mut store, root_id, host) = root_store();
            let current = store.root(root_id).unwrap().current();
            update_container(
                &mut store,
                root_id,
                RootElementHandle::from_raw(1_100 + raw),
                None,
            )
            .unwrap();
            let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
            let (child, descendant) = match tag {
                FiberTag::Portal => {
                    let (portal, portal_child) =
                        attach_portal_wip_child(&mut store, render.work_in_progress());
                    (portal, Some(portal_child))
                }
                _ => (
                    attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag),
                    None,
                ),
            };
            let context_store = FunctionComponentContextRenderStore::new();
            let registry = TestFunctionComponentRegistry::default();

            match tag {
                FiberTag::Portal => {
                    let error = validate_host_root_child_preflight(
                        &store,
                        root_id,
                        render.work_in_progress(),
                        render_lanes,
                    )
                    .unwrap_err();
                    let portal_record = match error {
                        HostRootChildBeginWorkPreflightError::UnsupportedPortal {
                            root,
                            host_root_work_in_progress,
                            portal,
                        } => {
                            assert_eq!(root, root_id);
                            assert_eq!(host_root_work_in_progress, render.work_in_progress());
                            portal
                        }
                        other => panic!("expected portal preflight diagnostic, got {other:?}"),
                    };
                    assert_eq!(portal_record.fiber(), child);
                    assert_eq!(portal_record.render_lanes(), render_lanes);
                    assert_eq!(
                        portal_record.feature(),
                        PORTAL_RECONCILER_UNSUPPORTED_FEATURE
                    );
                }
                _ => {
                    let error = validate_host_root_child_preflight(
                        &store,
                        root_id,
                        render.work_in_progress(),
                        render_lanes,
                    )
                    .unwrap_err();
                    assert_root_child_preflight_blocks_unsupported_tag(
                        error,
                        root_id,
                        render.work_in_progress(),
                        child,
                        tag,
                        feature.unwrap(),
                        render_lanes,
                    );
                }
            }

            assert!(registry.calls().is_empty());
            assert!(context_store.context_reads().is_empty());
            assert_client_root_fail_closed_without_side_effects(
                &store, &host, root_id, current, render, child,
            );
            if let Some(descendant) = descendant {
                let descendant_node = store.fiber_arena().get(descendant).unwrap();
                assert_eq!(descendant_node.return_fiber(), Some(child));
                assert_eq!(descendant_node.lanes(), Lanes::NO);
                assert_eq!(descendant_node.flags(), FiberFlags::NO);
            }
        }
    }

    #[test]
    fn root_work_loop_complete_work_handoff_requires_completed_render() {
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let element = source.insert_text("blocked");
        update_container(&mut store, root_id, element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .clear_render_phase_work();

        let error = handoff_completed_host_root_render_to_test_complete_work(
            &mut store, &mut host, render, &source,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootCompleteWorkHandoffError::RenderPhaseWorkMismatch {
                root: root_id,
                expected: None,
                actual: render.work_in_progress(),
            }
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(
            store
                .fiber_arena()
                .get(render.work_in_progress())
                .unwrap()
                .child(),
            None
        );
    }

    #[test]
    fn root_work_loop_complete_work_handoff_fails_closed_for_missing_test_source() {
        let (mut store, root_id, mut host) = root_store();
        let source = TestHostTree::new();
        let element = RootElementHandle::from_raw(404);
        update_container(&mut store, root_id, element, None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let error = handoff_completed_host_root_render_to_test_complete_work(
            &mut store, &mut host, render, &source,
        )
        .unwrap_err();

        assert_eq!(
            error,
            HostRootCompleteWorkHandoffError::HostWork(HostWorkError::MissingTestRootElement {
                handle: element,
            })
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(
            store
                .fiber_arena()
                .get(render.work_in_progress())
                .unwrap()
                .child(),
            None
        );
    }

    #[test]
    fn root_work_loop_render_phase_does_not_commit_mutate_host_or_switch_current() {
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(&mut store, root_id, RootElementHandle::from_raw(99), None).unwrap();

        let record = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        assert_eq!(host.operations(), Vec::<&'static str>::new());
        assert_eq!(store.root(root_id).unwrap().current(), current);
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(record.work_in_progress())
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .work_in_progress_root_render_lanes(),
            Lanes::DEFAULT
        );
        assert_eq!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .render_exit_status(),
            RootRenderExitStatus::Completed
        );
    }
}
