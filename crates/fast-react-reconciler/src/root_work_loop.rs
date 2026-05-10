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
    FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle, StateHandle, UpdateQueueHandle,
};
use fast_react_host_config::HostTypes;

use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootStateStoreError, RootElementHandle,
    RootRenderExitStatus, RootSchedulerCallbackHandle, UpdateQueueError, WorkInProgressError,
    begin_work::{BeginWorkError, BeginWorkRequest, BeginWorkResult, begin_work},
    create_host_root_work_in_progress,
    function_component::FunctionComponentInvoker,
    unsupported_features::unsupported_reconciler_feature_for_fiber_tag,
};
#[cfg(test)]
use crate::{
    begin_work::{
        FunctionComponentSingleChildBeginWorkRecord,
        begin_work_reconcile_function_component_single_child,
    },
    function_component::FunctionComponentSingleChildOutputResolver,
    host_work::{HostWorkError, mount_test_host_work},
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
            | Self::UnsupportedReconcilerFiberFeature { .. } => None,
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
    let validated = validate_host_root_child_preflight(store, root_id, host_root_work_in_progress)?;
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
    HostWork(HostWorkError),
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
}

#[cfg(test)]
impl Display for HostRootCompleteWorkHandoffError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::HostWork(error) => Display::fmt(error, formatter),
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
        }
    }
}

#[cfg(test)]
impl Error for HostRootCompleteWorkHandoffError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::HostWork(error) => Some(error),
            Self::RenderPhaseWorkMismatch { .. }
            | Self::RenderPhaseLanesMismatch { .. }
            | Self::RenderPhaseNotCompleted { .. } => None,
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

    let host_work = mount_test_host_work(store, host, render, source)?;
    let root_child = host_work.root_child();
    let root_child_tag = root_child
        .map(|fiber| store.fiber_arena().get(fiber).map(|node| node.tag()))
        .transpose()?;

    Ok(HostRootCompleteWorkHandoffRecord {
        root: host_work.root(),
        host_root_work_in_progress: host_work.work_in_progress(),
        root_child,
        root_child_tag,
        render_lanes: render.render_lanes(),
        resulting_element: render.resulting_element(),
        detached_instance_count: host_work.detached_instance_count(),
        detached_text_count: host_work.detached_text_count(),
    })
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
    ChildPreflight(HostRootChildBeginWorkPreflightError),
    BeginWork(BeginWorkError),
    CompleteWork(HostRootCompleteWorkHandoffError),
    MissingFunctionComponentChild {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
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
            Self::ChildPreflight(error) => Some(error),
            Self::BeginWork(error) => Some(error),
            Self::CompleteWork(error) => Some(error),
            Self::MissingFunctionComponentChild { .. } | Self::CompletedChildTagMismatch { .. } => {
                None
            }
        }
    }
}

#[cfg(test)]
impl From<HostRootChildBeginWorkPreflightError>
    for HostRootFunctionComponentSingleChildCompleteWorkHandoffError
{
    fn from(error: HostRootChildBeginWorkPreflightError) -> Self {
        Self::ChildPreflight(error)
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
    let validated =
        validate_host_root_child_preflight(store, render.root(), render.work_in_progress())?;
    let function_component = validated.child.ok_or(
        HostRootFunctionComponentSingleChildCompleteWorkHandoffError::MissingFunctionComponentChild {
            root: render.root(),
            host_root_work_in_progress: render.work_in_progress(),
        },
    )?;
    let begin_work = begin_work_reconcile_function_component_single_child(
        store.fiber_arena_mut(),
        BeginWorkRequest::new(function_component, render.render_lanes()),
        invoker,
        resolver,
    )?;
    let child_element = begin_work.single_child().child_element();
    let child_tag = begin_work.single_child().child_tag();
    let child_render = HostRootRenderPhaseRecord {
        resulting_element: child_element,
        ..render
    };
    let complete_work = handoff_completed_host_root_render_to_test_complete_work(
        store,
        host,
        child_render,
        source,
    )?;
    if complete_work.root_child_tag() != Some(child_tag) {
        return Err(
            HostRootFunctionComponentSingleChildCompleteWorkHandoffError::CompletedChildTagMismatch {
                expected: child_tag,
                actual: complete_work.root_child_tag(),
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
    use crate::begin_work::BeginWorkError;
    use crate::function_component::{
        FunctionComponentInvocationError, FunctionComponentInvocationRequest,
        FunctionComponentOutputHandle, FunctionComponentSingleChildOutput,
        FunctionComponentSingleChildOutputResolver,
        FunctionComponentSingleChildReconciliationError,
    };
    use crate::test_support::{FakeContainer, RecordingHost, TestHostNode, TestHostTree};
    use crate::unsupported_features::{
        ACTIVITY_UNSUPPORTED_FEATURE, OFFSCREEN_UNSUPPORTED_FEATURE,
        SUSPENSE_LIST_UNSUPPORTED_FEATURE, SUSPENSE_UNSUPPORTED_FEATURE,
    };
    use crate::{
        RootElementHandle, RootOptions, RootTaskScheduleOutcome, ensure_root_is_scheduled,
        process_root_schedule_in_microtask, update_container, update_container_sync,
    };
    use fast_react_core::{
        FiberFlags, FiberMode, FiberTag, FiberTypeHandle, Lane, Lanes, PropsHandle, StateHandle,
        UpdateQueueHandle,
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
            assert_eq!(host.operations(), Vec::<&'static str>::new());
            assert_eq!(store.root(root_id).unwrap().current(), current);
            assert_eq!(store.root(root_id).unwrap().finished_work(), None);
            assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        }
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
            Some(FiberTag::HostComponent)
        );
        assert_eq!(record.complete_work().detached_instance_count(), 1);
        assert_eq!(record.complete_work().detached_text_count(), 1);

        let root_node = store.fiber_arena().get(render.work_in_progress()).unwrap();
        let host_child = record.complete_work().root_child().unwrap();
        assert_eq!(root_node.child(), Some(host_child));
        assert_eq!(
            store.fiber_arena().get(host_child).unwrap().tag(),
            FiberTag::HostComponent
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .return_fiber(),
            None
        );
        assert!(
            store
                .fiber_arena()
                .get(function_component)
                .unwrap()
                .flags()
                .contains_all(FiberFlags::PERFORMED_WORK)
        );
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
            Some(FiberTag::HostText)
        );
        assert_eq!(record.complete_work().detached_instance_count(), 0);
        assert_eq!(record.complete_work().detached_text_count(), 1);
        let host_child = record.complete_work().root_child().unwrap();
        let host_child_node = store.fiber_arena().get(host_child).unwrap();
        assert_eq!(host_child_node.tag(), FiberTag::HostText);
        assert!(host_child_node.state_node().is_some());
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
