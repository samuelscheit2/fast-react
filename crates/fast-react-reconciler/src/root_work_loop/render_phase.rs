#[cfg(test)]
use std::error::Error;
#[cfg(test)]
use std::fmt::{self, Display, Formatter};

#[cfg(test)]
use fast_react_core::bubble_properties;
#[cfg(test)]
use fast_react_core::{ElementTypeHandle, FiberFlags, FiberTag, FiberTopologyError};
use fast_react_core::{FiberId, Lanes, PropsHandle, StateHandle, UpdateQueueHandle};
use fast_react_host_config::HostTypes;

#[cfg(test)]
use crate::test_support::{TestHostNode, TestHostTree};
use crate::{
    FiberRootId, FiberRootStore, RootElementHandle, RootRenderExitStatus,
    RootSchedulerCallbackHandle, create_host_root_work_in_progress,
};

use super::RootWorkLoopError;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootRenderPhaseRecord {
    pub(super) root: FiberRootId,
    pub(super) current: FiberId,
    pub(super) work_in_progress: FiberId,
    pub(super) current_update_queue: UpdateQueueHandle,
    pub(super) work_in_progress_update_queue: UpdateQueueHandle,
    pub(super) render_lanes: Lanes,
    pub(super) memoized_state: StateHandle,
    pub(super) resulting_element: RootElementHandle,
    pub(super) applied_update_count: usize,
    pub(super) skipped_update_count: usize,
    pub(super) remaining_lanes: Lanes,
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

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct HostRootMountReconciliationRecord {
    render: HostRootRenderPhaseRecord,
    host_root_work_in_progress: FiberId,
    root_element: RootElementHandle,
    root_child: FiberId,
    root_child_tag: FiberTag,
    root_child_element_type: ElementTypeHandle,
    root_child_props: PropsHandle,
    text_child: FiberId,
    text_child_tag: FiberTag,
    text_child_props: PropsHandle,
    render_lanes: Lanes,
    root_child_count: usize,
    component_child_count: usize,
}

#[cfg(test)]
impl HostRootMountReconciliationRecord {
    #[must_use]
    pub(super) const fn render(self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub(super) const fn root(self) -> FiberRootId {
        self.render.root()
    }

    #[must_use]
    pub(super) const fn current(self) -> FiberId {
        self.render.current()
    }

    #[must_use]
    pub(super) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(super) const fn root_element(self) -> RootElementHandle {
        self.root_element
    }

    #[must_use]
    pub(super) const fn root_child(self) -> FiberId {
        self.root_child
    }

    #[must_use]
    pub(super) const fn root_child_tag(self) -> FiberTag {
        self.root_child_tag
    }

    #[must_use]
    pub(super) const fn root_child_element_type(self) -> ElementTypeHandle {
        self.root_child_element_type
    }

    #[must_use]
    pub(super) const fn root_child_props(self) -> PropsHandle {
        self.root_child_props
    }

    #[must_use]
    pub(super) const fn text_child(self) -> FiberId {
        self.text_child
    }

    #[must_use]
    pub(super) const fn text_child_tag(self) -> FiberTag {
        self.text_child_tag
    }

    #[must_use]
    pub(super) const fn text_child_props(self) -> PropsHandle {
        self.text_child_props
    }

    #[must_use]
    pub(super) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(super) const fn root_child_count(self) -> usize {
        self.root_child_count
    }

    #[must_use]
    pub(super) const fn component_child_count(self) -> usize {
        self.component_child_count
    }

    #[must_use]
    pub(super) fn proves_single_host_component_with_text_child(self) -> bool {
        self.root_child_tag == FiberTag::HostComponent
            && self.text_child_tag == FiberTag::HostText
            && self.root_child_count == 1
            && self.component_child_count == 1
            && self.root_element.is_some()
            && self.render.resulting_element() == self.root_element
            && self.render.work_in_progress() == self.host_root_work_in_progress
    }
}

#[cfg(test)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) enum HostRootMountReconciliationError {
    RenderPhase(RootWorkLoopError),
    FiberTopology(FiberTopologyError),
    ExistingCurrentChild {
        root: FiberRootId,
        current: FiberId,
        child: FiberId,
    },
    ExistingWorkInProgressChild {
        root: FiberRootId,
        work_in_progress: FiberId,
        child: FiberId,
    },
    MissingTestRootElement {
        root: FiberRootId,
        element: RootElementHandle,
    },
    ExpectedHostComponentRoot {
        root: FiberRootId,
        element: RootElementHandle,
        tag: FiberTag,
    },
    ExpectedSingleHostTextChild {
        root: FiberRootId,
        element: RootElementHandle,
        child_count: usize,
    },
    ExpectedHostTextChild {
        root: FiberRootId,
        element: RootElementHandle,
        child_index: usize,
        tag: FiberTag,
    },
}

#[cfg(test)]
impl Display for HostRootMountReconciliationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RenderPhase(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ExistingCurrentChild {
                root,
                current,
                child,
            } => write!(
                formatter,
                "root {} current HostRoot fiber {} already has child {}; private HostRoot mount reconciliation only admits an empty current child list",
                root.raw(),
                current.slot().get(),
                child.slot().get()
            ),
            Self::ExistingWorkInProgressChild {
                root,
                work_in_progress,
                child,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} already has child {}; private HostRoot mount reconciliation only admits a fresh child list",
                root.raw(),
                work_in_progress.slot().get(),
                child.slot().get()
            ),
            Self::MissingTestRootElement { root, element } => write!(
                formatter,
                "root {} has no test host element for private HostRoot mount reconciliation handle {}",
                root.raw(),
                element.raw()
            ),
            Self::ExpectedHostComponentRoot { root, element, tag } => write!(
                formatter,
                "root {} element {} must resolve to a HostComponent for private HostRoot mount reconciliation, found {:?}",
                root.raw(),
                element.raw(),
                tag
            ),
            Self::ExpectedSingleHostTextChild {
                root,
                element,
                child_count,
            } => write!(
                formatter,
                "root {} HostComponent element {} must have exactly one HostText child for private HostRoot mount reconciliation, found {child_count}",
                root.raw(),
                element.raw()
            ),
            Self::ExpectedHostTextChild {
                root,
                element,
                child_index,
                tag,
            } => write!(
                formatter,
                "root {} HostComponent element {} child index {child_index} must be HostText for private HostRoot mount reconciliation, found {:?}",
                root.raw(),
                element.raw(),
                tag
            ),
        }
    }
}

#[cfg(test)]
impl Error for HostRootMountReconciliationError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::RenderPhase(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::ExistingCurrentChild { .. }
            | Self::ExistingWorkInProgressChild { .. }
            | Self::MissingTestRootElement { .. }
            | Self::ExpectedHostComponentRoot { .. }
            | Self::ExpectedSingleHostTextChild { .. }
            | Self::ExpectedHostTextChild { .. } => None,
        }
    }
}

#[cfg(test)]
impl From<RootWorkLoopError> for HostRootMountReconciliationError {
    fn from(error: RootWorkLoopError) -> Self {
        Self::RenderPhase(error)
    }
}

#[cfg(test)]
impl From<FiberTopologyError> for HostRootMountReconciliationError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
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

#[cfg(test)]
pub(super) fn render_host_root_for_lanes_with_test_host_mount_reconciliation<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    render_lanes: Lanes,
    source: &TestHostTree,
) -> Result<HostRootMountReconciliationRecord, HostRootMountReconciliationError> {
    let render = render_host_root_for_lanes(store, root_id, render_lanes)?;
    if let Some(child) = store.fiber_arena().get(render.current())?.child() {
        return Err(HostRootMountReconciliationError::ExistingCurrentChild {
            root: root_id,
            current: render.current(),
            child,
        });
    }
    if let Some(child) = store.fiber_arena().get(render.work_in_progress())?.child() {
        return Err(
            HostRootMountReconciliationError::ExistingWorkInProgressChild {
                root: root_id,
                work_in_progress: render.work_in_progress(),
                child,
            },
        );
    }

    let element = render.resulting_element();
    let Some(node) = source.root(element) else {
        return Err(HostRootMountReconciliationError::MissingTestRootElement {
            root: root_id,
            element,
        });
    };
    let TestHostNode::Element(host_element) = node else {
        return Err(
            HostRootMountReconciliationError::ExpectedHostComponentRoot {
                root: root_id,
                element,
                tag: FiberTag::HostText,
            },
        );
    };
    if host_element.children().len() != 1 {
        return Err(
            HostRootMountReconciliationError::ExpectedSingleHostTextChild {
                root: root_id,
                element,
                child_count: host_element.children().len(),
            },
        );
    }
    let TestHostNode::Text(host_text) = &host_element.children()[0] else {
        return Err(HostRootMountReconciliationError::ExpectedHostTextChild {
            root: root_id,
            element,
            child_index: 0,
            tag: FiberTag::HostComponent,
        });
    };

    let mode = store.fiber_arena().get(render.work_in_progress())?.mode();
    let component = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        host_element.props(),
        mode,
    );
    let text =
        store
            .fiber_arena_mut()
            .create_fiber(FiberTag::HostText, None, host_text.props(), mode);
    {
        let component_node = store.fiber_arena_mut().get_mut(component)?;
        component_node.set_element_type(host_element.element_type());
        component_node.set_lanes(render_lanes);
        component_node.merge_flags(FiberFlags::PLACEMENT);
    }
    {
        let text_node = store.fiber_arena_mut().get_mut(text)?;
        text_node.set_lanes(render_lanes);
    }

    store.fiber_arena_mut().set_children(component, &[text])?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[component])?;
    let bubbled = bubble_properties(store.fiber_arena(), render.work_in_progress())?;
    {
        let host_root = store.fiber_arena_mut().get_mut(render.work_in_progress())?;
        host_root.set_child_lanes(bubbled.child_lanes());
        host_root.set_subtree_flags(bubbled.subtree_flags());
    }

    Ok(HostRootMountReconciliationRecord {
        render,
        host_root_work_in_progress: render.work_in_progress(),
        root_element: element,
        root_child: component,
        root_child_tag: FiberTag::HostComponent,
        root_child_element_type: host_element.element_type(),
        root_child_props: host_element.props(),
        text_child: text,
        text_child_tag: FiberTag::HostText,
        text_child_props: host_text.props(),
        render_lanes,
        root_child_count: 1,
        component_child_count: 1,
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
