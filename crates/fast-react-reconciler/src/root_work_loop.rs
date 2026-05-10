//! Minimal HostRoot render-phase work loop foundation.
//!
//! This module validates scheduled callback identity and processes HostRoot
//! updates into a work-in-progress HostRoot fiber. It deliberately stops before
//! child reconciliation, commit, host mutation, passive effects, sync flushing,
//! or switching `root.current`.

#![cfg_attr(
    not(test),
    allow(
        dead_code,
        reason = "private HostRoot child begin-work preflight is reserved until a real fiber traversal consumes it"
    )
)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextHandle, ContextValueHandle, FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle,
    StateHandle, UpdateQueueHandle,
};
use fast_react_host_config::HostTypes;

use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootStateStoreError, RootElementHandle,
    RootRenderExitStatus, RootSchedulerCallbackHandle, UpdateQueueError, WorkInProgressError,
    begin_work::{
        BeginWorkError, BeginWorkRequest, BeginWorkResult, NestedContextProviderBeginWorkError,
        NestedContextProviderBeginWorkRecord, NestedContextProviderBeginWorkRequest,
        NestedContextProviderUseContextBeginWorkRecord, UnsupportedPortalBeginWorkRecord,
        begin_work, begin_work_nested_context_provider_child,
        begin_work_nested_context_provider_use_context_child, unsupported_portal_begin_work_record,
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
    begin_work::{
        ContextProviderBeginWorkError, ContextProviderBeginWorkRecord,
        ContextProviderBeginWorkRequest, FunctionComponentSingleChildBeginWorkRecord,
        begin_work_context_provider_child, begin_work_reconcile_function_component_single_child,
    },
    function_component::FunctionComponentSingleChildOutputResolver,
    host_work::{
        HostWorkError, HostWorkResult, mount_test_function_component_single_host_child_work,
        mount_test_host_sibling_work, mount_test_host_work,
    },
    test_support::{RecordingHost, TestHostTree},
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
            | Self::UnsupportedPortal { .. } => None,
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
    use crate::function_component::{
        FunctionComponentContextReadRecord, FunctionComponentContextRenderReader,
        FunctionComponentContextRenderStore, FunctionComponentInvocationError,
        FunctionComponentInvocationRequest, FunctionComponentOutputHandle,
        FunctionComponentRenderError, FunctionComponentSingleChildOutput,
        FunctionComponentSingleChildOutputResolver,
        FunctionComponentSingleChildReconciliationError,
    };
    use crate::test_support::{FakeContainer, RecordingHost, TestHostNode, TestHostTree};
    use crate::unsupported_features::{
        ACTIVITY_UNSUPPORTED_FEATURE, OFFSCREEN_UNSUPPORTED_FEATURE,
        SUSPENSE_LIST_UNSUPPORTED_FEATURE, SUSPENSE_UNSUPPORTED_FEATURE,
        VIEW_TRANSITION_UNSUPPORTED_FEATURE,
    };
    use crate::{
        HostRootHydrationState, PendingChildrenHandle, PendingCommitHandle, RootContextHandle,
        RootElementHandle, RootHydrationCallbacksHandle, RootKind, RootOptions,
        RootSchedulerCallbackExecutionStatus, RootSuspenseBoundarySetHandle,
        RootTaskScheduleOutcome, RootTransitionCallbacksHandle, SchedulerCallbackRequest,
        ensure_root_is_scheduled, execute_scheduled_root_callback,
        process_root_schedule_in_microtask, update_container, update_container_sync,
    };
    use fast_react_core::{
        ContextHandle, ContextValueHandle, ElementTypeHandle, FiberFlags, FiberMode, FiberTag,
        FiberTypeHandle, Lane, Lanes, PropsHandle, ReactKey, RootFinishedLanes, StateHandle,
        StateNodeHandle, UpdateQueueHandle,
    };

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

    #[derive(Debug)]
    struct TestUseContextComponentRegistry {
        component: FiberTypeHandle,
        behavior: UseContextBehavior,
        calls: Vec<FunctionComponentInvocationRequest>,
        reads: Vec<FunctionComponentContextReadRecord>,
    }

    impl TestUseContextComponentRegistry {
        fn new(component: FiberTypeHandle, behavior: UseContextBehavior) -> Self {
            Self {
                component,
                behavior,
                calls: Vec::new(),
                reads: Vec::new(),
            }
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
            if request.component() != self.component {
                return Err(FunctionComponentRenderError::Invocation {
                    fiber: request.fiber(),
                    component: request.component(),
                    error: FunctionComponentInvocationError::component_error(
                        "missing use_context test component registration",
                    ),
                });
            }

            match self.behavior {
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

            assert_eq!(
                error,
                HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                    fiber: child,
                    tag,
                    feature,
                }
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
    fn root_work_loop_pinged_retry_scheduler_handoff_keeps_suspense_offscreen_fail_closed() {
        for (tag, feature) in [
            (FiberTag::Suspense, SUSPENSE_UNSUPPORTED_FEATURE),
            (FiberTag::Offscreen, OFFSCREEN_UNSUPPORTED_FEATURE),
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
            assert_eq!(
                error,
                HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                    fiber: child,
                    tag,
                    feature,
                }
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

            assert_eq!(
                error,
                HostRootCompleteWorkHandoffError::ChildPreflight(Box::new(
                    HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                        fiber: child,
                        tag,
                        feature,
                    },
                ))
            );
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
        assert_eq!(root_node.child_lanes(), Lanes::DEFAULT);
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
        assert_eq!(root_node.child_lanes(), Lanes::DEFAULT);

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
                FiberTag::Suspense => assert_eq!(
                    error,
                    HostRootCompleteWorkHandoffError::ChildPreflight(Box::new(
                        HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                            fiber: blocked_child,
                            tag: FiberTag::Suspense,
                            feature: SUSPENSE_UNSUPPORTED_FEATURE,
                        },
                    )),
                ),
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

            assert_eq!(
                error,
                HostRootFunctionComponentSingleChildCompleteWorkHandoffError::ChildPreflight(
                    Box::new(
                        HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                            fiber: child,
                            tag,
                            feature,
                        },
                    ),
                )
            );
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
                    assert_eq!(
                        error,
                        HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                            fiber: child,
                            tag,
                            feature: feature.unwrap(),
                        }
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
