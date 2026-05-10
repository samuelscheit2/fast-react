//! Reconciler root configuration and inert root-level handles.
//!
//! This module models the configuration/state shape needed to create an
//! internal FiberRoot. It deliberately does not schedule work, enqueue
//! HostRoot updates, call host APIs, flush passive effects, or expose public
//! React DOM root behavior.

use fast_react_core::{FiberId, FiberMode, Lane, Lanes};

use crate::FiberRootId;

macro_rules! opaque_root_handle {
    ($name:ident) => {
        #[repr(transparent)]
        #[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
        pub struct $name(u64);

        impl $name {
            pub const NONE: Self = Self(0);

            #[must_use]
            pub const fn from_raw(raw: u64) -> Self {
                Self(raw)
            }

            #[must_use]
            pub const fn raw(self) -> u64 {
                self.0
            }

            #[must_use]
            pub const fn is_none(self) -> bool {
                self.0 == 0
            }

            #[must_use]
            pub const fn is_some(self) -> bool {
                self.0 != 0
            }
        }
    };
}

opaque_root_handle!(RootElementHandle);
opaque_root_handle!(RootCacheHandle);
opaque_root_handle!(RootContextHandle);
opaque_root_handle!(RootDefaultTransitionIndicatorHandle);
opaque_root_handle!(RootErrorCallbackHandle);
opaque_root_handle!(RootFormStateHandle);
opaque_root_handle!(RootHydrationCallbacksHandle);
opaque_root_handle!(RootRecoverableErrorCallbackHandle);
opaque_root_handle!(RootSchedulerCallbackHandle);
opaque_root_handle!(RootSuspenseBoundarySetHandle);
opaque_root_handle!(RootTransitionCallbacksHandle);
opaque_root_handle!(PendingChildrenHandle);
opaque_root_handle!(PendingCommitCancelHandle);
opaque_root_handle!(PendingCommitHandle);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RootTag {
    Legacy = 0,
    Concurrent = 1,
}

impl RootTag {
    #[must_use]
    pub const fn react_tag(self) -> u8 {
        match self {
            Self::Legacy => 0,
            Self::Concurrent => 1,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum UnsupportedHydrationKind {
    HydrationRoot,
}

impl UnsupportedHydrationKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::HydrationRoot => "hydration root",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RootKind {
    Client,
    ReservedUnsupportedHydration(UnsupportedHydrationKind),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootOptions {
    is_strict_mode: bool,
    identifier_prefix: String,
    on_uncaught_error: RootErrorCallbackHandle,
    on_caught_error: RootErrorCallbackHandle,
    on_recoverable_error: RootRecoverableErrorCallbackHandle,
    hydration_callbacks: RootHydrationCallbacksHandle,
    transition_callbacks: RootTransitionCallbacksHandle,
    default_transition_indicator: RootDefaultTransitionIndicatorHandle,
    form_state: RootFormStateHandle,
}

impl RootOptions {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn with_strict_mode(mut self, is_strict_mode: bool) -> Self {
        self.is_strict_mode = is_strict_mode;
        self
    }

    #[must_use]
    pub fn with_identifier_prefix(mut self, identifier_prefix: impl Into<String>) -> Self {
        self.identifier_prefix = identifier_prefix.into();
        self
    }

    #[must_use]
    pub const fn with_on_uncaught_error(mut self, handle: RootErrorCallbackHandle) -> Self {
        self.on_uncaught_error = handle;
        self
    }

    #[must_use]
    pub const fn with_on_caught_error(mut self, handle: RootErrorCallbackHandle) -> Self {
        self.on_caught_error = handle;
        self
    }

    #[must_use]
    pub const fn with_on_recoverable_error(
        mut self,
        handle: RootRecoverableErrorCallbackHandle,
    ) -> Self {
        self.on_recoverable_error = handle;
        self
    }

    #[must_use]
    pub const fn with_hydration_callbacks(mut self, handle: RootHydrationCallbacksHandle) -> Self {
        self.hydration_callbacks = handle;
        self
    }

    #[must_use]
    pub const fn with_transition_callbacks(
        mut self,
        handle: RootTransitionCallbacksHandle,
    ) -> Self {
        self.transition_callbacks = handle;
        self
    }

    #[must_use]
    pub const fn with_default_transition_indicator(
        mut self,
        handle: RootDefaultTransitionIndicatorHandle,
    ) -> Self {
        self.default_transition_indicator = handle;
        self
    }

    #[must_use]
    pub const fn with_form_state(mut self, handle: RootFormStateHandle) -> Self {
        self.form_state = handle;
        self
    }

    #[must_use]
    pub const fn is_strict_mode(&self) -> bool {
        self.is_strict_mode
    }

    #[must_use]
    pub fn identifier_prefix(&self) -> &str {
        &self.identifier_prefix
    }

    #[must_use]
    pub const fn on_uncaught_error(&self) -> RootErrorCallbackHandle {
        self.on_uncaught_error
    }

    #[must_use]
    pub const fn on_caught_error(&self) -> RootErrorCallbackHandle {
        self.on_caught_error
    }

    #[must_use]
    pub const fn on_recoverable_error(&self) -> RootRecoverableErrorCallbackHandle {
        self.on_recoverable_error
    }

    #[must_use]
    pub const fn hydration_callbacks(&self) -> RootHydrationCallbacksHandle {
        self.hydration_callbacks
    }

    #[must_use]
    pub const fn transition_callbacks(&self) -> RootTransitionCallbacksHandle {
        self.transition_callbacks
    }

    #[must_use]
    pub const fn default_transition_indicator(&self) -> RootDefaultTransitionIndicatorHandle {
        self.default_transition_indicator
    }

    #[must_use]
    pub const fn form_state(&self) -> RootFormStateHandle {
        self.form_state
    }

    #[must_use]
    pub const fn host_root_mode(&self, tag: RootTag) -> FiberMode {
        if matches!(tag, RootTag::Concurrent) {
            let mut mode = FiberMode::CONCURRENT;
            if self.is_strict_mode {
                mode = mode
                    .merge(FiberMode::STRICT_LEGACY)
                    .merge(FiberMode::STRICT_EFFECTS);
            }
            mode
        } else {
            FiberMode::NO
        }
    }
}

impl Default for RootOptions {
    fn default() -> Self {
        Self {
            is_strict_mode: false,
            identifier_prefix: String::new(),
            on_uncaught_error: RootErrorCallbackHandle::NONE,
            on_caught_error: RootErrorCallbackHandle::NONE,
            on_recoverable_error: RootRecoverableErrorCallbackHandle::NONE,
            hydration_callbacks: RootHydrationCallbacksHandle::NONE,
            transition_callbacks: RootTransitionCallbacksHandle::NONE,
            default_transition_indicator: RootDefaultTransitionIndicatorHandle::NONE,
            form_state: RootFormStateHandle::NONE,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RootLifecycleState {
    Created,
    Active,
    UnmountScheduled,
    Unmounted,
    Disposed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RootWorkStatus {
    Idle,
    Scheduled,
    Rendering,
    Committing,
    FlushingPassive,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RootRenderExitStatus {
    NoWork,
    Incomplete,
    Completed,
    Suspended,
    Errored,
}

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum PendingPassiveEffectPhase {
    Unmount = 0,
    Mount = 1,
}

impl PendingPassiveEffectPhase {
    #[must_use]
    pub const fn flush_rank(self) -> u8 {
        match self {
            Self::Unmount => 0,
            Self::Mount => 1,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PendingPassiveUnmountOrigin {
    UpdatedFiber,
    DeletedSubtree { nearest_mounted_ancestor: FiberId },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct PendingPassiveEffectOrder {
    phase: PendingPassiveEffectPhase,
    sequence: u64,
}

impl PendingPassiveEffectOrder {
    #[must_use]
    pub const fn new(phase: PendingPassiveEffectPhase, sequence: u64) -> Self {
        Self { phase, sequence }
    }

    #[must_use]
    pub const fn phase(self) -> PendingPassiveEffectPhase {
        self.phase
    }

    #[must_use]
    pub const fn sequence(self) -> u64 {
        self.sequence
    }

    #[must_use]
    pub const fn flush_rank(self) -> u8 {
        self.phase.flush_rank()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct PendingPassiveEffectRecord {
    fiber: FiberId,
    lanes: Lanes,
    order: PendingPassiveEffectOrder,
    unmount_origin: Option<PendingPassiveUnmountOrigin>,
}

impl PendingPassiveEffectRecord {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub const fn order(self) -> PendingPassiveEffectOrder {
        self.order
    }

    #[must_use]
    pub const fn unmount_origin(self) -> Option<PendingPassiveUnmountOrigin> {
        self.unmount_origin
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PendingPassiveState {
    root: Option<FiberRootId>,
    lanes: Lanes,
    passive_unmounts: Vec<PendingPassiveEffectRecord>,
    passive_mounts: Vec<PendingPassiveEffectRecord>,
    next_sequence: u64,
}

impl PendingPassiveState {
    pub const NONE: Self = Self {
        root: None,
        lanes: Lanes::NO,
        passive_unmounts: Vec::new(),
        passive_mounts: Vec::new(),
        next_sequence: 0,
    };

    #[must_use]
    pub const fn new(root: Option<FiberRootId>, lanes: Lanes) -> Self {
        Self {
            root,
            lanes,
            passive_unmounts: Vec::new(),
            passive_mounts: Vec::new(),
            next_sequence: 0,
        }
    }

    #[must_use]
    pub const fn root(&self) -> Option<FiberRootId> {
        self.root
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.root.is_none()
            && self.lanes.is_empty()
            && self.passive_unmounts.is_empty()
            && self.passive_mounts.is_empty()
    }

    #[must_use]
    pub fn has_effects(&self) -> bool {
        self.root.is_some()
            && (!self.passive_unmounts.is_empty() || !self.passive_mounts.is_empty())
    }

    #[must_use]
    pub fn passive_unmounts(&self) -> &[PendingPassiveEffectRecord] {
        &self.passive_unmounts
    }

    #[must_use]
    pub fn passive_mounts(&self) -> &[PendingPassiveEffectRecord] {
        &self.passive_mounts
    }

    pub fn queue_unmount(
        &mut self,
        fiber: FiberId,
        origin: PendingPassiveUnmountOrigin,
        lanes: Lanes,
    ) -> Option<PendingPassiveEffectOrder> {
        let order = self.next_order(PendingPassiveEffectPhase::Unmount, lanes)?;
        self.passive_unmounts.push(PendingPassiveEffectRecord {
            fiber,
            lanes,
            order,
            unmount_origin: Some(origin),
        });
        Some(order)
    }

    pub fn queue_mount(
        &mut self,
        fiber: FiberId,
        lanes: Lanes,
    ) -> Option<PendingPassiveEffectOrder> {
        let order = self.next_order(PendingPassiveEffectPhase::Mount, lanes)?;
        self.passive_mounts.push(PendingPassiveEffectRecord {
            fiber,
            lanes,
            order,
            unmount_origin: None,
        });
        Some(order)
    }

    pub fn flush_ordered_records(&self) -> impl Iterator<Item = &PendingPassiveEffectRecord> {
        self.passive_unmounts
            .iter()
            .chain(self.passive_mounts.iter())
    }

    fn next_order(
        &mut self,
        phase: PendingPassiveEffectPhase,
        lanes: Lanes,
    ) -> Option<PendingPassiveEffectOrder> {
        if self.root.is_none() || lanes.is_empty() {
            return None;
        }

        let sequence = self.next_sequence;
        self.next_sequence = self.next_sequence.checked_add(1)?;
        self.lanes = self.lanes.merge(lanes);
        Some(PendingPassiveEffectOrder::new(phase, sequence))
    }
}

impl Default for PendingPassiveState {
    fn default() -> Self {
        Self::NONE
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootCallbackPriority(Lane);

impl RootCallbackPriority {
    pub const NO: Self = Self(Lane::NO);

    #[must_use]
    pub const fn new(lane: Lane) -> Self {
        Self(lane)
    }

    #[must_use]
    pub const fn lane(self) -> Lane {
        self.0
    }
}

impl Default for RootCallbackPriority {
    fn default() -> Self {
        Self::NO
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn root_config_default_options_are_concurrent_client_ready() {
        let options = RootOptions::new();

        assert!(!options.is_strict_mode());
        assert_eq!(options.identifier_prefix(), "");
        assert_eq!(
            options.host_root_mode(RootTag::Concurrent),
            FiberMode::CONCURRENT
        );
        assert_eq!(RootKind::Client, RootKind::Client);
        assert_eq!(RootTag::Concurrent.react_tag(), 1);
        assert_eq!(RootTag::Legacy.react_tag(), 0);
    }

    #[test]
    fn root_config_strict_mode_sets_host_root_mode_bits() {
        let mode = RootOptions::new()
            .with_strict_mode(true)
            .host_root_mode(RootTag::Concurrent);

        assert!(mode.contains_all(FiberMode::CONCURRENT));
        assert!(mode.contains_all(FiberMode::STRICT_LEGACY));
        assert!(mode.contains_all(FiberMode::STRICT_EFFECTS));
    }

    #[test]
    fn root_config_callback_handles_are_distinct_from_scheduler_handles() {
        let options = RootOptions::new()
            .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(1))
            .with_on_caught_error(RootErrorCallbackHandle::from_raw(2))
            .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(3));
        let scheduler_handle = RootSchedulerCallbackHandle::from_raw(1);

        assert_eq!(options.on_uncaught_error().raw(), scheduler_handle.raw());
        assert_eq!(options.on_caught_error().raw(), 2);
        assert_eq!(options.on_recoverable_error().raw(), 3);
    }

    #[test]
    fn root_config_reserves_unsupported_hydration_kind() {
        assert_eq!(
            RootKind::ReservedUnsupportedHydration(UnsupportedHydrationKind::HydrationRoot),
            RootKind::ReservedUnsupportedHydration(UnsupportedHydrationKind::HydrationRoot)
        );
        assert_eq!(
            UnsupportedHydrationKind::HydrationRoot.as_str(),
            "hydration root"
        );
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
    fn root_config_pending_passive_state_defaults_to_empty_noop() {
        let mut state = PendingPassiveState::default();

        assert!(state.is_empty());
        assert!(!state.has_effects());
        assert_eq!(state.root(), None);
        assert_eq!(state.lanes(), Lanes::NO);
        assert!(state.passive_unmounts().is_empty());
        assert!(state.passive_mounts().is_empty());
        assert_eq!(state.flush_ordered_records().count(), 0);
        assert_eq!(state.queue_mount(fiber_id(0), Lanes::DEFAULT), None);
        assert_eq!(
            state.queue_unmount(
                fiber_id(1),
                PendingPassiveUnmountOrigin::UpdatedFiber,
                Lanes::DEFAULT,
            ),
            None
        );
        assert!(state.is_empty());
    }

    #[test]
    fn root_config_pending_passive_records_keep_unmounts_before_mounts() {
        let mut state = PendingPassiveState::new(Some(root_id()), Lanes::NO);
        let mounted_fiber = fiber_id(1);
        let deleted_fiber = fiber_id(2);
        let ancestor = fiber_id(3);

        let mount_order = state.queue_mount(mounted_fiber, Lanes::DEFAULT).unwrap();
        let unmount_order = state
            .queue_unmount(
                deleted_fiber,
                PendingPassiveUnmountOrigin::DeletedSubtree {
                    nearest_mounted_ancestor: ancestor,
                },
                Lanes::SYNC,
            )
            .unwrap();

        assert_eq!(mount_order.phase(), PendingPassiveEffectPhase::Mount);
        assert_eq!(mount_order.sequence(), 0);
        assert_eq!(unmount_order.phase(), PendingPassiveEffectPhase::Unmount);
        assert_eq!(unmount_order.sequence(), 1);
        assert!(unmount_order.flush_rank() < mount_order.flush_rank());
        assert_eq!(state.lanes(), Lanes::DEFAULT.merge(Lanes::SYNC));
        assert!(state.has_effects());

        let unmount = state.passive_unmounts()[0];
        assert_eq!(unmount.fiber(), deleted_fiber);
        assert_eq!(unmount.lanes(), Lanes::SYNC);
        assert_eq!(unmount.order(), unmount_order);
        assert_eq!(
            unmount.unmount_origin(),
            Some(PendingPassiveUnmountOrigin::DeletedSubtree {
                nearest_mounted_ancestor: ancestor,
            })
        );

        let mount = state.passive_mounts()[0];
        assert_eq!(mount.fiber(), mounted_fiber);
        assert_eq!(mount.lanes(), Lanes::DEFAULT);
        assert_eq!(mount.order(), mount_order);
        assert_eq!(mount.unmount_origin(), None);

        let flush_order: Vec<FiberId> = state
            .flush_ordered_records()
            .map(|record| record.fiber())
            .collect();
        assert_eq!(flush_order, vec![deleted_fiber, mounted_fiber]);
    }

    #[test]
    fn root_config_pending_passive_rejects_no_lane_records() {
        let mut state = PendingPassiveState::new(Some(root_id()), Lanes::NO);

        assert_eq!(state.queue_mount(fiber_id(0), Lanes::NO), None);
        assert_eq!(
            state.queue_unmount(
                fiber_id(1),
                PendingPassiveUnmountOrigin::UpdatedFiber,
                Lanes::NO,
            ),
            None
        );

        assert!(!state.has_effects());
        assert_eq!(state.lanes(), Lanes::NO);
        assert!(state.passive_unmounts().is_empty());
        assert!(state.passive_mounts().is_empty());
    }
}
