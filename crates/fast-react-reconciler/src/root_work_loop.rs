//! Minimal HostRoot render-phase work loop foundation.
//!
//! This module validates scheduled callback identity and processes HostRoot
//! updates into a work-in-progress HostRoot fiber. It deliberately stops before
//! child reconciliation, commit, host mutation, passive effects, sync flushing,
//! or switching `root.current`.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    FiberId, FiberTopologyError, Lanes, PropsHandle, StateHandle, UpdateQueueHandle,
};
use fast_react_host_config::HostTypes;

use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootStateStoreError, RootElementHandle,
    RootRenderExitStatus, RootSchedulerCallbackHandle, UpdateQueueError, WorkInProgressError,
    create_host_root_work_in_progress,
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
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        RootElementHandle, RootOptions, RootTaskScheduleOutcome, ensure_root_is_scheduled,
        process_root_schedule_in_microtask, update_container, update_container_sync,
    };
    use fast_react_core::{Lane, Lanes};

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
