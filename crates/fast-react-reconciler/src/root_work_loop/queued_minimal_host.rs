use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, Lanes};

use crate::host_work::{
    HostWorkError, HostWorkResult, TestHostRootDeletionCleanupApplyResult,
    TestHostRootMutationApplyResult, apply_test_host_root_commit_mutations_for_canary,
    apply_test_host_root_deletion_cleanup_for_canary, delete_test_host_work_root_child_for_canary,
    mount_test_host_work,
    update_test_host_root_component_with_text_child_work_with_detached_hosts_for_canary,
};
use crate::root_commit::{
    HostRootFinishedWorkCommitHandoffErrorForCanary,
    HostRootFinishedWorkCommitHandoffRecordForCanary, HostRootMutationApplyRecordKind,
};
use crate::root_updates::{
    HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary,
    HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary,
    HostRootUpdateQueueLaneHandoffErrorForCanary, HostRootUpdateQueueLaneHandoffRecordForCanary,
    UpdateContainerResult, commit_host_root_update_queue_lane_handoff_for_canary,
    host_root_update_queue_lane_handoff_for_canary, update_container, update_container_sync,
};
use crate::test_support::{RecordingHost, TestHostNode, TestHostTree};
use crate::{
    FiberRootId, FiberRootStore, HostRootCommitRecord, HostRootRenderPhaseRecord,
    RootElementHandle, RootUpdateError, RootWorkLoopError, render_host_root_for_lanes,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum QueuedMinimalHostRootUpdatePriority {
    Default,
    Sync,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum QueuedMinimalHostRootCommitPhase {
    Mount,
    Update,
    Cleanup,
}

#[derive(Debug)]
pub(crate) struct QueuedMinimalHostRootOutput {
    record: QueuedMinimalHostRootCommitRecord,
    host_work: HostWorkResult,
}

impl QueuedMinimalHostRootOutput {
    #[must_use]
    pub(crate) const fn record(&self) -> &QueuedMinimalHostRootCommitRecord {
        &self.record
    }

    #[must_use]
    pub(crate) const fn host_work(&self) -> &HostWorkResult {
        &self.host_work
    }

    #[must_use]
    pub(crate) fn into_host_work(self) -> HostWorkResult {
        self.host_work
    }
}

#[derive(Debug)]
pub(crate) struct QueuedMinimalHostRootCommitRecord {
    phase: QueuedMinimalHostRootCommitPhase,
    priority: QueuedMinimalHostRootUpdatePriority,
    queued_element: RootElementHandle,
    update: UpdateContainerResult,
    render: HostRootRenderPhaseRecord,
    update_queue_commit_handoff: HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary,
    mutation_apply: TestHostRootMutationApplyResult,
    deletion_cleanup: Option<TestHostRootDeletionCleanupApplyResult>,
}

impl QueuedMinimalHostRootCommitRecord {
    #[must_use]
    pub(crate) const fn phase(&self) -> QueuedMinimalHostRootCommitPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn priority(&self) -> QueuedMinimalHostRootUpdatePriority {
        self.priority
    }

    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.render.root()
    }

    #[must_use]
    pub(crate) const fn queued_element(&self) -> RootElementHandle {
        self.queued_element
    }

    #[must_use]
    pub(crate) const fn update(&self) -> &UpdateContainerResult {
        &self.update
    }

    #[must_use]
    pub(crate) const fn render(&self) -> HostRootRenderPhaseRecord {
        self.render
    }

    #[must_use]
    pub(crate) const fn commit(&self) -> &HostRootCommitRecord {
        self.update_queue_commit_handoff.commit()
    }

    #[must_use]
    pub(crate) const fn update_queue_commit_handoff(
        &self,
    ) -> &HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary {
        &self.update_queue_commit_handoff
    }

    #[must_use]
    pub(crate) fn update_queue_handoff(&self) -> &HostRootUpdateQueueLaneHandoffRecordForCanary {
        self.update_queue_commit_handoff.queue_handoff()
    }

    #[must_use]
    pub(crate) const fn finished_work_handoff(
        &self,
    ) -> &HostRootFinishedWorkCommitHandoffRecordForCanary {
        self.update_queue_commit_handoff.finished_work_handoff()
    }

    #[must_use]
    pub(crate) const fn mutation_apply(&self) -> &TestHostRootMutationApplyResult {
        &self.mutation_apply
    }

    #[must_use]
    pub(crate) const fn deletion_cleanup(&self) -> Option<&TestHostRootDeletionCleanupApplyResult> {
        self.deletion_cleanup.as_ref()
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render.render_lanes()
    }

    #[must_use]
    pub(crate) const fn resulting_element(&self) -> RootElementHandle {
        self.render.resulting_element()
    }

    #[must_use]
    pub(crate) const fn applied_update_count(&self) -> usize {
        self.render.applied_update_count()
    }

    #[must_use]
    pub(crate) fn public_root_rendering_blocked(&self) -> bool {
        self.finished_work_handoff().public_root_rendering_blocked()
    }

    #[must_use]
    pub(crate) const fn public_renderer_package_behavior_exposed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn react_dom_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) fn proves_queued_update_render_complete_commit(&self) -> bool {
        let commit = self.commit();
        let update_sequence = self.update_queue_commit_handoff().update_sequence_ids();
        self.update.schedule().root() == self.render.root()
            && self.update.schedule().lane() == self.update.lane()
            && self
                .update
                .lane()
                .to_lanes()
                .is_subset_of(self.render.render_lanes())
            && update_sequence.len() == 1
            && update_sequence[0] == self.update.update()
            && self
                .update_queue_commit_handoff()
                .proves_queue_lane_handoff_gated_current_switch()
            && self.update_queue_handoff().root() == self.render.root()
            && self.update_queue_handoff().finished_work() == self.render.finished_work()
            && self.update_queue_handoff().resulting_element() == self.queued_element
            && self.render.resulting_element() == self.queued_element
            && self.render.applied_update_count() > 0
            && commit.root() == self.render.root()
            && commit.finished_work() == self.render.finished_work()
            && self.mutation_apply.root() == commit.root()
            && self.mutation_apply.finished_work() == commit.finished_work()
            && !self.public_renderer_package_behavior_exposed()
            && !self.react_dom_compatibility_claimed()
            && !self.test_renderer_compatibility_claimed()
            && self.public_root_rendering_blocked()
            && self.phase_evidence_matches()
    }

    fn phase_evidence_matches(&self) -> bool {
        match self.phase {
            QueuedMinimalHostRootCommitPhase::Mount => {
                self.queued_element.is_some()
                    && self.deletion_cleanup.is_none()
                    && self.mutation_apply.records().iter().any(|record| {
                        record.mutation().kind()
                            == HostRootMutationApplyRecordKind::AppendPlacementToContainer
                    })
            }
            QueuedMinimalHostRootCommitPhase::Update => {
                self.queued_element.is_some()
                    && self.deletion_cleanup.is_none()
                    && self.mutation_apply.records().iter().any(|record| {
                        matches!(
                            record.mutation().kind(),
                            HostRootMutationApplyRecordKind::CommitHostComponentUpdate
                                | HostRootMutationApplyRecordKind::CommitHostTextUpdate
                        )
                    })
            }
            QueuedMinimalHostRootCommitPhase::Cleanup => {
                self.queued_element.is_none()
                    && self
                        .deletion_cleanup
                        .as_ref()
                        .is_some_and(|cleanup| cleanup.applied_record_count() > 0)
                    && self.mutation_apply.records().iter().all(|record| {
                        record.mutation().kind()
                            == HostRootMutationApplyRecordKind::RemoveDeletedFromContainer
                    })
            }
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
pub(crate) enum QueuedMinimalHostRootCommitError {
    RootUpdate(RootUpdateError),
    Render(RootWorkLoopError),
    HostWork(HostWorkError),
    UpdateQueueHandoff(Box<HostRootUpdateQueueLaneHandoffErrorForCanary>),
    UpdateQueueCommit(Box<HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary>),
    FinishedWorkCommit(Box<HostRootFinishedWorkCommitHandoffErrorForCanary>),
    PreviousHostWorkRootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    PreviousHostWorkCurrentMismatch {
        root: FiberRootId,
        expected_current: FiberId,
        actual_work_in_progress: FiberId,
    },
    MissingCurrentHostRootChildForCleanup {
        root: FiberRootId,
        current: FiberId,
    },
    PreviousHostWorkRootChildMismatch {
        root: FiberRootId,
        expected_root_child: Option<FiberId>,
        actual_root_child: Option<FiberId>,
        expected_root_children: Vec<FiberId>,
        actual_root_children: Vec<FiberId>,
    },
    PreviousHostWorkCompletedChildMismatch {
        root: FiberRootId,
        expected_completed_child: Option<FiberId>,
        actual_completed_child: Option<FiberId>,
        expected_completed_children: Vec<FiberId>,
        actual_completed_children: Vec<FiberId>,
    },
    MissingPreviousHostWorkForCleanup {
        root: FiberRootId,
    },
    MissingRootElement {
        root: FiberRootId,
        element: RootElementHandle,
    },
    ExpectedHostComponentRoot {
        root: FiberRootId,
        element: RootElementHandle,
    },
    ExpectedSingleHostTextChild {
        root: FiberRootId,
        element: RootElementHandle,
        child_count: usize,
    },
    ExpectedHostTextChild {
        root: FiberRootId,
        element: RootElementHandle,
    },
    StaleRenderedUpdate {
        root: FiberRootId,
        queued_element: RootElementHandle,
        rendered_element: RootElementHandle,
        render_lanes: Lanes,
        update_lanes: Lanes,
        applied_update_count: usize,
    },
}

impl Display for QueuedMinimalHostRootCommitError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootUpdate(error) => Display::fmt(error, formatter),
            Self::Render(error) => Display::fmt(error, formatter),
            Self::HostWork(error) => Display::fmt(error, formatter),
            Self::UpdateQueueHandoff(error) => Display::fmt(error, formatter),
            Self::UpdateQueueCommit(error) => Display::fmt(error, formatter),
            Self::FinishedWorkCommit(error) => Display::fmt(error, formatter),
            Self::PreviousHostWorkRootMismatch { expected, actual } => write!(
                formatter,
                "queued minimal HostRoot commit expected previous host work for root {}, found root {}",
                expected.raw(),
                actual.raw()
            ),
            Self::PreviousHostWorkCurrentMismatch {
                root,
                expected_current,
                actual_work_in_progress,
            } => write!(
                formatter,
                "queued minimal HostRoot cleanup for root {} expected previous host work-in-progress {:?} to match live current {:?}",
                root.raw(),
                actual_work_in_progress,
                expected_current
            ),
            Self::MissingCurrentHostRootChildForCleanup { root, current } => write!(
                formatter,
                "queued minimal HostRoot cleanup for root {} expected live current {:?} to have a child",
                root.raw(),
                current
            ),
            Self::PreviousHostWorkRootChildMismatch {
                root,
                expected_root_child,
                actual_root_child,
                expected_root_children,
                actual_root_children,
            } => write!(
                formatter,
                "queued minimal HostRoot cleanup for root {} expected previous root child {:?}/{:?}, found {:?}/{:?}",
                root.raw(),
                expected_root_child,
                expected_root_children,
                actual_root_child,
                actual_root_children
            ),
            Self::PreviousHostWorkCompletedChildMismatch {
                root,
                expected_completed_child,
                actual_completed_child,
                expected_completed_children,
                actual_completed_children,
            } => write!(
                formatter,
                "queued minimal HostRoot cleanup for root {} expected previous completed child {:?}/{:?}, found {:?}/{:?}",
                root.raw(),
                expected_completed_child,
                expected_completed_children,
                actual_completed_child,
                actual_completed_children
            ),
            Self::MissingPreviousHostWorkForCleanup { root } => write!(
                formatter,
                "queued minimal HostRoot cleanup for root {} requires mounted host work",
                root.raw()
            ),
            Self::MissingRootElement { root, element } => write!(
                formatter,
                "queued minimal HostRoot commit for root {} cannot resolve element {}",
                root.raw(),
                element.raw()
            ),
            Self::ExpectedHostComponentRoot { root, element } => write!(
                formatter,
                "queued minimal HostRoot commit for root {} element {} expected a HostComponent root",
                root.raw(),
                element.raw()
            ),
            Self::ExpectedSingleHostTextChild {
                root,
                element,
                child_count,
            } => write!(
                formatter,
                "queued minimal HostRoot commit for root {} element {} expected exactly one HostText child, found {child_count}",
                root.raw(),
                element.raw()
            ),
            Self::ExpectedHostTextChild { root, element } => write!(
                formatter,
                "queued minimal HostRoot commit for root {} element {} expected a HostText child",
                root.raw(),
                element.raw()
            ),
            Self::StaleRenderedUpdate {
                root,
                queued_element,
                rendered_element,
                render_lanes,
                update_lanes,
                applied_update_count,
            } => write!(
                formatter,
                "queued minimal HostRoot commit for root {} rendered stale lanes {:?}; queued element {}, rendered element {}, update lanes {:?}, applied update count {}",
                root.raw(),
                render_lanes,
                queued_element.raw(),
                rendered_element.raw(),
                update_lanes,
                applied_update_count
            ),
        }
    }
}

impl Error for QueuedMinimalHostRootCommitError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::RootUpdate(error) => Some(error),
            Self::Render(error) => Some(error),
            Self::HostWork(error) => Some(error),
            Self::UpdateQueueHandoff(error) => Some(error),
            Self::UpdateQueueCommit(error) => Some(error),
            Self::FinishedWorkCommit(error) => Some(error),
            Self::PreviousHostWorkRootMismatch { .. }
            | Self::PreviousHostWorkCurrentMismatch { .. }
            | Self::MissingCurrentHostRootChildForCleanup { .. }
            | Self::PreviousHostWorkRootChildMismatch { .. }
            | Self::PreviousHostWorkCompletedChildMismatch { .. }
            | Self::MissingPreviousHostWorkForCleanup { .. }
            | Self::MissingRootElement { .. }
            | Self::ExpectedHostComponentRoot { .. }
            | Self::ExpectedSingleHostTextChild { .. }
            | Self::ExpectedHostTextChild { .. }
            | Self::StaleRenderedUpdate { .. } => None,
        }
    }
}

impl From<RootUpdateError> for QueuedMinimalHostRootCommitError {
    fn from(error: RootUpdateError) -> Self {
        Self::RootUpdate(error)
    }
}

impl From<RootWorkLoopError> for QueuedMinimalHostRootCommitError {
    fn from(error: RootWorkLoopError) -> Self {
        Self::Render(error)
    }
}

impl From<HostWorkError> for QueuedMinimalHostRootCommitError {
    fn from(error: HostWorkError) -> Self {
        Self::HostWork(error)
    }
}

impl From<HostRootUpdateQueueLaneHandoffErrorForCanary> for QueuedMinimalHostRootCommitError {
    fn from(error: HostRootUpdateQueueLaneHandoffErrorForCanary) -> Self {
        Self::UpdateQueueHandoff(Box::new(error))
    }
}

impl From<HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary>
    for QueuedMinimalHostRootCommitError
{
    fn from(error: HostRootUpdateQueueFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::UpdateQueueCommit(Box::new(error))
    }
}

impl From<HostRootFinishedWorkCommitHandoffErrorForCanary> for QueuedMinimalHostRootCommitError {
    fn from(error: HostRootFinishedWorkCommitHandoffErrorForCanary) -> Self {
        Self::FinishedWorkCommit(Box::new(error))
    }
}

pub(crate) fn enqueue_render_complete_commit_minimal_host_root_for_canary(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    root_id: FiberRootId,
    element: RootElementHandle,
    priority: QueuedMinimalHostRootUpdatePriority,
    render_lanes: Lanes,
    source: &TestHostTree,
    previous_host_work: Option<HostWorkResult>,
    handoff_order: usize,
    commit_order: usize,
) -> Result<QueuedMinimalHostRootOutput, QueuedMinimalHostRootCommitError> {
    if let Some(previous) = previous_host_work.as_ref()
        && previous.root() != root_id
    {
        return Err(
            QueuedMinimalHostRootCommitError::PreviousHostWorkRootMismatch {
                expected: root_id,
                actual: previous.root(),
            },
        );
    }

    if element.is_none() && previous_host_work.is_none() {
        return Err(
            QueuedMinimalHostRootCommitError::MissingPreviousHostWorkForCleanup { root: root_id },
        );
    }

    if element.is_none()
        && let Some(previous) = previous_host_work.as_ref()
    {
        validate_cleanup_previous_host_work_is_mount_owned(store, root_id, previous)?;
    }

    if element.is_some() {
        validate_minimal_host_component_with_text_source(root_id, element, source)?;
    }

    let update = match priority {
        QueuedMinimalHostRootUpdatePriority::Default => {
            update_container(store, root_id, element, None)?
        }
        QueuedMinimalHostRootUpdatePriority::Sync => {
            update_container_sync(store, root_id, element, None)?
        }
    };
    let render = render_host_root_for_lanes(store, root_id, render_lanes)?;
    validate_render_consumed_queued_update(root_id, element, &update, render)?;
    let update_queue_handoff = host_root_update_queue_lane_handoff_for_canary(
        store,
        root_id,
        std::slice::from_ref(&update),
        render,
    )?;

    if element.is_none() {
        let previous = previous_host_work.expect("cleanup previous host work checked above");
        commit_cleanup(
            store,
            host,
            previous,
            update,
            render,
            update_queue_handoff,
            priority,
            handoff_order,
            commit_order,
        )
    } else if let Some(previous) = previous_host_work {
        commit_update(
            store,
            host,
            source,
            previous,
            update,
            render,
            update_queue_handoff,
            priority,
            handoff_order,
            commit_order,
        )
    } else {
        commit_mount(
            store,
            host,
            source,
            update,
            render,
            update_queue_handoff,
            priority,
            handoff_order,
            commit_order,
        )
    }
}

#[allow(clippy::too_many_arguments)]
fn commit_mount(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    source: &TestHostTree,
    update: UpdateContainerResult,
    render: HostRootRenderPhaseRecord,
    update_queue_handoff: HostRootUpdateQueueLaneHandoffRecordForCanary,
    priority: QueuedMinimalHostRootUpdatePriority,
    handoff_order: usize,
    commit_order: usize,
) -> Result<QueuedMinimalHostRootOutput, QueuedMinimalHostRootCommitError> {
    let mut host_work = mount_test_host_work(store, host, render, source)?;
    let update_queue_commit_handoff = commit_host_root_update_queue_lane_handoff_for_canary(
        store,
        render.root(),
        render,
        Some(&update_queue_handoff),
        handoff_order,
        commit_order,
    )?;
    let mutation_apply = apply_test_host_root_commit_mutations_for_canary(
        store,
        host,
        update_queue_commit_handoff.commit(),
        &mut host_work,
    )?;
    Ok(output(
        QueuedMinimalHostRootCommitPhase::Mount,
        priority,
        update,
        render,
        update_queue_commit_handoff,
        mutation_apply,
        None,
        host_work,
    ))
}

#[allow(clippy::too_many_arguments)]
fn commit_update(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    source: &TestHostTree,
    previous: HostWorkResult,
    update: UpdateContainerResult,
    render: HostRootRenderPhaseRecord,
    update_queue_handoff: HostRootUpdateQueueLaneHandoffRecordForCanary,
    priority: QueuedMinimalHostRootUpdatePriority,
    handoff_order: usize,
    commit_order: usize,
) -> Result<QueuedMinimalHostRootOutput, QueuedMinimalHostRootCommitError> {
    let detached_hosts = previous.into_detached_hosts_for_canary();
    let mut host_work =
        update_test_host_root_component_with_text_child_work_with_detached_hosts_for_canary(
            store,
            render,
            source,
            detached_hosts,
        )?;
    let update_queue_commit_handoff = commit_host_root_update_queue_lane_handoff_for_canary(
        store,
        render.root(),
        render,
        Some(&update_queue_handoff),
        handoff_order,
        commit_order,
    )?;
    let mutation_apply = apply_test_host_root_commit_mutations_for_canary(
        store,
        host,
        update_queue_commit_handoff.commit(),
        &mut host_work,
    )?;
    Ok(output(
        QueuedMinimalHostRootCommitPhase::Update,
        priority,
        update,
        render,
        update_queue_commit_handoff,
        mutation_apply,
        None,
        host_work,
    ))
}

#[allow(clippy::too_many_arguments)]
fn commit_cleanup(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mut host_work: HostWorkResult,
    update: UpdateContainerResult,
    render: HostRootRenderPhaseRecord,
    update_queue_handoff: HostRootUpdateQueueLaneHandoffRecordForCanary,
    priority: QueuedMinimalHostRootUpdatePriority,
    handoff_order: usize,
    commit_order: usize,
) -> Result<QueuedMinimalHostRootOutput, QueuedMinimalHostRootCommitError> {
    delete_test_host_work_root_child_for_canary(store, &mut host_work, render)?;
    let update_queue_commit_handoff = commit_host_root_update_queue_lane_handoff_for_canary(
        store,
        render.root(),
        render,
        Some(&update_queue_handoff),
        handoff_order,
        commit_order,
    )?;
    let mutation_apply = apply_test_host_root_commit_mutations_for_canary(
        store,
        host,
        update_queue_commit_handoff.commit(),
        &mut host_work,
    )?;
    let deletion_cleanup = apply_test_host_root_deletion_cleanup_for_canary(
        store,
        host,
        update_queue_commit_handoff.commit(),
        &mut host_work,
    )?;
    Ok(output(
        QueuedMinimalHostRootCommitPhase::Cleanup,
        priority,
        update,
        render,
        update_queue_commit_handoff,
        mutation_apply,
        Some(deletion_cleanup),
        host_work,
    ))
}

fn output(
    phase: QueuedMinimalHostRootCommitPhase,
    priority: QueuedMinimalHostRootUpdatePriority,
    update: UpdateContainerResult,
    render: HostRootRenderPhaseRecord,
    update_queue_commit_handoff: HostRootUpdateQueueFinishedWorkCommitHandoffRecordForCanary,
    mutation_apply: TestHostRootMutationApplyResult,
    deletion_cleanup: Option<TestHostRootDeletionCleanupApplyResult>,
    host_work: HostWorkResult,
) -> QueuedMinimalHostRootOutput {
    QueuedMinimalHostRootOutput {
        record: QueuedMinimalHostRootCommitRecord {
            phase,
            priority,
            queued_element: render.resulting_element(),
            update,
            render,
            update_queue_commit_handoff,
            mutation_apply,
            deletion_cleanup,
        },
        host_work,
    }
}

fn validate_render_consumed_queued_update(
    root: FiberRootId,
    element: RootElementHandle,
    update: &UpdateContainerResult,
    render: HostRootRenderPhaseRecord,
) -> Result<(), QueuedMinimalHostRootCommitError> {
    let update_lanes = update.lane().to_lanes();
    if render.resulting_element() == element
        && render.applied_update_count() > 0
        && update_lanes.is_subset_of(render.render_lanes())
    {
        return Ok(());
    }

    Err(QueuedMinimalHostRootCommitError::StaleRenderedUpdate {
        root,
        queued_element: element,
        rendered_element: render.resulting_element(),
        render_lanes: render.render_lanes(),
        update_lanes,
        applied_update_count: render.applied_update_count(),
    })
}

fn validate_cleanup_previous_host_work_is_mount_owned(
    store: &FiberRootStore<RecordingHost>,
    root: FiberRootId,
    previous: &HostWorkResult,
) -> Result<(), QueuedMinimalHostRootCommitError> {
    let current = store.root(root).map_err(HostWorkError::from)?.current();
    if previous.work_in_progress() != current {
        return Err(
            QueuedMinimalHostRootCommitError::PreviousHostWorkCurrentMismatch {
                root,
                expected_current: current,
                actual_work_in_progress: previous.work_in_progress(),
            },
        );
    }

    let current_children = current_host_root_children(store, current)?;
    let current_child = current_children.first().copied();
    if current_child.is_none() {
        return Err(
            QueuedMinimalHostRootCommitError::MissingCurrentHostRootChildForCleanup {
                root,
                current,
            },
        );
    }

    if previous.root_child() != current_child || previous.root_children() != current_children {
        return Err(
            QueuedMinimalHostRootCommitError::PreviousHostWorkRootChildMismatch {
                root,
                expected_root_child: current_child,
                actual_root_child: previous.root_child(),
                expected_root_children: current_children,
                actual_root_children: previous.root_children().to_vec(),
            },
        );
    }

    if previous.completed_child() != current_child
        || !previous_completed_children_match_cleanup_current_subtree(
            store,
            current_child.expect("current child checked above"),
            current_children.as_slice(),
            previous.completed_children(),
        )?
    {
        return Err(
            QueuedMinimalHostRootCommitError::PreviousHostWorkCompletedChildMismatch {
                root,
                expected_completed_child: current_child,
                actual_completed_child: previous.completed_child(),
                expected_completed_children: expected_previous_completed_children_for_cleanup(
                    store,
                    current_child.expect("current child checked above"),
                    current_children.as_slice(),
                )?,
                actual_completed_children: previous.completed_children().to_vec(),
            },
        );
    }

    previous.validate_detached_host_cleanup_ownership_for_canary(store)?;

    Ok(())
}

fn previous_completed_children_match_cleanup_current_subtree(
    store: &FiberRootStore<RecordingHost>,
    current_child: FiberId,
    current_children: &[FiberId],
    previous_completed_children: &[FiberId],
) -> Result<bool, QueuedMinimalHostRootCommitError> {
    if previous_completed_children == current_children {
        return Ok(true);
    }

    if store
        .fiber_arena()
        .get(current_child)
        .map_err(HostWorkError::from)?
        .alternate()
        .is_none()
    {
        return Ok(false);
    }

    Ok(previous_completed_children
        == expected_previous_completed_children_for_cleanup(
            store,
            current_child,
            current_children,
        )?
        .as_slice())
}

fn expected_previous_completed_children_for_cleanup(
    store: &FiberRootStore<RecordingHost>,
    current_child: FiberId,
    current_children: &[FiberId],
) -> Result<Vec<FiberId>, QueuedMinimalHostRootCommitError> {
    if store
        .fiber_arena()
        .get(current_child)
        .map_err(HostWorkError::from)?
        .alternate()
        .is_none()
    {
        return Ok(current_children.to_vec());
    }

    let mut completed_children = Vec::new();
    collect_host_cleanup_subtree_children(store, current_child, &mut completed_children)?;
    Ok(completed_children)
}

fn collect_host_cleanup_subtree_children(
    store: &FiberRootStore<RecordingHost>,
    fiber: FiberId,
    completed_children: &mut Vec<FiberId>,
) -> Result<(), QueuedMinimalHostRootCommitError> {
    completed_children.push(fiber);
    for child in store
        .fiber_arena()
        .child_ids(fiber)
        .map_err(HostWorkError::from)?
    {
        collect_host_cleanup_subtree_children(store, child, completed_children)?;
    }
    Ok(())
}

fn current_host_root_children(
    store: &FiberRootStore<RecordingHost>,
    current: FiberId,
) -> Result<Vec<FiberId>, QueuedMinimalHostRootCommitError> {
    let mut children = Vec::new();
    let mut next = store
        .fiber_arena()
        .get(current)
        .map_err(HostWorkError::from)?
        .child();

    while let Some(child) = next {
        children.push(child);
        next = store
            .fiber_arena()
            .get(child)
            .map_err(HostWorkError::from)?
            .sibling();
    }

    Ok(children)
}

fn validate_minimal_host_component_with_text_source(
    root: FiberRootId,
    element: RootElementHandle,
    source: &TestHostTree,
) -> Result<(), QueuedMinimalHostRootCommitError> {
    let Some(node) = source.root(element) else {
        return Err(QueuedMinimalHostRootCommitError::MissingRootElement { root, element });
    };
    let TestHostNode::Element(component) = node else {
        return Err(QueuedMinimalHostRootCommitError::ExpectedHostComponentRoot { root, element });
    };
    if component.children().len() != 1 {
        return Err(
            QueuedMinimalHostRootCommitError::ExpectedSingleHostTextChild {
                root,
                element,
                child_count: component.children().len(),
            },
        );
    }
    if !matches!(component.children()[0], TestHostNode::Text(_)) {
        return Err(QueuedMinimalHostRootCommitError::ExpectedHostTextChild { root, element });
    }
    Ok(())
}
