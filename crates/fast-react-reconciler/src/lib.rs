//! Reconciler placeholders for fibers, lanes, hooks, context, and scheduling.
//!
//! Real reconciliation is intentionally absent from the scaffold. The module
//! layout reserves the boundary where lane/update/hook semantics will be built.

mod begin_work;
#[cfg(test)]
mod complete_work;
mod concurrent_updates;
#[cfg(test)]
mod context;
mod execution_context;
mod fiber_root;
mod fiber_store;
mod function_component;
mod host_nodes;
mod host_tokens;
#[cfg(test)]
mod host_work;
mod passive_effects;
mod private_fiber_inspection;
mod root_callbacks;
mod root_commit;
mod root_config;
mod root_scheduler;
mod root_updates;
mod root_work_loop;
mod scheduler_bridge;
mod sync_flush;
#[cfg(test)]
mod test_support;
mod unsupported_features;
mod update_priority;
mod update_queue;
mod work_in_progress;

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ElementTypeHandle, FiberFlags, FiberId, FiberTag, FiberTopologyError, Lanes, PropsHandle,
    StateNodeHandle, UnimplementedReactBehavior, bubble_properties, unimplemented_behavior,
};
use fast_react_host_config::{
    HostCapability, HostError, HostFiberTokenPhase, HostFiberTokenTarget, HostOperationError,
    HostTreeUpdateMode, HostTreeUpdateModeError, HostTypes, MutationRenderer,
    UnsupportedHostCapability,
};

pub use concurrent_updates::{
    ConcurrentUpdateError, ConcurrentUpdateStaging, FinishedConcurrentUpdates,
    StagedConcurrentUpdate, enqueue_concurrent_host_root_update,
    finish_queueing_concurrent_updates, mark_update_lane_from_fiber_to_root,
    mark_update_lanes_from_fiber_to_root,
};
pub use execution_context::{
    ExecutionContext, ExecutionContextState, SyncFlushExecutionContextRecord,
};
pub use fiber_root::{
    FiberRoot, HostRootHydrationState, HostRootState, HostRootStateStore, HostRootStateStoreError,
    RootSchedulingState, create_host_root_current_fiber,
};
pub use fiber_store::{FiberRootId, FiberRootStore, FiberRootStoreError};
pub use host_tokens::{
    HostFiberTokenGeneration, HostFiberTokenId, HostFiberTokenMetadata, HostFiberTokenStore,
    HostFiberTokenValidationError,
};
pub use private_fiber_inspection::{
    TestRendererCommittedFiberInspectionError, TestRendererCommittedFiberNodeInspection,
    TestRendererCommittedFiberTreeInspection, inspect_test_renderer_committed_fiber_tree,
};
pub use root_callbacks::{
    RootUpdateCallbackRecord, RootUpdateCallbackSnapshot, RootUpdateCallbackVisibility,
};
pub use root_commit::{HostRootCommitRecord, RootCommitError, commit_finished_host_root};
pub use root_config::{
    PendingChildrenHandle, PendingCommitCancelHandle, PendingCommitHandle, PendingPassiveState,
    RootCacheHandle, RootCallbackPriority, RootContextHandle, RootDefaultTransitionIndicatorHandle,
    RootElementHandle, RootErrorCallbackHandle, RootFormStateHandle, RootHydrationCallbacksHandle,
    RootKind, RootLifecycleState, RootOptions, RootRecoverableErrorCallbackHandle,
    RootRenderExitStatus, RootSchedulerCallbackHandle, RootSuspenseBoundarySetHandle, RootTag,
    RootTransitionCallbacksHandle, RootWorkStatus, UnsupportedHydrationKind,
};
pub use root_scheduler::{
    RootScheduleMicrotaskResult, RootSchedulerCallbackExecutionRecord,
    RootSchedulerCallbackExecutionStatus, RootSchedulerError, RootSchedulerState,
    RootSyncFlushExitStatus, RootSyncFlushPlan, RootSyncFlushRecord, RootSyncFlushRecordStatus,
    RootSyncFlushResult, RootTaskScheduleOutcome, RootTaskScheduleRecord,
    ScheduledRootUpdateResult, collect_sync_flush_plan, ensure_root_is_scheduled,
    execute_scheduled_root_callback, flush_sync_work_on_all_roots,
    process_root_schedule_in_microtask, schedule_task_for_root_during_microtask, scheduled_roots,
};
pub use root_updates::{
    RootScheduleUpdateRecord, RootTransitionEntanglementRecord, RootUpdateError,
    UpdateContainerResult, update_container, update_container_sync,
};
pub use root_work_loop::{
    HostRootRenderPhaseRecord, RootWorkLoopError, SchedulerCallbackHostRootRenderResult,
    SchedulerCallbackRenderStatus, SchedulerCallbackValidationRecord, render_host_root_for_lanes,
    render_host_root_via_scheduler_callback, validate_scheduled_host_root_callback,
};
pub use scheduler_bridge::{
    FAKE_ACT_CALLBACK_NODE, SchedulerActQueueRequest, SchedulerActQueueTaskKind, SchedulerBridge,
    SchedulerCallbackRequest, SchedulerCancellationRecord, SchedulerMicrotaskHandle,
    SchedulerMicrotaskKind, SchedulerMicrotaskRequest, SchedulerPriority,
};
pub use sync_flush::{
    SyncFlushError, SyncFlushResult, SyncFlushRootRecord, flush_sync_commit_work_on_all_roots,
};
pub use update_priority::{UpdatePriorityState, request_update_lane};
pub use update_queue::{
    CollectedRootUpdateCallback, RootUpdate, RootUpdateCallbackHandle, RootUpdatePayload,
    SharedQueue, UpdateId, UpdateQueue, UpdateQueueError, UpdateQueueStore, UpdateTag,
};
pub use work_in_progress::{WorkInProgressError, create_host_root_work_in_progress};

pub const RENDER_PLACEHOLDER_FEATURE: &str = "Reconciler.render";
pub const MUTATION_RENDER_PLACEHOLDER_FEATURE: &str = "Reconciler.render.mutation";

pub type ReconcilerResult<T> = Result<T, ReconcilerError>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReconcilerError {
    Unimplemented(UnimplementedReactBehavior),
    UnsupportedHostCapability(UnsupportedHostCapability),
    HostOperation(HostOperationError),
    InvalidHostTreeUpdateMode(HostTreeUpdateModeError),
    FiberTopology(FiberTopologyError),
    FiberRootStore(FiberRootStoreError),
    HostRootStateStore(HostRootStateStoreError),
    HostFiberToken(HostFiberTokenValidationError),
    UpdateQueue(UpdateQueueError),
    ConcurrentUpdate(ConcurrentUpdateError),
    RootUpdate(RootUpdateError),
    RootScheduler(RootSchedulerError),
    RootWorkLoop(RootWorkLoopError),
    RootCommit(RootCommitError),
    SyncFlush(SyncFlushError),
    WorkInProgress(WorkInProgressError),
}

impl ReconcilerError {
    #[must_use]
    pub const fn unimplemented(feature: &'static str) -> Self {
        Self::Unimplemented(unimplemented_behavior(feature))
    }
}

impl Display for ReconcilerError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Unimplemented(error) => Display::fmt(error, formatter),
            Self::UnsupportedHostCapability(error) => Display::fmt(error, formatter),
            Self::HostOperation(error) => Display::fmt(error, formatter),
            Self::InvalidHostTreeUpdateMode(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::HostRootStateStore(error) => Display::fmt(error, formatter),
            Self::HostFiberToken(error) => Display::fmt(error, formatter),
            Self::UpdateQueue(error) => Display::fmt(error, formatter),
            Self::ConcurrentUpdate(error) => Display::fmt(error, formatter),
            Self::RootUpdate(error) => Display::fmt(error, formatter),
            Self::RootScheduler(error) => Display::fmt(error, formatter),
            Self::RootWorkLoop(error) => Display::fmt(error, formatter),
            Self::RootCommit(error) => Display::fmt(error, formatter),
            Self::SyncFlush(error) => Display::fmt(error, formatter),
            Self::WorkInProgress(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for ReconcilerError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Unimplemented(error) => Some(error),
            Self::UnsupportedHostCapability(error) => Some(error),
            Self::HostOperation(error) => Some(error),
            Self::InvalidHostTreeUpdateMode(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::FiberRootStore(error) => Some(error),
            Self::HostRootStateStore(error) => Some(error),
            Self::HostFiberToken(error) => Some(error),
            Self::UpdateQueue(error) => Some(error),
            Self::ConcurrentUpdate(error) => Some(error),
            Self::RootUpdate(error) => Some(error),
            Self::RootScheduler(error) => Some(error),
            Self::RootWorkLoop(error) => Some(error),
            Self::RootCommit(error) => Some(error),
            Self::SyncFlush(error) => Some(error),
            Self::WorkInProgress(error) => Some(error),
        }
    }
}

impl From<UnimplementedReactBehavior> for ReconcilerError {
    fn from(error: UnimplementedReactBehavior) -> Self {
        Self::Unimplemented(error)
    }
}

impl From<UnsupportedHostCapability> for ReconcilerError {
    fn from(error: UnsupportedHostCapability) -> Self {
        Self::UnsupportedHostCapability(error)
    }
}

impl From<HostError> for ReconcilerError {
    fn from(error: HostError) -> Self {
        match error {
            HostError::UnsupportedCapability(error) => Self::UnsupportedHostCapability(error),
            HostError::Operation(error) => Self::HostOperation(error),
        }
    }
}

impl From<HostTreeUpdateModeError> for ReconcilerError {
    fn from(error: HostTreeUpdateModeError) -> Self {
        Self::InvalidHostTreeUpdateMode(error)
    }
}

impl From<FiberTopologyError> for ReconcilerError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<FiberRootStoreError> for ReconcilerError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<HostRootStateStoreError> for ReconcilerError {
    fn from(error: HostRootStateStoreError) -> Self {
        Self::HostRootStateStore(error)
    }
}

impl From<HostFiberTokenValidationError> for ReconcilerError {
    fn from(error: HostFiberTokenValidationError) -> Self {
        Self::HostFiberToken(error)
    }
}

impl From<UpdateQueueError> for ReconcilerError {
    fn from(error: UpdateQueueError) -> Self {
        Self::UpdateQueue(error)
    }
}

impl From<ConcurrentUpdateError> for ReconcilerError {
    fn from(error: ConcurrentUpdateError) -> Self {
        Self::ConcurrentUpdate(error)
    }
}

impl From<RootUpdateError> for ReconcilerError {
    fn from(error: RootUpdateError) -> Self {
        Self::RootUpdate(error)
    }
}

impl From<RootSchedulerError> for ReconcilerError {
    fn from(error: RootSchedulerError) -> Self {
        Self::RootScheduler(error)
    }
}

impl From<RootWorkLoopError> for ReconcilerError {
    fn from(error: RootWorkLoopError) -> Self {
        Self::RootWorkLoop(error)
    }
}

impl From<RootCommitError> for ReconcilerError {
    fn from(error: RootCommitError) -> Self {
        Self::RootCommit(error)
    }
}

impl From<SyncFlushError> for ReconcilerError {
    fn from(error: SyncFlushError) -> Self {
        Self::SyncFlush(error)
    }
}

impl From<WorkInProgressError> for ReconcilerError {
    fn from(error: WorkInProgressError) -> Self {
        Self::WorkInProgress(error)
    }
}

pub mod scheduler {
    use fast_react_core::{UnimplementedReactBehavior, unimplemented_behavior};

    pub const STATUS: &str = "scheduler placeholder; no React scheduling semantics yet";

    pub fn schedule_update_placeholder() -> Result<(), UnimplementedReactBehavior> {
        Err(unimplemented_behavior(
            "Reconciler.scheduler.scheduleUpdate",
        ))
    }
}

/// Checks the canonical mutation-renderer contract that the first real
/// reconciler entry point will need before it can build or commit host work.
pub fn validate_mutation_renderer_boundary<H>(host: &H) -> ReconcilerResult<()>
where
    H: MutationRenderer,
{
    match host.capabilities().tree_update_mode() {
        Ok(HostTreeUpdateMode::Mutation) => Ok(()),
        Ok(HostTreeUpdateMode::Persistence) => Err(UnsupportedHostCapability::new(
            host.renderer_name(),
            HostCapability::Mutation,
        )
        .into()),
        Err(HostTreeUpdateModeError::Missing) => Err(UnsupportedHostCapability::new(
            host.renderer_name(),
            HostCapability::Mutation,
        )
        .into()),
        Err(error @ HostTreeUpdateModeError::Conflicting) => Err(error.into()),
    }
}

/// Mutation-renderer placeholder entry point.
///
/// This deliberately stops before fiber reconciliation or host mutations, but
/// it already requires the canonical host-config traits instead of the legacy
/// scaffold shim.
///
/// ```compile_fail
/// use fast_react_host_config::HostConfig;
/// use fast_react_reconciler::render_mutation_placeholder;
///
/// struct LegacyHost;
///
/// impl HostConfig for LegacyHost {
///     type Instance = ();
///     type TextInstance = ();
///
///     fn renderer_name(&self) -> &'static str {
///         "legacy"
///     }
/// }
///
/// let mut host = LegacyHost;
/// let _ = render_mutation_placeholder(&mut host);
/// ```
pub fn render_mutation_placeholder<H>(host: &mut H) -> ReconcilerResult<()>
where
    H: MutationRenderer,
{
    validate_mutation_renderer_boundary(host)?;

    Err(ReconcilerError::unimplemented(
        MUTATION_RENDER_PLACEHOLDER_FEATURE,
    ))
}

/// Compatibility placeholder for scaffold crates that are not in this worker's
/// write scope yet.
pub fn render_placeholder<H: ?Sized>(host: &H) -> Result<(), UnimplementedReactBehavior> {
    let _host = host;
    Err(unimplemented_behavior(RENDER_PLACEHOLDER_FEATURE))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TestRendererHostOutputCanaryError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    HostFiberToken(HostFiberTokenValidationError),
    RootMismatch {
        expected: FiberRootId,
        actual: FiberRootId,
    },
    ExpectedCurrentHostRoot {
        expected: FiberId,
        actual: FiberId,
    },
    ExpectedUnmountRender {
        root: FiberRootId,
        actual: RootElementHandle,
    },
    ExpectedFiberTag {
        fiber: FiberId,
        expected: FiberTag,
        actual: FiberTag,
    },
    EmptyStateNode {
        fiber: FiberId,
        tag: FiberTag,
    },
}

impl Display for TestRendererHostOutputCanaryError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::HostFiberToken(error) => Display::fmt(error, formatter),
            Self::RootMismatch { expected, actual } => write!(
                formatter,
                "test-renderer canary root {} does not match render root {}",
                actual.raw(),
                expected.raw()
            ),
            Self::ExpectedCurrentHostRoot { expected, actual } => write!(
                formatter,
                "test-renderer canary committed HostRoot fiber {} does not match render current fiber {}",
                actual.slot().get(),
                expected.slot().get()
            ),
            Self::ExpectedUnmountRender { root, actual } => write!(
                formatter,
                "test-renderer canary unmount for root {} expected a null root element, found {}",
                root.raw(),
                actual.raw()
            ),
            Self::ExpectedFiberTag {
                fiber,
                expected,
                actual,
            } => write!(
                formatter,
                "test-renderer canary fiber {} must be {:?}, found {:?}",
                fiber.slot().get(),
                expected,
                actual
            ),
            Self::EmptyStateNode { fiber, tag } => write!(
                formatter,
                "test-renderer canary {:?} fiber {} has an empty host state node",
                tag,
                fiber.slot().get()
            ),
        }
    }
}

impl Error for TestRendererHostOutputCanaryError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::HostFiberToken(error) => Some(error),
            Self::RootMismatch { .. }
            | Self::ExpectedCurrentHostRoot { .. }
            | Self::ExpectedUnmountRender { .. }
            | Self::ExpectedFiberTag { .. }
            | Self::EmptyStateNode { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for TestRendererHostOutputCanaryError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for TestRendererHostOutputCanaryError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<HostFiberTokenValidationError> for TestRendererHostOutputCanaryError {
    fn from(error: HostFiberTokenValidationError) -> Self {
        Self::HostFiberToken(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostOutputCanaryFixture {
    element_type_raw: u64,
    component_props_raw: u64,
    text_props_raw: u64,
}

impl TestRendererHostOutputCanaryFixture {
    #[must_use]
    pub const fn new(element_type_raw: u64, component_props_raw: u64, text_props_raw: u64) -> Self {
        Self {
            element_type_raw,
            component_props_raw,
            text_props_raw,
        }
    }

    #[must_use]
    pub const fn element_type_raw(self) -> u64 {
        self.element_type_raw
    }

    #[must_use]
    pub const fn component_props_raw(self) -> u64 {
        self.component_props_raw
    }

    #[must_use]
    pub const fn text_props_raw(self) -> u64 {
        self.text_props_raw
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostOutputCanaryPreparedFibers {
    root: FiberRootId,
    host_root: FiberId,
    component: FiberId,
    text: FiberId,
    render_lanes: Lanes,
    component_token: HostFiberTokenId,
    text_token: HostFiberTokenId,
    fixture: TestRendererHostOutputCanaryFixture,
}

impl TestRendererHostOutputCanaryPreparedFibers {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn component(self) -> FiberId {
        self.component
    }

    #[must_use]
    pub const fn text(self) -> FiberId {
        self.text
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn component_token(self) -> HostFiberTokenId {
        self.component_token
    }

    #[must_use]
    pub const fn text_token(self) -> HostFiberTokenId {
        self.text_token
    }

    #[must_use]
    pub const fn fixture(self) -> TestRendererHostOutputCanaryFixture {
        self.fixture
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostOutputCanaryCompletedFibers {
    prepared: TestRendererHostOutputCanaryPreparedFibers,
    component_state_node_raw: u64,
    text_state_node_raw: u64,
}

impl TestRendererHostOutputCanaryCompletedFibers {
    #[must_use]
    pub const fn prepared(self) -> TestRendererHostOutputCanaryPreparedFibers {
        self.prepared
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.prepared.root()
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.prepared.host_root()
    }

    #[must_use]
    pub const fn component(self) -> FiberId {
        self.prepared.component()
    }

    #[must_use]
    pub const fn text(self) -> FiberId {
        self.prepared.text()
    }

    #[must_use]
    pub const fn component_state_node_raw(self) -> u64 {
        self.component_state_node_raw
    }

    #[must_use]
    pub const fn text_state_node_raw(self) -> u64 {
        self.text_state_node_raw
    }

    #[must_use]
    pub const fn current(self) -> TestRendererHostOutputCanaryCurrentFibers {
        TestRendererHostOutputCanaryCurrentFibers {
            root: self.root(),
            host_root: self.host_root(),
            component: self.component(),
            text: self.text(),
            fixture: self.prepared.fixture(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostOutputCanaryCurrentFibers {
    root: FiberRootId,
    host_root: FiberId,
    component: FiberId,
    text: FiberId,
    fixture: TestRendererHostOutputCanaryFixture,
}

impl TestRendererHostOutputCanaryCurrentFibers {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn component(self) -> FiberId {
        self.component
    }

    #[must_use]
    pub const fn text(self) -> FiberId {
        self.text
    }

    #[must_use]
    pub const fn fixture(self) -> TestRendererHostOutputCanaryFixture {
        self.fixture
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostOutputCanaryUpdatedFibers {
    previous: TestRendererHostOutputCanaryCurrentFibers,
    current: TestRendererHostOutputCanaryCurrentFibers,
    render_lanes: Lanes,
    component_state_node_raw: u64,
    text_state_node_raw: u64,
    component_commit_token: HostFiberTokenId,
    component_props_changed: bool,
    text_props_changed: bool,
}

impl TestRendererHostOutputCanaryUpdatedFibers {
    #[must_use]
    pub const fn previous(self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.previous
    }

    #[must_use]
    pub const fn current(self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.current
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.current.root()
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.current.host_root()
    }

    #[must_use]
    pub const fn component(self) -> FiberId {
        self.current.component()
    }

    #[must_use]
    pub const fn text(self) -> FiberId {
        self.current.text()
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn component_state_node_raw(self) -> u64 {
        self.component_state_node_raw
    }

    #[must_use]
    pub const fn text_state_node_raw(self) -> u64 {
        self.text_state_node_raw
    }

    #[must_use]
    pub const fn component_commit_token(self) -> HostFiberTokenId {
        self.component_commit_token
    }

    #[must_use]
    pub const fn component_props_changed(self) -> bool {
        self.component_props_changed
    }

    #[must_use]
    pub const fn text_props_changed(self) -> bool {
        self.text_props_changed
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostOutputCanaryDeletedFibers {
    current: TestRendererHostOutputCanaryCurrentFibers,
    host_root: FiberId,
    render_lanes: Lanes,
    component_deletion_token: HostFiberTokenId,
}

impl TestRendererHostOutputCanaryDeletedFibers {
    #[must_use]
    pub const fn current(self) -> TestRendererHostOutputCanaryCurrentFibers {
        self.current
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.current.root()
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn deleted_component(self) -> FiberId {
        self.current.component()
    }

    #[must_use]
    pub const fn deleted_text(self) -> FiberId {
        self.current.text()
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn component_deletion_token(self) -> HostFiberTokenId {
        self.component_deletion_token
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TestRendererHostOutputCanaryMutationKind {
    Placement,
    Update,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestRendererHostOutputCanaryMutationRecord {
    root: FiberRootId,
    host_root: FiberId,
    fiber: FiberId,
    tag: FiberTag,
    kind: TestRendererHostOutputCanaryMutationKind,
    state_node_raw: u64,
    pending_props_raw: u64,
    memoized_props_raw: u64,
    alternate_memoized_props_raw: Option<u64>,
}

impl TestRendererHostOutputCanaryMutationRecord {
    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn kind(self) -> TestRendererHostOutputCanaryMutationKind {
        self.kind
    }

    #[must_use]
    pub const fn state_node_raw(self) -> u64 {
        self.state_node_raw
    }

    #[must_use]
    pub const fn pending_props_raw(self) -> u64 {
        self.pending_props_raw
    }

    #[must_use]
    pub const fn memoized_props_raw(self) -> u64 {
        self.memoized_props_raw
    }

    #[must_use]
    pub const fn alternate_memoized_props_raw(self) -> Option<u64> {
        self.alternate_memoized_props_raw
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererHostOutputCanaryDeletionListRecord {
    parent: FiberId,
    deleted: Vec<FiberId>,
}

impl TestRendererHostOutputCanaryDeletionListRecord {
    #[must_use]
    pub const fn parent(&self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub fn deleted(&self) -> &[FiberId] {
        &self.deleted
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestRendererHostOutputCanaryCommitDiagnostics {
    mutation_records: Vec<TestRendererHostOutputCanaryMutationRecord>,
    deletion_lists: Vec<TestRendererHostOutputCanaryDeletionListRecord>,
}

impl TestRendererHostOutputCanaryCommitDiagnostics {
    #[must_use]
    pub fn mutation_records(&self) -> &[TestRendererHostOutputCanaryMutationRecord] {
        &self.mutation_records
    }

    #[must_use]
    pub fn deletion_lists(&self) -> &[TestRendererHostOutputCanaryDeletionListRecord] {
        &self.deletion_lists
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.mutation_records.is_empty() && self.deletion_lists.is_empty()
    }
}

pub fn inspect_test_renderer_host_output_canary_commit(
    commit: &HostRootCommitRecord,
) -> TestRendererHostOutputCanaryCommitDiagnostics {
    let mutation_records = commit
        .mutation_log()
        .records()
        .iter()
        .map(|record| TestRendererHostOutputCanaryMutationRecord {
            root: record.root(),
            host_root: record.host_root(),
            fiber: record.fiber(),
            tag: record.tag(),
            kind: match record.kind() {
                root_commit::HostRootMutationPhaseRecordKind::Placement => {
                    TestRendererHostOutputCanaryMutationKind::Placement
                }
                root_commit::HostRootMutationPhaseRecordKind::Update => {
                    TestRendererHostOutputCanaryMutationKind::Update
                }
            },
            state_node_raw: record.state_node().raw(),
            pending_props_raw: record.pending_props().raw(),
            memoized_props_raw: record.memoized_props().raw(),
            alternate_memoized_props_raw: record
                .alternate_memoized_props()
                .map(|props| props.raw()),
        })
        .collect();
    let deletion_lists = commit
        .deletion_lists()
        .iter()
        .map(|record| TestRendererHostOutputCanaryDeletionListRecord {
            parent: record.parent(),
            deleted: record.deleted().to_vec(),
        })
        .collect();

    TestRendererHostOutputCanaryCommitDiagnostics {
        mutation_records,
        deletion_lists,
    }
}

pub fn prepare_test_renderer_host_output_canary_fibers<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    fixture: TestRendererHostOutputCanaryFixture,
) -> Result<TestRendererHostOutputCanaryPreparedFibers, TestRendererHostOutputCanaryError> {
    expect_test_renderer_host_output_canary_tag(
        store,
        render.work_in_progress(),
        FiberTag::HostRoot,
    )?;

    let mode = store.fiber_arena().get(render.work_in_progress())?.mode();
    let component = store.fiber_arena_mut().create_fiber(
        FiberTag::HostComponent,
        None,
        PropsHandle::from_raw(fixture.component_props_raw()),
        mode,
    );
    {
        let node = store.fiber_arena_mut().get_mut(component)?;
        node.set_element_type(ElementTypeHandle::from_raw(fixture.element_type_raw()));
        node.merge_flags(FiberFlags::PLACEMENT);
    }

    let text = store.fiber_arena_mut().create_fiber(
        FiberTag::HostText,
        None,
        PropsHandle::from_raw(fixture.text_props_raw()),
        mode,
    );
    store.fiber_arena_mut().set_children(component, &[text])?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[component])?;

    let text_token = store.host_tokens_mut().issue(
        render.root(),
        text,
        HostFiberTokenPhase::Creation,
        HostFiberTokenTarget::TextInstance,
    );
    store.host_tokens().validate(
        text_token,
        render.root(),
        text,
        HostFiberTokenPhase::Creation,
        HostFiberTokenTarget::TextInstance,
    )?;
    let component_token = store.host_tokens_mut().issue(
        render.root(),
        component,
        HostFiberTokenPhase::Creation,
        HostFiberTokenTarget::Instance,
    );
    store.host_tokens().validate(
        component_token,
        render.root(),
        component,
        HostFiberTokenPhase::Creation,
        HostFiberTokenTarget::Instance,
    )?;

    Ok(TestRendererHostOutputCanaryPreparedFibers {
        root: render.root(),
        host_root: render.work_in_progress(),
        component,
        text,
        render_lanes: render.render_lanes(),
        component_token,
        text_token,
        fixture,
    })
}

pub fn finish_test_renderer_host_output_canary_fibers<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    prepared: TestRendererHostOutputCanaryPreparedFibers,
    component_state_node_raw: u64,
    text_state_node_raw: u64,
) -> Result<TestRendererHostOutputCanaryCompletedFibers, TestRendererHostOutputCanaryError> {
    expect_test_renderer_host_output_canary_tag(store, prepared.host_root(), FiberTag::HostRoot)?;
    expect_test_renderer_host_output_canary_tag(
        store,
        prepared.component(),
        FiberTag::HostComponent,
    )?;
    expect_test_renderer_host_output_canary_tag(store, prepared.text(), FiberTag::HostText)?;

    complete_test_renderer_host_output_canary_fiber(
        store,
        prepared.text(),
        FiberTag::HostText,
        prepared.fixture().text_props_raw(),
        text_state_node_raw,
    )?;
    complete_test_renderer_host_output_canary_fiber(
        store,
        prepared.component(),
        FiberTag::HostComponent,
        prepared.fixture().component_props_raw(),
        component_state_node_raw,
    )?;

    let bubbled = bubble_properties(store.fiber_arena(), prepared.host_root())?;
    let host_root = store.fiber_arena_mut().get_mut(prepared.host_root())?;
    host_root.set_child_lanes(bubbled.child_lanes());
    host_root.set_subtree_flags(bubbled.subtree_flags());

    Ok(TestRendererHostOutputCanaryCompletedFibers {
        prepared,
        component_state_node_raw,
        text_state_node_raw,
    })
}

pub fn prepare_test_renderer_host_output_update_canary_fibers<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    current: TestRendererHostOutputCanaryCurrentFibers,
    next_fixture: TestRendererHostOutputCanaryFixture,
    component_state_node_raw: u64,
    text_state_node_raw: u64,
) -> Result<TestRendererHostOutputCanaryUpdatedFibers, TestRendererHostOutputCanaryError> {
    validate_test_renderer_host_output_canary_current(store, render, current)?;

    let component_props_changed = current.fixture().component_props_raw()
        != next_fixture.component_props_raw()
        || current.fixture().element_type_raw() != next_fixture.element_type_raw();
    let text_props_changed = current.fixture().text_props_raw() != next_fixture.text_props_raw();
    let component = store.fiber_arena_mut().create_work_in_progress(
        current.component(),
        PropsHandle::from_raw(next_fixture.component_props_raw()),
    )?;
    {
        let node = store.fiber_arena_mut().get_mut(component)?;
        node.set_element_type(ElementTypeHandle::from_raw(next_fixture.element_type_raw()));
        node.set_state_node(StateNodeHandle::from_raw(component_state_node_raw));
        node.set_memoized_props(PropsHandle::from_raw(next_fixture.component_props_raw()));
        node.set_lanes(Lanes::NO);
        if component_props_changed {
            node.merge_flags(FiberFlags::UPDATE);
        }
    }

    let text = store.fiber_arena_mut().create_work_in_progress(
        current.text(),
        PropsHandle::from_raw(next_fixture.text_props_raw()),
    )?;
    {
        let node = store.fiber_arena_mut().get_mut(text)?;
        node.set_state_node(StateNodeHandle::from_raw(text_state_node_raw));
        node.set_memoized_props(PropsHandle::from_raw(next_fixture.text_props_raw()));
        node.set_lanes(Lanes::NO);
        if text_props_changed {
            node.merge_flags(FiberFlags::UPDATE);
        }
    }

    store.fiber_arena_mut().set_children(component, &[text])?;
    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[component])?;
    refresh_test_renderer_host_output_canary_bubbled_flags(store, text)?;
    refresh_test_renderer_host_output_canary_bubbled_flags(store, component)?;
    refresh_test_renderer_host_output_canary_bubbled_flags(store, render.work_in_progress())?;

    let component_commit_token = store.host_tokens_mut().issue(
        render.root(),
        component,
        HostFiberTokenPhase::Commit,
        HostFiberTokenTarget::Instance,
    );
    store.host_tokens().validate(
        component_commit_token,
        render.root(),
        component,
        HostFiberTokenPhase::Commit,
        HostFiberTokenTarget::Instance,
    )?;

    let next = TestRendererHostOutputCanaryCurrentFibers {
        root: render.root(),
        host_root: render.work_in_progress(),
        component,
        text,
        fixture: next_fixture,
    };

    Ok(TestRendererHostOutputCanaryUpdatedFibers {
        previous: current,
        current: next,
        render_lanes: render.render_lanes(),
        component_state_node_raw,
        text_state_node_raw,
        component_commit_token,
        component_props_changed,
        text_props_changed,
    })
}

pub fn prepare_test_renderer_host_output_unmount_canary_fibers<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    current: TestRendererHostOutputCanaryCurrentFibers,
) -> Result<TestRendererHostOutputCanaryDeletedFibers, TestRendererHostOutputCanaryError> {
    validate_test_renderer_host_output_canary_current(store, render, current)?;
    if render.resulting_element().is_some() {
        return Err(TestRendererHostOutputCanaryError::ExpectedUnmountRender {
            root: render.root(),
            actual: render.resulting_element(),
        });
    }

    store
        .fiber_arena_mut()
        .set_children(render.work_in_progress(), &[])?;
    store
        .fiber_arena_mut()
        .mark_child_for_deletion(render.work_in_progress(), current.component())?;
    refresh_test_renderer_host_output_canary_bubbled_flags(store, render.work_in_progress())?;

    let component_deletion_token = store.host_tokens_mut().issue(
        render.root(),
        current.component(),
        HostFiberTokenPhase::Deletion,
        HostFiberTokenTarget::Instance,
    );
    store.host_tokens().validate(
        component_deletion_token,
        render.root(),
        current.component(),
        HostFiberTokenPhase::Deletion,
        HostFiberTokenTarget::Instance,
    )?;

    Ok(TestRendererHostOutputCanaryDeletedFibers {
        current,
        host_root: render.work_in_progress(),
        render_lanes: render.render_lanes(),
        component_deletion_token,
    })
}

fn complete_test_renderer_host_output_canary_fiber<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    fiber: FiberId,
    tag: FiberTag,
    props_raw: u64,
    state_node_raw: u64,
) -> Result<(), TestRendererHostOutputCanaryError> {
    if state_node_raw == StateNodeHandle::NONE.raw() {
        return Err(TestRendererHostOutputCanaryError::EmptyStateNode { fiber, tag });
    }

    let state_node = StateNodeHandle::from_raw(state_node_raw);
    let props = PropsHandle::from_raw(props_raw);
    let bubbled = bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_state_node(state_node);
    node.set_memoized_props(props);
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    Ok(())
}

fn validate_test_renderer_host_output_canary_current<H: HostTypes>(
    store: &FiberRootStore<H>,
    render: HostRootRenderPhaseRecord,
    current: TestRendererHostOutputCanaryCurrentFibers,
) -> Result<(), TestRendererHostOutputCanaryError> {
    expect_test_renderer_host_output_canary_tag(
        store,
        render.work_in_progress(),
        FiberTag::HostRoot,
    )?;
    if current.root() != render.root() {
        return Err(TestRendererHostOutputCanaryError::RootMismatch {
            expected: current.root(),
            actual: render.root(),
        });
    }
    if current.host_root() != render.current() {
        return Err(TestRendererHostOutputCanaryError::ExpectedCurrentHostRoot {
            expected: render.current(),
            actual: current.host_root(),
        });
    }
    expect_test_renderer_host_output_canary_tag(store, current.host_root(), FiberTag::HostRoot)?;
    expect_test_renderer_host_output_canary_tag(
        store,
        current.component(),
        FiberTag::HostComponent,
    )?;
    expect_test_renderer_host_output_canary_tag(store, current.text(), FiberTag::HostText)?;
    Ok(())
}

fn refresh_test_renderer_host_output_canary_bubbled_flags<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    fiber: FiberId,
) -> Result<(), TestRendererHostOutputCanaryError> {
    let bubbled = bubble_properties(store.fiber_arena(), fiber)?;
    let node = store.fiber_arena_mut().get_mut(fiber)?;
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());
    Ok(())
}

fn expect_test_renderer_host_output_canary_tag<H: HostTypes>(
    store: &FiberRootStore<H>,
    fiber: FiberId,
    expected: FiberTag,
) -> Result<(), TestRendererHostOutputCanaryError> {
    let actual = store.fiber_arena().get(fiber)?.tag();
    if actual == expected {
        Ok(())
    } else {
        Err(TestRendererHostOutputCanaryError::ExpectedFiberTag {
            fiber,
            expected,
            actual,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use fast_react_host_config::{
        HostCapabilitySet, HostChild, HostCommit, HostCreation, HostFiberTokenRef,
        HostIdentityAndContext, HostResult, HostTypes, InitialChildrenFinalization, MutationHost,
    };

    struct LegacyPlaceholderHost;

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    enum BoundaryMode {
        MutationOnly,
        MissingMutationCapability,
        PersistenceOnly,
        ConflictingTreeUpdateModes,
    }

    struct CanonicalMutationHost {
        mode: BoundaryMode,
    }

    impl CanonicalMutationHost {
        const fn new(mode: BoundaryMode) -> Self {
            Self { mode }
        }
    }

    impl HostTypes for CanonicalMutationHost {
        type HostFiberToken = u64;
        type Type = &'static str;
        type Props = ();
        type Container = ();
        type Instance = ();
        type TextInstance = ();
        type PublicInstance = ();
        type HostContext = ();
        type UpdatePayload = ();
        type TimeoutHandle = ();
        type NoTimeout = ();
        type CommitState = ();
        type EventPriority = ();
        type EventType = ();
        type EventTimestamp = ();
        type ActivityInstance = ();
        type SuspenseInstance = ();
        type HydratableInstance = ();
        type FormInstance = ();
        type ChildSet = ();
        type Resource = ();
        type HoistableRoot = ();
        type TransitionStatus = ();
        type SuspendedState = ();
        type RunningViewTransition = ();
        type ViewTransitionInstance = ();
        type InstanceMeasurement = ();
        type EventResponder = ();
        type GestureTimeline = ();
        type FragmentInstance = ();
        type RendererInspectionConfig = ();
    }

    impl HostIdentityAndContext for CanonicalMutationHost {
        fn renderer_name(&self) -> &'static str {
            "canonical-mutation-test-host"
        }

        fn capabilities(&self) -> HostCapabilitySet {
            match self.mode {
                BoundaryMode::MutationOnly => {
                    HostCapabilitySet::empty().with(HostCapability::Mutation)
                }
                BoundaryMode::MissingMutationCapability => HostCapabilitySet::empty(),
                BoundaryMode::PersistenceOnly => {
                    HostCapabilitySet::empty().with(HostCapability::Persistence)
                }
                BoundaryMode::ConflictingTreeUpdateModes => HostCapabilitySet::empty()
                    .with(HostCapability::Mutation)
                    .with(HostCapability::Persistence),
            }
        }

        fn get_public_instance(
            &self,
            instance: &Self::Instance,
        ) -> HostResult<Self::PublicInstance> {
            let _instance = instance;
            Ok(())
        }

        fn root_host_context(&self, container: &Self::Container) -> HostResult<Self::HostContext> {
            let _container = container;
            Ok(())
        }

        fn child_host_context(
            &self,
            parent_context: &Self::HostContext,
            _ty: &Self::Type,
            _props: &Self::Props,
        ) -> HostResult<Self::HostContext> {
            let _parent_context = parent_context;
            Ok(())
        }
    }

    impl HostCreation for CanonicalMutationHost {
        fn should_set_text_content(
            &self,
            _ty: &Self::Type,
            _props: &Self::Props,
            _context: &Self::HostContext,
        ) -> bool {
            false
        }

        fn create_instance(
            &mut self,
            _token: HostFiberTokenRef<'_, Self>,
            _ty: &Self::Type,
            _props: &Self::Props,
            _container: &Self::Container,
            _context: &Self::HostContext,
        ) -> HostResult<Self::Instance> {
            Ok(())
        }

        fn create_text_instance(
            &mut self,
            _token: HostFiberTokenRef<'_, Self>,
            _text: &str,
            _container: &Self::Container,
            _context: &Self::HostContext,
        ) -> HostResult<Self::TextInstance> {
            Ok(())
        }

        fn append_initial_child(
            &mut self,
            _parent: &mut Self::Instance,
            _child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            Ok(())
        }

        fn finalize_initial_children(
            &mut self,
            _instance: &mut Self::Instance,
            _ty: &Self::Type,
            _props: &Self::Props,
            _container: &Self::Container,
            _context: &Self::HostContext,
        ) -> HostResult<InitialChildrenFinalization> {
            Ok(InitialChildrenFinalization::NoCommitMount)
        }

        fn clone_mutable_instance(
            &mut self,
            _instance: &Self::Instance,
            _update_payload: Option<&Self::UpdatePayload>,
        ) -> HostResult<Self::Instance> {
            Ok(())
        }

        fn clone_mutable_text_instance(
            &mut self,
            _text_instance: &Self::TextInstance,
        ) -> HostResult<Self::TextInstance> {
            Ok(())
        }
    }

    impl HostCommit for CanonicalMutationHost {
        fn prepare_for_commit(
            &mut self,
            _container: &Self::Container,
        ) -> HostResult<Self::CommitState> {
            Ok(())
        }

        fn reset_after_commit(
            &mut self,
            _container: &Self::Container,
            _commit_state: Self::CommitState,
        ) -> HostResult<()> {
            Ok(())
        }

        fn commit_mount(
            &mut self,
            _token: HostFiberTokenRef<'_, Self>,
            _instance: &mut Self::Instance,
            _ty: &Self::Type,
            _props: &Self::Props,
        ) -> HostResult<()> {
            Ok(())
        }

        fn commit_update(
            &mut self,
            _token: HostFiberTokenRef<'_, Self>,
            _instance: &mut Self::Instance,
            _update_payload: Self::UpdatePayload,
            _ty: &Self::Type,
            _old_props: &Self::Props,
            _new_props: &Self::Props,
        ) -> HostResult<()> {
            Ok(())
        }

        fn commit_text_update(
            &mut self,
            _text_instance: &mut Self::TextInstance,
            _old_text: &str,
            _new_text: &str,
        ) -> HostResult<()> {
            Ok(())
        }

        fn reset_text_content(&mut self, _instance: &mut Self::Instance) -> HostResult<()> {
            Ok(())
        }

        fn hide_instance(&mut self, _instance: &mut Self::Instance) -> HostResult<()> {
            Ok(())
        }

        fn unhide_instance(
            &mut self,
            _instance: &mut Self::Instance,
            _props: &Self::Props,
        ) -> HostResult<()> {
            Ok(())
        }

        fn hide_text_instance(
            &mut self,
            _text_instance: &mut Self::TextInstance,
        ) -> HostResult<()> {
            Ok(())
        }

        fn unhide_text_instance(
            &mut self,
            _text_instance: &mut Self::TextInstance,
            _text: &str,
        ) -> HostResult<()> {
            Ok(())
        }

        fn detach_deleted_instance(
            &mut self,
            _token: HostFiberTokenRef<'_, Self>,
            _instance: Self::Instance,
        ) -> HostResult<()> {
            Ok(())
        }
    }

    impl MutationHost for CanonicalMutationHost {
        fn append_child(
            &mut self,
            _parent: &mut Self::Instance,
            _child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            Ok(())
        }

        fn append_child_to_container(
            &mut self,
            _container: &mut Self::Container,
            _child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            Ok(())
        }

        fn insert_before(
            &mut self,
            _parent: &mut Self::Instance,
            _child: HostChild<'_, Self>,
            _before_child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            Ok(())
        }

        fn insert_in_container_before(
            &mut self,
            _container: &mut Self::Container,
            _child: HostChild<'_, Self>,
            _before_child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            Ok(())
        }

        fn remove_child(
            &mut self,
            _parent: &mut Self::Instance,
            _child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            Ok(())
        }

        fn remove_child_from_container(
            &mut self,
            _container: &mut Self::Container,
            _child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            Ok(())
        }

        fn clear_container(&mut self, _container: &mut Self::Container) -> HostResult<()> {
            Ok(())
        }
    }

    #[test]
    fn legacy_render_placeholder_is_explicitly_unimplemented() {
        let host = LegacyPlaceholderHost;
        let error = render_placeholder(&host).unwrap_err();
        assert_eq!(error.feature(), RENDER_PLACEHOLDER_FEATURE);
    }

    #[test]
    fn mutation_render_entrypoint_uses_canonical_trait_bounds() {
        let mut host = CanonicalMutationHost::new(BoundaryMode::MutationOnly);
        let error = render_mutation_placeholder(&mut host).unwrap_err();

        assert_eq!(
            error,
            ReconcilerError::unimplemented(MUTATION_RENDER_PLACEHOLDER_FEATURE)
        );
    }

    #[test]
    fn mutation_boundary_rejects_missing_capability() {
        let host = CanonicalMutationHost::new(BoundaryMode::MissingMutationCapability);
        let error = validate_mutation_renderer_boundary(&host).unwrap_err();

        let ReconcilerError::UnsupportedHostCapability(error) = error else {
            panic!("expected unsupported mutation capability");
        };
        assert_eq!(error.renderer_name(), "canonical-mutation-test-host");
        assert_eq!(error.capability(), HostCapability::Mutation);
    }

    #[test]
    fn mutation_boundary_rejects_persistence_only_capability() {
        let host = CanonicalMutationHost::new(BoundaryMode::PersistenceOnly);
        let error = validate_mutation_renderer_boundary(&host).unwrap_err();

        let ReconcilerError::UnsupportedHostCapability(error) = error else {
            panic!("expected unsupported mutation capability");
        };
        assert_eq!(error.renderer_name(), "canonical-mutation-test-host");
        assert_eq!(error.capability(), HostCapability::Mutation);
    }

    #[test]
    fn mutation_boundary_rejects_conflicting_tree_update_modes() {
        let host = CanonicalMutationHost::new(BoundaryMode::ConflictingTreeUpdateModes);
        let error = validate_mutation_renderer_boundary(&host).unwrap_err();

        assert_eq!(
            error,
            ReconcilerError::InvalidHostTreeUpdateMode(HostTreeUpdateModeError::Conflicting)
        );
    }

    #[test]
    fn host_error_conversion_preserves_operation_errors() {
        let error: HostError = HostOperationError::invalid_handle(
            "canonical-mutation-test-host",
            fast_react_host_config::HostHandleKind::Instance,
        )
        .into();

        let ReconcilerError::HostOperation(operation) = ReconcilerError::from(error) else {
            panic!("expected host operation error");
        };
        assert_eq!(operation.renderer_name(), "canonical-mutation-test-host");
    }

    #[test]
    fn scheduler_stays_internal_placeholder() {
        assert!(scheduler::STATUS.contains("placeholder"));
        let error = scheduler::schedule_update_placeholder().unwrap_err();
        assert_eq!(error.feature(), "Reconciler.scheduler.scheduleUpdate");
    }
}
