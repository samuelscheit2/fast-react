//! FiberRoot records and HostRoot current-fiber initialization.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    FiberArena, FiberId, FiberMode, FiberTag, FiberTopologyError, Lane, Lanes, PropsHandle,
    RootLaneState, StateHandle, StateNodeHandle,
};
use fast_react_host_config::HostTypes;

use crate::root_config::{
    HydrationBoundaryHandle, HydrationBoundaryKind, HydrationErrorQueueHandle,
    HydrationTreeContextHandle,
};
use crate::{
    FiberRootId, PendingChildrenHandle, PendingCommitCancelHandle, PendingCommitHandle,
    PendingPassiveState, RootCacheHandle, RootCallbackPriority, RootContextHandle,
    RootElementHandle, RootFormStateHandle, RootKind, RootLifecycleState, RootOptions,
    RootRenderExitStatus, RootSchedulerCallbackHandle, RootSuspenseBoundarySetHandle, RootTag,
    RootTransitionCallbacksHandle, RootWorkStatus, UnsupportedHydrationKind,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HostRootHydrationState {
    NotHydrated,
    ReservedUnsupported(UnsupportedHydrationKind),
}

impl HostRootHydrationState {
    #[must_use]
    pub const fn is_dehydrated(self) -> bool {
        matches!(self, Self::ReservedUnsupported(_))
    }

    #[must_use]
    pub const fn unsupported_kind(self) -> Option<UnsupportedHydrationKind> {
        match self {
            Self::NotHydrated => None,
            Self::ReservedUnsupported(kind) => Some(kind),
        }
    }
}

#[allow(
    dead_code,
    reason = "reserved for fail-closed hydration boundary state"
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReservedHydrationBoundaryState {
    kind: HydrationBoundaryKind,
    dehydrated: HydrationBoundaryHandle,
    tree_context: HydrationTreeContextHandle,
    retry_lane: Lane,
    hydration_errors: HydrationErrorQueueHandle,
    dehydrated_fragment: Option<FiberId>,
    unsupported_kind: UnsupportedHydrationKind,
}

#[allow(
    dead_code,
    reason = "reserved for fail-closed hydration boundary state"
)]
impl ReservedHydrationBoundaryState {
    #[must_use]
    pub const fn new(
        kind: HydrationBoundaryKind,
        dehydrated: HydrationBoundaryHandle,
        tree_context: HydrationTreeContextHandle,
        retry_lane: Lane,
        hydration_errors: HydrationErrorQueueHandle,
        dehydrated_fragment: Option<FiberId>,
        unsupported_kind: UnsupportedHydrationKind,
    ) -> Self {
        Self {
            kind,
            dehydrated,
            tree_context,
            retry_lane,
            hydration_errors,
            dehydrated_fragment,
            unsupported_kind,
        }
    }

    #[must_use]
    pub const fn reserved_unsupported(
        kind: HydrationBoundaryKind,
        dehydrated: HydrationBoundaryHandle,
    ) -> Self {
        Self::new(
            kind,
            dehydrated,
            HydrationTreeContextHandle::NONE,
            Lane::OFFSCREEN,
            HydrationErrorQueueHandle::NONE,
            None,
            UnsupportedHydrationKind::HydrationRoot,
        )
    }

    #[must_use]
    pub const fn kind(self) -> HydrationBoundaryKind {
        self.kind
    }

    #[must_use]
    pub const fn dehydrated(self) -> HydrationBoundaryHandle {
        self.dehydrated
    }

    #[must_use]
    pub const fn tree_context(self) -> HydrationTreeContextHandle {
        self.tree_context
    }

    #[must_use]
    pub const fn retry_lane(self) -> Lane {
        self.retry_lane
    }

    #[must_use]
    pub const fn hydration_errors(self) -> HydrationErrorQueueHandle {
        self.hydration_errors
    }

    #[must_use]
    pub const fn dehydrated_fragment(self) -> Option<FiberId> {
        self.dehydrated_fragment
    }

    #[must_use]
    pub const fn unsupported_kind(self) -> UnsupportedHydrationKind {
        self.unsupported_kind
    }
}

#[allow(
    dead_code,
    reason = "reserved for fail-closed hydration boundary state"
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HydrationBoundaryState {
    ReservedUnsupported(ReservedHydrationBoundaryState),
}

#[allow(
    dead_code,
    reason = "reserved for fail-closed hydration boundary state"
)]
impl HydrationBoundaryState {
    #[must_use]
    pub const fn reserved_unsupported(
        kind: HydrationBoundaryKind,
        dehydrated: HydrationBoundaryHandle,
    ) -> Self {
        Self::ReservedUnsupported(ReservedHydrationBoundaryState::reserved_unsupported(
            kind, dehydrated,
        ))
    }

    #[must_use]
    pub const fn reserved_unsupported_activity(dehydrated: HydrationBoundaryHandle) -> Self {
        Self::reserved_unsupported(HydrationBoundaryKind::Activity, dehydrated)
    }

    #[must_use]
    pub const fn reserved_unsupported_suspense(dehydrated: HydrationBoundaryHandle) -> Self {
        Self::reserved_unsupported(HydrationBoundaryKind::Suspense, dehydrated)
    }

    #[must_use]
    pub const fn is_reserved_unsupported(self) -> bool {
        matches!(self, Self::ReservedUnsupported(_))
    }

    #[must_use]
    pub const fn kind(self) -> HydrationBoundaryKind {
        match self {
            Self::ReservedUnsupported(state) => state.kind(),
        }
    }

    #[must_use]
    pub const fn dehydrated(self) -> HydrationBoundaryHandle {
        match self {
            Self::ReservedUnsupported(state) => state.dehydrated(),
        }
    }

    #[must_use]
    pub const fn tree_context(self) -> HydrationTreeContextHandle {
        match self {
            Self::ReservedUnsupported(state) => state.tree_context(),
        }
    }

    #[must_use]
    pub const fn retry_lane(self) -> Lane {
        match self {
            Self::ReservedUnsupported(state) => state.retry_lane(),
        }
    }

    #[must_use]
    pub const fn hydration_errors(self) -> HydrationErrorQueueHandle {
        match self {
            Self::ReservedUnsupported(state) => state.hydration_errors(),
        }
    }

    #[must_use]
    pub const fn dehydrated_fragment(self) -> Option<FiberId> {
        match self {
            Self::ReservedUnsupported(state) => state.dehydrated_fragment(),
        }
    }

    #[must_use]
    pub const fn unsupported_kind(self) -> UnsupportedHydrationKind {
        match self {
            Self::ReservedUnsupported(state) => state.unsupported_kind(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostRootState {
    element: RootElementHandle,
    is_dehydrated: bool,
    hydration: HostRootHydrationState,
    cache: RootCacheHandle,
    form_state: RootFormStateHandle,
    pending_suspense_boundaries: RootSuspenseBoundarySetHandle,
}

impl HostRootState {
    #[must_use]
    pub const fn client(element: RootElementHandle, form_state: RootFormStateHandle) -> Self {
        Self {
            element,
            is_dehydrated: false,
            hydration: HostRootHydrationState::NotHydrated,
            cache: RootCacheHandle::NONE,
            form_state,
            pending_suspense_boundaries: RootSuspenseBoundarySetHandle::NONE,
        }
    }

    #[must_use]
    pub const fn reserved_unsupported_hydration(
        element: RootElementHandle,
        form_state: RootFormStateHandle,
        kind: UnsupportedHydrationKind,
    ) -> Self {
        Self {
            element,
            is_dehydrated: true,
            hydration: HostRootHydrationState::ReservedUnsupported(kind),
            cache: RootCacheHandle::NONE,
            form_state,
            pending_suspense_boundaries: RootSuspenseBoundarySetHandle::NONE,
        }
    }

    #[must_use]
    pub const fn element(self) -> RootElementHandle {
        self.element
    }

    #[must_use]
    pub const fn with_element(mut self, element: RootElementHandle) -> Self {
        self.element = element;
        self
    }

    #[must_use]
    pub const fn is_dehydrated(self) -> bool {
        self.is_dehydrated
    }

    #[must_use]
    pub const fn hydration(self) -> HostRootHydrationState {
        self.hydration
    }

    #[must_use]
    pub const fn cache(self) -> RootCacheHandle {
        self.cache
    }

    #[must_use]
    pub const fn form_state(self) -> RootFormStateHandle {
        self.form_state
    }

    #[must_use]
    pub const fn pending_suspense_boundaries(self) -> RootSuspenseBoundarySetHandle {
        self.pending_suspense_boundaries
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HostRootStateStoreError {
    EmptyHandle,
    InvalidHandle { handle: StateHandle },
}

impl Display for HostRootStateStoreError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyHandle => formatter.write_str("host root state handle is empty"),
            Self::InvalidHandle { handle } => {
                write!(
                    formatter,
                    "host root state handle {} is invalid",
                    handle.raw()
                )
            }
        }
    }
}

impl Error for HostRootStateStoreError {}

#[derive(Debug, Default, Clone)]
pub struct HostRootStateStore {
    states: Vec<HostRootState>,
}

impl HostRootStateStore {
    #[must_use]
    pub const fn new() -> Self {
        Self { states: Vec::new() }
    }

    pub fn insert(&mut self, state: HostRootState) -> StateHandle {
        let raw = self.states.len() as u64 + 1;
        self.states.push(state);
        StateHandle::from_raw(raw)
    }

    pub fn get(&self, handle: StateHandle) -> Result<&HostRootState, HostRootStateStoreError> {
        if handle.is_none() {
            return Err(HostRootStateStoreError::EmptyHandle);
        }

        self.states
            .get((handle.raw() - 1) as usize)
            .ok_or(HostRootStateStoreError::InvalidHandle { handle })
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.states.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.states.is_empty()
    }
}

pub struct RootSchedulingState<H: HostTypes> {
    next_scheduled_root: Option<FiberRootId>,
    callback_node: RootSchedulerCallbackHandle,
    callback_priority: RootCallbackPriority,
    timeout_handle: Option<H::TimeoutHandle>,
    cancel_pending_commit: PendingCommitCancelHandle,
    work_in_progress: Option<FiberId>,
    work_in_progress_root_render_lanes: Lanes,
    render_exit_status: RootRenderExitStatus,
    pending_passive: PendingPassiveState,
}

impl<H: HostTypes> RootSchedulingState<H> {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            next_scheduled_root: None,
            callback_node: RootSchedulerCallbackHandle::NONE,
            callback_priority: RootCallbackPriority::NO,
            timeout_handle: None,
            cancel_pending_commit: PendingCommitCancelHandle::NONE,
            work_in_progress: None,
            work_in_progress_root_render_lanes: Lanes::NO,
            render_exit_status: RootRenderExitStatus::NoWork,
            pending_passive: PendingPassiveState::NONE,
        }
    }

    #[must_use]
    pub const fn next_scheduled_root(&self) -> Option<FiberRootId> {
        self.next_scheduled_root
    }

    pub(crate) fn set_next_scheduled_root(&mut self, root: Option<FiberRootId>) {
        self.next_scheduled_root = root;
    }

    #[must_use]
    pub const fn callback_node(&self) -> RootSchedulerCallbackHandle {
        self.callback_node
    }

    #[must_use]
    pub const fn callback_priority(&self) -> RootCallbackPriority {
        self.callback_priority
    }

    pub(crate) fn set_callback(
        &mut self,
        node: RootSchedulerCallbackHandle,
        priority: RootCallbackPriority,
    ) {
        self.callback_node = node;
        self.callback_priority = priority;
    }

    pub(crate) fn clear_callback(&mut self) {
        self.callback_node = RootSchedulerCallbackHandle::NONE;
        self.callback_priority = RootCallbackPriority::NO;
    }

    #[must_use]
    pub fn timeout_handle(&self) -> Option<&H::TimeoutHandle> {
        self.timeout_handle.as_ref()
    }

    #[must_use]
    pub const fn cancel_pending_commit(&self) -> PendingCommitCancelHandle {
        self.cancel_pending_commit
    }

    #[must_use]
    pub const fn work_in_progress(&self) -> Option<FiberId> {
        self.work_in_progress
    }

    #[must_use]
    pub const fn work_in_progress_root_render_lanes(&self) -> Lanes {
        self.work_in_progress_root_render_lanes
    }

    #[must_use]
    pub const fn render_exit_status(&self) -> RootRenderExitStatus {
        self.render_exit_status
    }

    #[must_use]
    pub const fn pending_passive(&self) -> &PendingPassiveState {
        &self.pending_passive
    }

    pub fn pending_passive_mut(&mut self) -> &mut PendingPassiveState {
        &mut self.pending_passive
    }

    pub fn prepare_pending_passive(&mut self, root: FiberRootId, lanes: Lanes) {
        self.pending_passive = PendingPassiveState::new(Some(root), lanes);
    }

    pub fn clear_pending_passive(&mut self) {
        self.pending_passive = PendingPassiveState::NONE;
    }

    pub(crate) fn record_render_phase_work(
        &mut self,
        work_in_progress: FiberId,
        render_lanes: Lanes,
        render_exit_status: RootRenderExitStatus,
    ) {
        self.work_in_progress = Some(work_in_progress);
        self.work_in_progress_root_render_lanes = render_lanes;
        self.render_exit_status = render_exit_status;
    }

    pub(crate) fn clear_render_phase_work(&mut self) {
        self.work_in_progress = None;
        self.work_in_progress_root_render_lanes = Lanes::NO;
        self.render_exit_status = RootRenderExitStatus::NoWork;
    }
}

impl<H: HostTypes> Default for RootSchedulingState<H> {
    fn default() -> Self {
        Self::new()
    }
}

pub struct FiberRoot<H: HostTypes> {
    id: FiberRootId,
    tag: RootTag,
    kind: RootKind,
    container_info: H::Container,
    current: FiberId,
    options: RootOptions,
    lifecycle: RootLifecycleState,
    work_status: RootWorkStatus,
    context: RootContextHandle,
    pending_context: Option<RootContextHandle>,
    pending_children: PendingChildrenHandle,
    lanes: RootLaneState,
    scheduling: RootSchedulingState<H>,
    finished_work: Option<FiberId>,
    finished_lanes: Lanes,
    pending_commit: PendingCommitHandle,
    transition_callbacks: RootTransitionCallbacksHandle,
}

impl<H: HostTypes> FiberRoot<H> {
    pub(crate) fn new_client(
        id: FiberRootId,
        container_info: H::Container,
        current: FiberId,
        options: RootOptions,
    ) -> Self {
        Self {
            id,
            tag: RootTag::Concurrent,
            kind: RootKind::Client,
            container_info,
            current,
            transition_callbacks: options.transition_callbacks(),
            options,
            lifecycle: RootLifecycleState::Active,
            work_status: RootWorkStatus::Idle,
            context: RootContextHandle::NONE,
            pending_context: None,
            pending_children: PendingChildrenHandle::NONE,
            lanes: RootLaneState::new(),
            scheduling: RootSchedulingState::new(),
            finished_work: None,
            finished_lanes: Lanes::NO,
            pending_commit: PendingCommitHandle::NONE,
        }
    }

    #[must_use]
    pub const fn id(&self) -> FiberRootId {
        self.id
    }

    #[must_use]
    pub const fn tag(&self) -> RootTag {
        self.tag
    }

    #[must_use]
    pub const fn kind(&self) -> RootKind {
        self.kind
    }

    #[must_use]
    pub const fn container_info(&self) -> &H::Container {
        &self.container_info
    }

    #[must_use]
    pub const fn current(&self) -> FiberId {
        self.current
    }

    pub(crate) fn set_current(&mut self, current: FiberId) {
        self.current = current;
    }

    #[must_use]
    pub const fn options(&self) -> &RootOptions {
        &self.options
    }

    #[must_use]
    pub const fn lifecycle(&self) -> RootLifecycleState {
        self.lifecycle
    }

    #[must_use]
    pub const fn work_status(&self) -> RootWorkStatus {
        self.work_status
    }

    #[must_use]
    pub const fn context(&self) -> RootContextHandle {
        self.context
    }

    #[must_use]
    pub const fn pending_context(&self) -> Option<RootContextHandle> {
        self.pending_context
    }

    #[must_use]
    pub const fn pending_children(&self) -> PendingChildrenHandle {
        self.pending_children
    }

    #[must_use]
    pub const fn lanes(&self) -> &RootLaneState {
        &self.lanes
    }

    pub(crate) fn lanes_mut(&mut self) -> &mut RootLaneState {
        &mut self.lanes
    }

    #[must_use]
    pub const fn scheduling(&self) -> &RootSchedulingState<H> {
        &self.scheduling
    }

    pub(crate) fn scheduling_mut(&mut self) -> &mut RootSchedulingState<H> {
        &mut self.scheduling
    }

    #[must_use]
    pub const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub const fn finished_lanes(&self) -> Lanes {
        self.finished_lanes
    }

    #[cfg(test)]
    pub(crate) fn record_finished_work_for_canary(
        &mut self,
        finished_work: FiberId,
        finished_lanes: Lanes,
    ) {
        self.finished_work = Some(finished_work);
        self.finished_lanes = finished_lanes;
    }

    pub(crate) fn clear_finished_work(&mut self) {
        self.finished_work = None;
        self.finished_lanes = Lanes::NO;
    }

    #[must_use]
    pub const fn pending_commit(&self) -> PendingCommitHandle {
        self.pending_commit
    }

    #[must_use]
    pub const fn transition_callbacks(&self) -> RootTransitionCallbacksHandle {
        self.transition_callbacks
    }
}

pub fn create_host_root_current_fiber(
    arena: &mut FiberArena,
    root_id: FiberRootId,
    mode: FiberMode,
    state: StateHandle,
) -> Result<FiberId, FiberTopologyError> {
    let current = arena.create_fiber(FiberTag::HostRoot, None, PropsHandle::NONE, mode);
    let node = arena.get_mut(current)?;
    node.set_state_node(StateNodeHandle::from_raw(root_id.raw()));
    node.set_memoized_state(state);
    Ok(current)
}

#[cfg(test)]
mod tests {
    use super::*;
    use fast_react_core::{FiberFlags, UpdateQueueHandle};

    struct Host;

    impl HostTypes for Host {
        type HostFiberToken = ();
        type Type = ();
        type Props = ();
        type Container = ();
        type Instance = ();
        type TextInstance = ();
        type PublicInstance = ();
        type HostContext = ();
        type UpdatePayload = ();
        type TimeoutHandle = usize;
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

    fn root_id() -> FiberRootId {
        FiberRootId::new(1).unwrap()
    }

    fn fiber_id(slot: usize) -> FiberId {
        use fast_react_core::{FiberArenaId, FiberGeneration, FiberSlot};

        FiberId::new(
            FiberArenaId::new(1).unwrap(),
            FiberSlot::new(slot),
            FiberGeneration::INITIAL,
        )
    }

    #[test]
    fn fiber_root_initializes_host_root_state_shell() {
        let state = HostRootState::client(
            RootElementHandle::from_raw(9),
            RootFormStateHandle::from_raw(3),
        );

        assert_eq!(state.element(), RootElementHandle::from_raw(9));
        assert!(!state.is_dehydrated());
        assert_eq!(state.hydration(), HostRootHydrationState::NotHydrated);
        assert_eq!(state.hydration().unsupported_kind(), None);
        assert_eq!(state.cache(), RootCacheHandle::NONE);
        assert_eq!(state.form_state(), RootFormStateHandle::from_raw(3));
        assert_eq!(
            state.pending_suspense_boundaries(),
            RootSuspenseBoundarySetHandle::NONE
        );
    }

    #[test]
    fn fiber_root_reserves_unsupported_host_root_hydration_state() {
        let state = HostRootState::reserved_unsupported_hydration(
            RootElementHandle::from_raw(10),
            RootFormStateHandle::from_raw(11),
            UnsupportedHydrationKind::HydrationRoot,
        );

        assert_eq!(state.element(), RootElementHandle::from_raw(10));
        assert!(state.is_dehydrated());
        assert_eq!(
            state.hydration(),
            HostRootHydrationState::ReservedUnsupported(UnsupportedHydrationKind::HydrationRoot)
        );
        assert_eq!(
            state.hydration().unsupported_kind(),
            Some(UnsupportedHydrationKind::HydrationRoot)
        );
        assert_eq!(state.form_state(), RootFormStateHandle::from_raw(11));
    }

    #[test]
    fn fiber_root_reserves_hydration_boundary_state_fail_closed() {
        let suspense = HydrationBoundaryState::reserved_unsupported_suspense(
            HydrationBoundaryHandle::from_raw(7),
        );
        let activity = HydrationBoundaryState::reserved_unsupported_activity(
            HydrationBoundaryHandle::from_raw(8),
        );

        assert!(suspense.is_reserved_unsupported());
        assert_eq!(suspense.kind(), HydrationBoundaryKind::Suspense);
        assert_eq!(suspense.dehydrated(), HydrationBoundaryHandle::from_raw(7));
        assert_eq!(suspense.tree_context(), HydrationTreeContextHandle::NONE);
        assert_eq!(suspense.retry_lane(), Lane::OFFSCREEN);
        assert_eq!(suspense.hydration_errors(), HydrationErrorQueueHandle::NONE);
        assert_eq!(suspense.dehydrated_fragment(), None);
        assert_eq!(
            suspense.unsupported_kind(),
            UnsupportedHydrationKind::HydrationRoot
        );

        assert!(activity.is_reserved_unsupported());
        assert_eq!(activity.kind(), HydrationBoundaryKind::Activity);
        assert_eq!(activity.dehydrated(), HydrationBoundaryHandle::from_raw(8));
        assert_eq!(
            activity.unsupported_kind(),
            UnsupportedHydrationKind::HydrationRoot
        );
    }

    #[test]
    fn fiber_root_state_store_uses_core_state_handles() {
        let mut store = HostRootStateStore::new();
        let handle = store.insert(HostRootState::client(
            RootElementHandle::NONE,
            RootFormStateHandle::NONE,
        ));

        assert!(handle.is_some());
        assert_eq!(
            store.get(handle).unwrap().element(),
            RootElementHandle::NONE
        );
        assert_eq!(
            store.get(StateHandle::NONE).unwrap_err(),
            HostRootStateStoreError::EmptyHandle
        );
    }

    #[test]
    fn fiber_root_creates_host_root_current_fiber() {
        let mut arena = FiberArena::new();
        let state = StateHandle::from_raw(1);
        let current =
            create_host_root_current_fiber(&mut arena, root_id(), FiberMode::CONCURRENT, state)
                .unwrap();
        let node = arena.get(current).unwrap();

        assert_eq!(node.tag(), FiberTag::HostRoot);
        assert_eq!(node.return_fiber(), None);
        assert_eq!(node.child(), None);
        assert_eq!(node.sibling(), None);
        assert_eq!(node.index(), 0);
        assert_eq!(node.alternate(), None);
        assert_eq!(node.pending_props(), PropsHandle::NONE);
        assert_eq!(node.memoized_state(), state);
        assert_eq!(node.update_queue(), UpdateQueueHandle::NONE);
        assert_eq!(
            node.state_node(),
            StateNodeHandle::from_raw(root_id().raw())
        );
        assert_eq!(node.lanes(), Lanes::NO);
        assert_eq!(node.child_lanes(), Lanes::NO);
        assert_eq!(node.flags(), FiberFlags::NO);
        assert_eq!(node.subtree_flags(), FiberFlags::NO);
        assert_eq!(node.deletions(), None);
    }

    #[test]
    fn fiber_root_scheduling_state_starts_empty() {
        let scheduling = RootSchedulingState::<Host>::new();

        assert_eq!(scheduling.next_scheduled_root(), None);
        assert_eq!(
            scheduling.callback_node(),
            RootSchedulerCallbackHandle::NONE
        );
        assert_eq!(scheduling.callback_priority(), RootCallbackPriority::NO);
        assert_eq!(scheduling.timeout_handle(), None);
        assert_eq!(
            scheduling.cancel_pending_commit(),
            PendingCommitCancelHandle::NONE
        );
        assert_eq!(scheduling.work_in_progress(), None);
        assert_eq!(scheduling.work_in_progress_root_render_lanes(), Lanes::NO);
        assert_eq!(
            scheduling.render_exit_status(),
            RootRenderExitStatus::NoWork
        );
        assert!(scheduling.pending_passive().is_empty());
        assert!(!scheduling.pending_passive().has_effects());
    }

    #[test]
    fn fiber_root_scheduling_state_records_passive_metadata_without_flushing() {
        let mut scheduling = RootSchedulingState::<Host>::new();
        let mounted_fiber = fiber_id(1);
        let deleted_fiber = fiber_id(2);

        scheduling.prepare_pending_passive(root_id(), Lanes::DEFAULT);

        assert_eq!(scheduling.pending_passive().root(), Some(root_id()));
        assert_eq!(scheduling.pending_passive().lanes(), Lanes::DEFAULT);
        assert!(!scheduling.pending_passive().has_effects());

        let mount_order = scheduling
            .pending_passive_mut()
            .queue_mount(mounted_fiber, Lanes::DEFAULT)
            .unwrap();
        let unmount_order = scheduling
            .pending_passive_mut()
            .queue_unmount(
                deleted_fiber,
                crate::root_config::PendingPassiveUnmountOrigin::UpdatedFiber,
                Lanes::SYNC,
            )
            .unwrap();

        assert!(unmount_order.flush_rank() < mount_order.flush_rank());
        assert_eq!(
            scheduling.pending_passive().lanes(),
            Lanes::DEFAULT.merge(Lanes::SYNC)
        );
        assert_eq!(
            scheduling
                .pending_passive()
                .flush_ordered_records()
                .map(|record| record.fiber())
                .collect::<Vec<_>>(),
            vec![deleted_fiber, mounted_fiber]
        );

        scheduling.clear_pending_passive();

        assert!(scheduling.pending_passive().is_empty());
        assert!(!scheduling.pending_passive().has_effects());
    }

    #[test]
    fn fiber_root_records_finished_work_metadata_for_private_commit_handoff() {
        let mut root =
            FiberRoot::<Host>::new_client(root_id(), (), fiber_id(1), RootOptions::default());
        let finished_work = fiber_id(2);

        root.record_finished_work_for_canary(finished_work, Lanes::DEFAULT);

        assert_eq!(root.finished_work(), Some(finished_work));
        assert_eq!(root.finished_lanes(), Lanes::DEFAULT);

        root.clear_finished_work();

        assert_eq!(root.finished_work(), None);
        assert_eq!(root.finished_lanes(), Lanes::NO);
    }
}
