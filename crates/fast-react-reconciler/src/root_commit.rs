//! Minimal HostRoot current-switch commit foundation.
//!
//! This module consumes a completed HostRoot render-phase record and switches
//! `root.current` to that HostRoot work-in-progress fiber. It deliberately
//! stops before host mutation, child/effect traversal, callback execution,
//! deletion cleanup, public facade behavior, DOM wiring, or test-renderer
//! serialization.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    DeletionListId, FiberFlags, FiberId, FiberTag, FiberTopologyError, Lanes, RootFinishedLanes,
    StateHandle, StateNodeHandle, UpdateQueueHandle,
};
use fast_react_host_config::HostTypes;

use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError, HostRootRenderPhaseRecord,
    HostRootStateStoreError, RootRenderExitStatus, RootSchedulingState, RootUpdateCallbackSnapshot,
    UpdateQueueError,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RootCommitError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    HostRootStateStore(HostRootStateStoreError),
    UpdateQueue(UpdateQueueError),
    PendingPassiveRootMismatch {
        root: FiberRootId,
        pending_root: FiberRootId,
    },
    EmptyFinishedLanes {
        root: FiberRootId,
    },
    CurrentMismatch {
        root: FiberRootId,
        expected: FiberId,
        actual: FiberId,
    },
    FinishedWorkIsCurrent {
        root: FiberRootId,
        current: FiberId,
    },
    ExpectedHostRoot {
        root: FiberRootId,
        fiber: FiberId,
        tag: FiberTag,
    },
    HostRootStateNodeMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected: StateNodeHandle,
        actual: StateNodeHandle,
    },
    FinishedWorkNotAlternate {
        root: FiberRootId,
        current: FiberId,
        finished_work: FiberId,
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
    MemoizedStateMismatch {
        root: FiberRootId,
        expected: StateHandle,
        actual: StateHandle,
    },
    UpdateQueueMismatch {
        root: FiberRootId,
        expected: UpdateQueueHandle,
        actual: UpdateQueueHandle,
    },
    RemainingLanesMismatch {
        root: FiberRootId,
        expected: Lanes,
        actual: Lanes,
    },
}

impl Display for RootCommitError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::HostRootStateStore(error) => Display::fmt(error, formatter),
            Self::UpdateQueue(error) => Display::fmt(error, formatter),
            Self::PendingPassiveRootMismatch { root, pending_root } => write!(
                formatter,
                "root {} pending passive metadata belongs to root {}",
                root.raw(),
                pending_root.raw()
            ),
            Self::EmptyFinishedLanes { root } => {
                write!(formatter, "root {} commit lanes are empty", root.raw())
            }
            Self::CurrentMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} current fiber slot {} does not match render record current fiber slot {}",
                root.raw(),
                actual.slot().get(),
                expected.slot().get()
            ),
            Self::FinishedWorkIsCurrent { root, current } => write!(
                formatter,
                "root {} cannot commit current fiber slot {} as finished work",
                root.raw(),
                current.slot().get()
            ),
            Self::ExpectedHostRoot { root, fiber, tag } => write!(
                formatter,
                "root {} finished commit fiber slot {} must be HostRoot, found {:?}",
                root.raw(),
                fiber.slot().get(),
                tag
            ),
            Self::HostRootStateNodeMismatch {
                root,
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} HostRoot fiber slot {} state node {} does not match expected root state node {}",
                root.raw(),
                fiber.slot().get(),
                actual.raw(),
                expected.raw()
            ),
            Self::FinishedWorkNotAlternate {
                root,
                current,
                finished_work,
            } => write!(
                formatter,
                "root {} finished work fiber slot {} is not the alternate of current fiber slot {}",
                root.raw(),
                finished_work.slot().get(),
                current.slot().get()
            ),
            Self::RenderPhaseWorkMismatch {
                root,
                expected,
                actual,
            } => {
                if let Some(expected) = expected {
                    write!(
                        formatter,
                        "root {} render phase recorded work fiber slot {}, commit requested fiber slot {}",
                        root.raw(),
                        expected.slot().get(),
                        actual.slot().get()
                    )
                } else {
                    write!(
                        formatter,
                        "root {} has no recorded render phase work for commit requested fiber slot {}",
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
                "root {} render phase lanes {:?} do not match commit lanes {:?}",
                root.raw(),
                expected,
                actual
            ),
            Self::RenderPhaseNotCompleted { root, status } => write!(
                formatter,
                "root {} render phase must be completed before commit, found {:?}",
                root.raw(),
                status
            ),
            Self::MemoizedStateMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} finished HostRoot memoized state {} does not match render record state {}",
                root.raw(),
                actual.raw(),
                expected.raw()
            ),
            Self::UpdateQueueMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} finished HostRoot update queue {} does not match render record queue {}",
                root.raw(),
                actual.raw(),
                expected.raw()
            ),
            Self::RemainingLanesMismatch {
                root,
                expected,
                actual,
            } => write!(
                formatter,
                "root {} finished HostRoot remaining lanes {:?} do not match render record remaining lanes {:?}",
                root.raw(),
                actual,
                expected
            ),
        }
    }
}

impl Error for RootCommitError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::HostRootStateStore(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::PendingPassiveRootMismatch { .. }
            | Self::EmptyFinishedLanes { .. }
            | Self::CurrentMismatch { .. }
            | Self::FinishedWorkIsCurrent { .. }
            | Self::ExpectedHostRoot { .. }
            | Self::HostRootStateNodeMismatch { .. }
            | Self::FinishedWorkNotAlternate { .. }
            | Self::RenderPhaseWorkMismatch { .. }
            | Self::RenderPhaseLanesMismatch { .. }
            | Self::RenderPhaseNotCompleted { .. }
            | Self::MemoizedStateMismatch { .. }
            | Self::UpdateQueueMismatch { .. }
            | Self::RemainingLanesMismatch { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for RootCommitError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for RootCommitError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostRootStateStoreError> for RootCommitError {
    fn from(error: HostRootStateStoreError) -> Self {
        Self::HostRootStateStore(error)
    }
}

impl From<UpdateQueueError> for RootCommitError {
    fn from(error: UpdateQueueError) -> Self {
        Self::UpdateQueue(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct PendingPassiveCommitHandoff {
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
}

#[allow(
    dead_code,
    reason = "crate-private passive commit metadata for future passive-effect workers"
)]
impl PendingPassiveCommitHandoff {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn finished_work(self) -> FiberId {
        self.finished_work
    }

    #[must_use]
    pub(crate) const fn lanes(self) -> Lanes {
        self.lanes
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootDeletionListRecord {
    parent: FiberId,
    list: DeletionListId,
    deleted: Vec<FiberId>,
}

#[allow(
    dead_code,
    reason = "crate-private deletion metadata for future mutation/passive deletion workers"
)]
impl HostRootDeletionListRecord {
    #[must_use]
    pub(crate) const fn parent(&self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub(crate) const fn list(&self) -> DeletionListId {
        self.list
    }

    #[must_use]
    pub(crate) fn deleted(&self) -> &[FiberId] {
        &self.deleted
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostRootCommitRecord {
    root: FiberRootId,
    previous_current: FiberId,
    current: FiberId,
    finished_lanes: Lanes,
    remaining_lanes: Lanes,
    pending_lanes: Lanes,
    root_update_callbacks: RootUpdateCallbackSnapshot,
    pending_passive_handoff: Option<PendingPassiveCommitHandoff>,
    deletion_lists: Vec<HostRootDeletionListRecord>,
}

impl HostRootCommitRecord {
    #[must_use]
    pub const fn root(&self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn previous_current(&self) -> FiberId {
        self.previous_current
    }

    #[must_use]
    pub const fn current(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn finished_work(&self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[must_use]
    pub const fn remaining_lanes(&self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn pending_lanes(&self) -> Lanes {
        self.pending_lanes
    }

    #[must_use]
    pub const fn has_remaining_work(&self) -> bool {
        self.pending_lanes.is_non_empty()
    }

    #[must_use]
    pub fn root_update_callbacks(&self) -> &RootUpdateCallbackSnapshot {
        &self.root_update_callbacks
    }

    #[allow(
        dead_code,
        reason = "crate-private passive commit metadata for future passive-effect workers"
    )]
    #[must_use]
    pub(crate) const fn pending_passive_handoff(&self) -> Option<PendingPassiveCommitHandoff> {
        self.pending_passive_handoff
    }

    #[allow(
        dead_code,
        reason = "crate-private deletion metadata for future mutation/passive deletion workers"
    )]
    #[must_use]
    pub(crate) fn deletion_lists(&self) -> &[HostRootDeletionListRecord] {
        &self.deletion_lists
    }
}

pub fn commit_finished_host_root<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<HostRootCommitRecord, RootCommitError> {
    validate_finished_host_root(store, render)?;

    let root_id = render.root();
    let previous_current = render.current();
    let finished_work = render.finished_work();
    let finished_lanes = render.render_lanes();
    let remaining_lanes = render.remaining_lanes();
    let work_in_progress_update_queue = render.work_in_progress_update_queue();
    let deletion_lists = collect_deletion_list_metadata(store, finished_work)?;

    let (pending_lanes, pending_passive_handoff) = {
        let root = store.root_mut(root_id)?;
        let pending_passive_handoff = record_pending_passive_commit_handoff(
            root.scheduling_mut(),
            root_id,
            finished_work,
            finished_lanes,
        )?;
        root.lanes_mut()
            .mark_finished(RootFinishedLanes::new(finished_lanes, remaining_lanes));
        root.set_current(finished_work);
        root.clear_finished_work();
        root.scheduling_mut().clear_render_phase_work();
        root.scheduling_mut().clear_callback();
        (root.lanes().pending_lanes(), pending_passive_handoff)
    };
    let root_update_callbacks = store
        .update_queues_mut()
        .take_root_update_callback_records(work_in_progress_update_queue)?;

    Ok(HostRootCommitRecord {
        root: root_id,
        previous_current,
        current: finished_work,
        finished_lanes,
        remaining_lanes,
        pending_lanes,
        root_update_callbacks,
        pending_passive_handoff,
        deletion_lists,
    })
}

fn collect_deletion_list_metadata<H: HostTypes>(
    store: &FiberRootStore<H>,
    finished_work: FiberId,
) -> Result<Vec<HostRootDeletionListRecord>, RootCommitError> {
    let arena = store.fiber_arena();
    let mut records = Vec::new();
    let mut stack = vec![finished_work];

    while let Some(parent) = stack.pop() {
        let node = arena.get(parent)?;
        let deletion_list = node.deletions();
        let flags = node.flags();
        let child_ids = arena.child_ids(parent)?;

        if let Some(list_id) = deletion_list {
            let list = arena
                .deletion_list(list_id)
                .ok_or(FiberTopologyError::InvalidDeletionList { id: list_id })?;
            if list.parent() != parent {
                return Err(FiberTopologyError::InvalidDeletionList { id: list_id }.into());
            }
            if !list.is_empty() && !flags.contains_all(FiberFlags::CHILD_DELETION) {
                return Err(FiberTopologyError::DeletionListMissingFlag {
                    parent,
                    list: list_id,
                }
                .into());
            }

            let mut deleted = Vec::with_capacity(list.len());
            for &deleted_fiber in list {
                arena.get(deleted_fiber)?;
                if child_ids.contains(&deleted_fiber) {
                    return Err(FiberTopologyError::DeletedChildStillInFinishedChain {
                        parent,
                        deleted: deleted_fiber,
                    }
                    .into());
                }
                deleted.push(deleted_fiber);
            }

            if !deleted.is_empty() {
                records.push(HostRootDeletionListRecord {
                    parent,
                    list: list_id,
                    deleted,
                });
            }
        }

        stack.extend(child_ids.into_iter().rev());
    }

    Ok(records)
}

fn record_pending_passive_commit_handoff<H: HostTypes>(
    scheduling: &mut RootSchedulingState<H>,
    root: FiberRootId,
    finished_work: FiberId,
    lanes: Lanes,
) -> Result<Option<PendingPassiveCommitHandoff>, RootCommitError> {
    let Some(pending_root) = scheduling.pending_passive().root() else {
        return Ok(None);
    };

    if pending_root != root {
        return Err(RootCommitError::PendingPassiveRootMismatch { root, pending_root });
    }

    if !scheduling
        .pending_passive_mut()
        .record_commit_handoff(root, finished_work, lanes)
    {
        return Err(RootCommitError::EmptyFinishedLanes { root });
    }

    Ok(Some(PendingPassiveCommitHandoff {
        root,
        finished_work,
        lanes,
    }))
}

fn validate_finished_host_root<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
) -> Result<(), RootCommitError> {
    let root_id = render.root();
    let root = store.root(root_id)?;
    let current = root.current();
    let finished_work = render.finished_work();
    let finished_lanes = render.render_lanes();

    if finished_lanes.is_empty() {
        return Err(RootCommitError::EmptyFinishedLanes { root: root_id });
    }

    if current != render.current() {
        return Err(RootCommitError::CurrentMismatch {
            root: root_id,
            expected: render.current(),
            actual: current,
        });
    }

    if finished_work == current {
        return Err(RootCommitError::FinishedWorkIsCurrent {
            root: root_id,
            current,
        });
    }

    let scheduling = root.scheduling();
    if scheduling.work_in_progress() != Some(finished_work) {
        return Err(RootCommitError::RenderPhaseWorkMismatch {
            root: root_id,
            expected: scheduling.work_in_progress(),
            actual: finished_work,
        });
    }
    if scheduling.work_in_progress_root_render_lanes() != finished_lanes {
        return Err(RootCommitError::RenderPhaseLanesMismatch {
            root: root_id,
            expected: scheduling.work_in_progress_root_render_lanes(),
            actual: finished_lanes,
        });
    }
    if scheduling.render_exit_status() != RootRenderExitStatus::Completed {
        return Err(RootCommitError::RenderPhaseNotCompleted {
            root: root_id,
            status: scheduling.render_exit_status(),
        });
    }

    let arena = store.fiber_arena();
    let current_node = arena.get(current)?;
    let finished_node = arena.get(finished_work)?;

    if current_node.tag() != FiberTag::HostRoot {
        return Err(RootCommitError::ExpectedHostRoot {
            root: root_id,
            fiber: current,
            tag: current_node.tag(),
        });
    }
    if finished_node.tag() != FiberTag::HostRoot {
        return Err(RootCommitError::ExpectedHostRoot {
            root: root_id,
            fiber: finished_work,
            tag: finished_node.tag(),
        });
    }

    let expected_state_node = root_id.state_node_handle();
    if current_node.state_node() != expected_state_node {
        return Err(RootCommitError::HostRootStateNodeMismatch {
            root: root_id,
            fiber: current,
            expected: expected_state_node,
            actual: current_node.state_node(),
        });
    }
    if finished_node.state_node() != expected_state_node {
        return Err(RootCommitError::HostRootStateNodeMismatch {
            root: root_id,
            fiber: finished_work,
            expected: expected_state_node,
            actual: finished_node.state_node(),
        });
    }

    let is_alternate_pair = current_node.alternate() == Some(finished_work)
        && finished_node.alternate() == Some(current);
    if !is_alternate_pair {
        return Err(RootCommitError::FinishedWorkNotAlternate {
            root: root_id,
            current,
            finished_work,
        });
    }
    arena.validate_alternate_pair(current, finished_work)?;

    if finished_node.memoized_state() != render.memoized_state() {
        return Err(RootCommitError::MemoizedStateMismatch {
            root: root_id,
            expected: render.memoized_state(),
            actual: finished_node.memoized_state(),
        });
    }
    store
        .host_root_states()
        .get(finished_node.memoized_state())?;

    if current_node.update_queue() != render.current_update_queue() {
        return Err(RootCommitError::UpdateQueueMismatch {
            root: root_id,
            expected: render.current_update_queue(),
            actual: current_node.update_queue(),
        });
    }
    if finished_node.update_queue() != render.work_in_progress_update_queue() {
        return Err(RootCommitError::UpdateQueueMismatch {
            root: root_id,
            expected: render.work_in_progress_update_queue(),
            actual: finished_node.update_queue(),
        });
    }
    store.update_queues().queue(render.current_update_queue())?;
    store
        .update_queues()
        .queue(render.work_in_progress_update_queue())?;

    let actual_remaining_lanes = finished_node.lanes().merge(finished_node.child_lanes());
    if actual_remaining_lanes != render.remaining_lanes() {
        return Err(RootCommitError::RemainingLanesMismatch {
            root: root_id,
            expected: render.remaining_lanes(),
            actual: actual_remaining_lanes,
        });
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::{FakeContainer, RecordingHost};
    use crate::{
        RootElementHandle, RootOptions, RootTaskScheduleOutcome, RootUpdateCallbackHandle,
        RootUpdateCallbackRecord, RootUpdateCallbackVisibility, ensure_root_is_scheduled,
        process_root_schedule_in_microtask, render_host_root_for_lanes,
        render_host_root_via_scheduler_callback, update_container,
    };
    use fast_react_core::{
        DeletionListId, FiberFlags, FiberMode, FiberTag, Lane, Lanes, PropsHandle,
    };

    fn root_store() -> (FiberRootStore<RecordingHost>, FiberRootId, RecordingHost) {
        let host = RecordingHost::default();
        let mut store = FiberRootStore::<RecordingHost>::new();
        let root_id = store
            .create_client_root(FakeContainer::new(1), RootOptions::new())
            .unwrap();
        (store, root_id, host)
    }

    fn host_root_element(
        store: &FiberRootStore<RecordingHost>,
        fiber: FiberId,
    ) -> RootElementHandle {
        let state = store.fiber_arena().get(fiber).unwrap().memoized_state();
        store.host_root_states().get(state).unwrap().element()
    }

    fn scheduled_callback_node(
        store: &mut FiberRootStore<RecordingHost>,
        root_id: FiberRootId,
    ) -> crate::RootSchedulerCallbackHandle {
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

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    struct DeletionMetadataFixture {
        first_parent: FiberId,
        first_list: DeletionListId,
        first_deleted: FiberId,
        second_deleted: FiberId,
        second_parent: FiberId,
        second_list: DeletionListId,
        third_deleted: FiberId,
    }

    fn create_test_fiber(
        store: &mut FiberRootStore<RecordingHost>,
        tag: FiberTag,
        props: u64,
    ) -> FiberId {
        store
            .fiber_arena_mut()
            .create_fiber(tag, None, PropsHandle::from_raw(props), FiberMode::NO)
    }

    fn attach_deletion_metadata_fixture(
        store: &mut FiberRootStore<RecordingHost>,
        host_root_work_in_progress: FiberId,
    ) -> DeletionMetadataFixture {
        let first_parent = create_test_fiber(store, FiberTag::HostComponent, 101);
        let second_parent = create_test_fiber(store, FiberTag::HostComponent, 102);
        store
            .fiber_arena_mut()
            .set_children(host_root_work_in_progress, &[first_parent, second_parent])
            .unwrap();

        let first_kept = create_test_fiber(store, FiberTag::HostText, 201);
        let first_deleted = create_test_fiber(store, FiberTag::HostText, 202);
        let second_deleted = create_test_fiber(store, FiberTag::HostText, 203);
        store
            .fiber_arena_mut()
            .set_children(first_parent, &[first_kept, first_deleted, second_deleted])
            .unwrap();
        let first_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(first_parent, second_deleted)
            .unwrap();
        store
            .fiber_arena_mut()
            .mark_child_for_deletion(first_parent, first_deleted)
            .unwrap();

        let third_deleted = create_test_fiber(store, FiberTag::HostText, 301);
        store
            .fiber_arena_mut()
            .set_children(second_parent, &[third_deleted])
            .unwrap();
        let second_list = store
            .fiber_arena_mut()
            .mark_child_for_deletion(second_parent, third_deleted)
            .unwrap();

        DeletionMetadataFixture {
            first_parent,
            first_list,
            first_deleted,
            second_deleted,
            second_parent,
            second_list,
            third_deleted,
        }
    }

    #[test]
    fn root_commit_switches_current_to_completed_host_root_wip() {
        let (mut store, root_id, host) = root_store();
        let element = RootElementHandle::from_raw(42);
        update_container(&mut store, root_id, element, None).unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let new_current = store.root(root_id).unwrap().current();

        assert_eq!(commit.root(), root_id);
        assert_eq!(commit.previous_current(), previous_current);
        assert_eq!(commit.current(), render.work_in_progress());
        assert_eq!(commit.finished_work(), render.work_in_progress());
        assert_eq!(commit.finished_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.remaining_lanes(), Lanes::NO);
        assert_eq!(commit.pending_lanes(), Lanes::NO);
        assert_eq!(commit.pending_passive_handoff(), None);
        assert!(commit.deletion_lists().is_empty());
        assert!(!commit.has_remaining_work());
        assert_eq!(new_current, render.work_in_progress());
        assert_eq!(host_root_element(&store, new_current), element);
        assert!(
            store
                .root(root_id)
                .unwrap()
                .scheduling()
                .pending_passive()
                .is_empty()
        );
        assert_eq!(
            store.fiber_arena().get(new_current).unwrap().alternate(),
            Some(previous_current)
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(previous_current)
                .unwrap()
                .alternate(),
            Some(new_current)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_deletion_lists_in_finished_tree_order_without_cleanup() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(45), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let fixture = attach_deletion_metadata_fixture(&mut store, render.finished_work());

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let deletion_lists = commit.deletion_lists();

        assert_eq!(deletion_lists.len(), 2);
        assert_eq!(deletion_lists[0].parent(), fixture.first_parent);
        assert_eq!(deletion_lists[0].list(), fixture.first_list);
        assert_eq!(
            deletion_lists[0].deleted(),
            &[fixture.second_deleted, fixture.first_deleted]
        );
        assert_eq!(deletion_lists[1].parent(), fixture.second_parent);
        assert_eq!(deletion_lists[1].list(), fixture.second_list);
        assert_eq!(deletion_lists[1].deleted(), &[fixture.third_deleted]);
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.finished_work()
        );
        assert!(
            store
                .fiber_arena()
                .deletion_list(fixture.first_list)
                .is_some()
        );
        assert!(
            store
                .fiber_arena()
                .deletion_list(fixture.second_list)
                .is_some()
        );
        assert_eq!(
            store
                .fiber_arena()
                .get(fixture.first_parent)
                .unwrap()
                .deletions(),
            Some(fixture.first_list)
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_rejects_invalid_deletion_list_before_switch_or_callback_drain() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(123);
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(46),
            Some(callback),
        )
        .unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let pending_lanes = store.root(root_id).unwrap().lanes().pending_lanes();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let fixture = attach_deletion_metadata_fixture(&mut store, render.finished_work());
        let callbacks_before = store
            .update_queues()
            .peek_root_update_callback_records(render.work_in_progress_update_queue())
            .unwrap();
        let parent_node = store
            .fiber_arena_mut()
            .get_mut(fixture.first_parent)
            .unwrap();
        parent_node.set_flags(parent_node.flags() - FiberFlags::CHILD_DELETION);

        let error = commit_finished_host_root(&mut store, render).unwrap_err();
        let callbacks_after = store
            .update_queues()
            .peek_root_update_callback_records(render.work_in_progress_update_queue())
            .unwrap();

        assert!(matches!(
            error,
            RootCommitError::FiberTopology(FiberTopologyError::DeletionListMissingFlag {
                parent,
                list,
            }) if parent == fixture.first_parent && list == fixture.first_list
        ));
        assert_eq!(callback_handles(callbacks_before.visible()), vec![callback]);
        assert_eq!(callback_handles(callbacks_after.visible()), vec![callback]);
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(
            store.root(root_id).unwrap().lanes().pending_lanes(),
            pending_lanes
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.finished_work())
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_records_pending_passive_handoff_without_effect_traversal() {
        let (mut store, root_id, host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(44), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(root_id, Lanes::NO);

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let handoff = commit.pending_passive_handoff().unwrap();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert_eq!(handoff.root(), root_id);
        assert_eq!(handoff.finished_work(), render.finished_work());
        assert_eq!(handoff.lanes(), Lanes::DEFAULT);
        assert_eq!(pending_passive.root(), Some(root_id));
        assert_eq!(
            pending_passive.finished_work(),
            Some(render.finished_work())
        );
        assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
        assert!(pending_passive.has_commit_handoff());
        assert!(!pending_passive.has_effects());
        assert!(pending_passive.passive_unmounts().is_empty());
        assert!(pending_passive.passive_mounts().is_empty());
        assert!(commit.root_update_callbacks().is_empty());
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_marks_finished_lanes_and_keeps_skipped_lanes_pending() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(11), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::SYNC).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let current = store.root(root_id).unwrap().current();
        let current_queue = store.fiber_arena().get(current).unwrap().update_queue();

        assert_eq!(commit.finished_lanes(), Lanes::SYNC);
        assert_eq!(commit.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(commit.pending_lanes(), Lanes::DEFAULT);
        assert!(commit.has_remaining_work());
        assert!(
            store
                .root(root_id)
                .unwrap()
                .lanes()
                .pending_lanes()
                .contains_lane(Lane::DEFAULT)
        );
        assert_eq!(host_root_element(&store, current), RootElementHandle::NONE);
        assert_eq!(
            store
                .update_queues()
                .base_updates(current_queue)
                .unwrap()
                .len(),
            1
        );
    }

    #[test]
    fn root_commit_clears_consumed_render_and_callback_bookkeeping() {
        let (mut store, root_id, host) = root_store();
        let callback_node = scheduled_callback_node(&mut store, root_id);

        let render_result = render_host_root_via_scheduler_callback(
            &mut store,
            root_id,
            callback_node,
            Lanes::DEFAULT,
        )
        .unwrap();
        let render = render_result.render_phase().unwrap();
        assert_eq!(
            store.root(root_id).unwrap().scheduling().work_in_progress(),
            Some(render.work_in_progress())
        );
        assert_eq!(
            store.root(root_id).unwrap().scheduling().callback_node(),
            callback_node
        );

        commit_finished_host_root(&mut store, render).unwrap();
        let scheduling = store.root(root_id).unwrap().scheduling();

        assert_eq!(scheduling.work_in_progress(), None);
        assert_eq!(scheduling.work_in_progress_root_render_lanes(), Lanes::NO);
        assert_eq!(
            scheduling.render_exit_status(),
            RootRenderExitStatus::NoWork
        );
        assert!(scheduling.callback_node().is_none());
        assert_eq!(store.root(root_id).unwrap().finished_work(), None);
        assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_rejects_stale_render_record_after_current_switch() {
        let (mut store, root_id, _host) = root_store();
        update_container(&mut store, root_id, RootElementHandle::from_raw(5), None).unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        commit_finished_host_root(&mut store, render).unwrap();
        let error = commit_finished_host_root(&mut store, render).unwrap_err();

        assert!(matches!(
            error,
            RootCommitError::CurrentMismatch { root, .. } if root == root_id
        ));
    }

    #[test]
    fn root_commit_rejects_wrong_root_pending_passive_handoff_before_switching_current() {
        let (mut store, root_id, _host) = root_store();
        let wrong_root = FiberRootId::new(root_id.raw() + 1).unwrap();
        update_container(&mut store, root_id, RootElementHandle::from_raw(6), None).unwrap();
        let previous_current = store.root(root_id).unwrap().current();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        store
            .root_mut(root_id)
            .unwrap()
            .scheduling_mut()
            .prepare_pending_passive(wrong_root, Lanes::DEFAULT);

        let error = commit_finished_host_root(&mut store, render).unwrap_err();
        let pending_passive = store.root(root_id).unwrap().scheduling().pending_passive();

        assert!(matches!(
            error,
            RootCommitError::PendingPassiveRootMismatch { root, pending_root }
                if root == root_id && pending_root == wrong_root
        ));
        assert_eq!(store.root(root_id).unwrap().current(), previous_current);
        assert_eq!(pending_passive.root(), Some(wrong_root));
        assert_eq!(pending_passive.finished_work(), None);
        assert_eq!(pending_passive.lanes(), Lanes::DEFAULT);
        assert!(!pending_passive.has_commit_handoff());
    }

    #[test]
    fn root_commit_hands_off_visible_root_update_callback_records() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(77);
        let update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(12),
            Some(callback),
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let callbacks = commit.root_update_callbacks();

        assert_eq!(callbacks.queue(), render.work_in_progress_update_queue());
        assert_eq!(callback_handles(callbacks.visible()), vec![callback]);
        assert_eq!(
            callbacks.visible()[0].queue(),
            render.work_in_progress_update_queue()
        );
        assert_eq!(callbacks.visible()[0].update(), update.update());
        assert_eq!(callbacks.visible()[0].sequence(), 0);
        assert_eq!(
            callbacks.visible()[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert!(callbacks.hidden().is_empty());
        assert!(callbacks.deferred_hidden().is_empty());
        assert_eq!(
            store.root(root_id).unwrap().current(),
            render.work_in_progress()
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    #[test]
    fn root_commit_drains_visible_callback_records_only_once() {
        let (mut store, root_id, _host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(88);
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(13),
            Some(callback),
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let current_queue = store
            .fiber_arena()
            .get(commit.current())
            .unwrap()
            .update_queue();
        let second_take = store
            .update_queues_mut()
            .take_root_update_callback_records(current_queue)
            .unwrap();
        let stale_commit_error = commit_finished_host_root(&mut store, render).unwrap_err();
        let after_stale_commit = store
            .update_queues_mut()
            .take_root_update_callback_records(current_queue)
            .unwrap();

        assert_eq!(
            callback_handles(commit.root_update_callbacks().visible()),
            vec![callback]
        );
        assert!(second_take.is_empty());
        assert!(matches!(
            stale_commit_error,
            RootCommitError::CurrentMismatch { root, .. } if root == root_id
        ));
        assert!(after_stale_commit.is_empty());
    }

    #[test]
    fn root_commit_defers_hidden_callbacks_without_visible_invocation_records() {
        let (mut store, root_id, host) = root_store();
        let callback = RootUpdateCallbackHandle::from_raw(99);
        let update = update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(14),
            Some(callback),
        )
        .unwrap();
        store
            .update_queues_mut()
            .mark_update_hidden(update.update())
            .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

        let commit = commit_finished_host_root(&mut store, render).unwrap();
        let callbacks = commit.root_update_callbacks();
        let current_queue = store
            .fiber_arena()
            .get(commit.current())
            .unwrap()
            .update_queue();
        let after_commit = store
            .update_queues()
            .peek_root_update_callback_records(current_queue)
            .unwrap();

        assert!(callbacks.visible().is_empty());
        assert!(callbacks.hidden().is_empty());
        assert_eq!(
            callback_handles(callbacks.deferred_hidden()),
            vec![callback]
        );
        assert_eq!(callbacks.deferred_hidden()[0].update(), update.update());
        assert_eq!(
            callbacks.deferred_hidden()[0].visibility(),
            RootUpdateCallbackVisibility::DeferredHidden
        );
        assert!(after_commit.visible().is_empty());
        assert!(after_commit.hidden().is_empty());
        assert_eq!(
            callback_handles(after_commit.deferred_hidden()),
            vec![callback]
        );
        assert_eq!(host.operations(), Vec::<&'static str>::new());
    }

    fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
        records.iter().map(|record| record.callback()).collect()
    }
}
