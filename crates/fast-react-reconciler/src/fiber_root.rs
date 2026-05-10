//! FiberRoot records and HostRoot current-fiber initialization.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    FiberArena, FiberId, FiberMode, FiberTag, FiberTopologyError, Lanes, PropsHandle,
    RootLaneState, StateHandle, StateNodeHandle,
};
use fast_react_host_config::HostTypes;

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
    pub const fn pending_passive(&self) -> PendingPassiveState {
        self.pending_passive
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

    fn root_id() -> FiberRootId {
        FiberRootId::new(1).unwrap()
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
        assert_eq!(state.cache(), RootCacheHandle::NONE);
        assert_eq!(state.form_state(), RootFormStateHandle::from_raw(3));
        assert_eq!(
            state.pending_suspense_boundaries(),
            RootSuspenseBoundarySetHandle::NONE
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
        assert_eq!(scheduling.pending_passive(), PendingPassiveState::NONE);
    }
}
