//! Reconciler root configuration and inert root-level handles.
//!
//! This module models the configuration/state shape needed to create an
//! internal FiberRoot. It deliberately does not schedule work, enqueue
//! HostRoot updates, call host APIs, flush passive effects, or expose public
//! React DOM root behavior.

use fast_react_core::{FiberId, FiberMode, Lane, Lanes};

use crate::FiberRootId;

macro_rules! opaque_root_handle {
    ($(#[$attr:meta])* $name:ident) => {
        $(#[$attr])*
        #[repr(transparent)]
        #[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
        pub struct $name(u64);

        $(#[$attr])*
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
opaque_root_handle!(
    #[allow(
        dead_code,
        reason = "reserved for fail-closed hydration boundary state"
    )]
    HydrationBoundaryHandle
);
opaque_root_handle!(
    #[allow(
        dead_code,
        reason = "reserved for fail-closed hydration boundary state"
    )]
    HydrationErrorQueueHandle
);
opaque_root_handle!(
    #[allow(
        dead_code,
        reason = "reserved for fail-closed hydration boundary state"
    )]
    HydrationTreeContextHandle
);
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

impl RootKind {
    #[must_use]
    pub const fn is_client(self) -> bool {
        matches!(self, Self::Client)
    }

    #[must_use]
    pub const fn unsupported_hydration_kind(self) -> Option<UnsupportedHydrationKind> {
        match self {
            Self::Client => None,
            Self::ReservedUnsupportedHydration(kind) => Some(kind),
        }
    }

    #[must_use]
    pub const fn is_reserved_unsupported_hydration(self) -> bool {
        self.unsupported_hydration_kind().is_some()
    }
}

#[allow(
    dead_code,
    reason = "reserved for fail-closed hydration boundary state"
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HydrationBoundaryKind {
    Activity,
    Suspense,
}

#[allow(
    dead_code,
    reason = "reserved for fail-closed hydration boundary state"
)]
impl HydrationBoundaryKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Activity => "activity",
            Self::Suspense => "suspense",
        }
    }
}

/// Opaque root error callback handles parsed from root options.
///
/// These handles are registry IDs owned by a future JS/native bridge. The
/// reconciler must not store raw JS callback values in root configuration.
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct RootErrorCallbackHandles {
    on_uncaught_error: RootErrorCallbackHandle,
    on_caught_error: RootErrorCallbackHandle,
    on_recoverable_error: RootRecoverableErrorCallbackHandle,
}

impl RootErrorCallbackHandles {
    pub const NONE: Self = Self {
        on_uncaught_error: RootErrorCallbackHandle::NONE,
        on_caught_error: RootErrorCallbackHandle::NONE,
        on_recoverable_error: RootRecoverableErrorCallbackHandle::NONE,
    };

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
    pub const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.on_uncaught_error
    }

    #[must_use]
    pub const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.on_caught_error
    }

    #[must_use]
    pub const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.on_recoverable_error
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum RootErrorOptionCallbackPhase {
    Render,
    Commit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct RootErrorOptionCallbackRecord {
    root: FiberRootId,
    phase: RootErrorOptionCallbackPhase,
    on_uncaught_error: RootErrorCallbackHandle,
    on_caught_error: RootErrorCallbackHandle,
    on_recoverable_error: RootRecoverableErrorCallbackHandle,
}

#[allow(
    dead_code,
    reason = "crate-private root error option metadata for future error routing workers"
)]
impl RootErrorOptionCallbackRecord {
    #[must_use]
    pub(crate) const fn new(
        root: FiberRootId,
        phase: RootErrorOptionCallbackPhase,
        callbacks: RootErrorCallbackHandles,
    ) -> Self {
        Self {
            root,
            phase,
            on_uncaught_error: callbacks.on_uncaught_error(),
            on_caught_error: callbacks.on_caught_error(),
            on_recoverable_error: callbacks.on_recoverable_error(),
        }
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn phase(self) -> RootErrorOptionCallbackPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn on_uncaught_error(self) -> RootErrorCallbackHandle {
        self.on_uncaught_error
    }

    #[must_use]
    pub(crate) const fn on_caught_error(self) -> RootErrorCallbackHandle {
        self.on_caught_error
    }

    #[must_use]
    pub(crate) const fn on_recoverable_error(self) -> RootRecoverableErrorCallbackHandle {
        self.on_recoverable_error
    }

    #[must_use]
    pub(crate) const fn has_configured_error_callback(self) -> bool {
        self.on_uncaught_error.is_some()
            || self.on_caught_error.is_some()
            || self.on_recoverable_error.is_some()
    }

    #[must_use]
    pub(crate) const fn root_error_callbacks_invoked(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_error_boundaries_enabled(self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn recoverable_error_compatibility_claimed(self) -> bool {
        false
    }
}

/// Typed, bridge-facing result of root option parsing.
///
/// This record mirrors React root options after a facade has handled public
/// validation and warning behavior. Function-like options are represented only
/// by opaque handles, keeping renderer roots free of JS value ownership.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct RootOptionsRecord {
    is_strict_mode: bool,
    identifier_prefix: String,
    error_callbacks: RootErrorCallbackHandles,
    hydration_callbacks: RootHydrationCallbacksHandle,
    transition_callbacks: RootTransitionCallbacksHandle,
    default_transition_indicator: RootDefaultTransitionIndicatorHandle,
    form_state: RootFormStateHandle,
}

impl RootOptionsRecord {
    #[must_use]
    pub fn new() -> Self {
        Self {
            error_callbacks: RootErrorCallbackHandles::NONE,
            ..Self::default()
        }
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

    pub const fn set_on_uncaught_error(&mut self, handle: RootErrorCallbackHandle) {
        self.error_callbacks = self.error_callbacks.with_on_uncaught_error(handle);
    }

    pub const fn set_on_caught_error(&mut self, handle: RootErrorCallbackHandle) {
        self.error_callbacks = self.error_callbacks.with_on_caught_error(handle);
    }

    pub const fn set_on_recoverable_error(&mut self, handle: RootRecoverableErrorCallbackHandle) {
        self.error_callbacks = self.error_callbacks.with_on_recoverable_error(handle);
    }

    pub const fn set_hydration_callbacks(&mut self, handle: RootHydrationCallbacksHandle) {
        self.hydration_callbacks = handle;
    }

    pub const fn set_transition_callbacks(&mut self, handle: RootTransitionCallbacksHandle) {
        self.transition_callbacks = handle;
    }

    pub const fn set_default_transition_indicator(
        &mut self,
        handle: RootDefaultTransitionIndicatorHandle,
    ) {
        self.default_transition_indicator = handle;
    }

    pub const fn set_form_state(&mut self, handle: RootFormStateHandle) {
        self.form_state = handle;
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
        self.error_callbacks.on_uncaught_error()
    }

    #[must_use]
    pub const fn on_caught_error(&self) -> RootErrorCallbackHandle {
        self.error_callbacks.on_caught_error()
    }

    #[must_use]
    pub const fn on_recoverable_error(&self) -> RootRecoverableErrorCallbackHandle {
        self.error_callbacks.on_recoverable_error()
    }

    #[must_use]
    pub(crate) const fn error_option_callback_record(
        &self,
        root: FiberRootId,
        phase: RootErrorOptionCallbackPhase,
    ) -> RootErrorOptionCallbackRecord {
        RootErrorOptionCallbackRecord::new(root, phase, self.error_callbacks)
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
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootOptions {
    record: RootOptionsRecord,
}

impl RootOptions {
    #[must_use]
    pub fn new() -> Self {
        Self {
            record: RootOptionsRecord::new(),
        }
    }

    #[must_use]
    pub fn with_strict_mode(mut self, is_strict_mode: bool) -> Self {
        self.record = self.record.with_strict_mode(is_strict_mode);
        self
    }

    #[must_use]
    pub fn with_identifier_prefix(mut self, identifier_prefix: impl Into<String>) -> Self {
        self.record = self.record.with_identifier_prefix(identifier_prefix);
        self
    }

    #[must_use]
    pub const fn with_on_uncaught_error(mut self, handle: RootErrorCallbackHandle) -> Self {
        self.record.set_on_uncaught_error(handle);
        self
    }

    #[must_use]
    pub const fn with_on_caught_error(mut self, handle: RootErrorCallbackHandle) -> Self {
        self.record.set_on_caught_error(handle);
        self
    }

    #[must_use]
    pub const fn with_on_recoverable_error(
        mut self,
        handle: RootRecoverableErrorCallbackHandle,
    ) -> Self {
        self.record.set_on_recoverable_error(handle);
        self
    }

    #[must_use]
    pub const fn with_hydration_callbacks(mut self, handle: RootHydrationCallbacksHandle) -> Self {
        self.record.set_hydration_callbacks(handle);
        self
    }

    #[must_use]
    pub const fn with_transition_callbacks(
        mut self,
        handle: RootTransitionCallbacksHandle,
    ) -> Self {
        self.record.set_transition_callbacks(handle);
        self
    }

    #[must_use]
    pub const fn with_default_transition_indicator(
        mut self,
        handle: RootDefaultTransitionIndicatorHandle,
    ) -> Self {
        self.record.set_default_transition_indicator(handle);
        self
    }

    #[must_use]
    pub const fn with_form_state(mut self, handle: RootFormStateHandle) -> Self {
        self.record.set_form_state(handle);
        self
    }

    #[must_use]
    pub const fn is_strict_mode(&self) -> bool {
        self.record.is_strict_mode()
    }

    #[must_use]
    pub fn identifier_prefix(&self) -> &str {
        self.record.identifier_prefix()
    }

    #[must_use]
    pub const fn on_uncaught_error(&self) -> RootErrorCallbackHandle {
        self.record.on_uncaught_error()
    }

    #[must_use]
    pub const fn on_caught_error(&self) -> RootErrorCallbackHandle {
        self.record.on_caught_error()
    }

    #[must_use]
    pub const fn on_recoverable_error(&self) -> RootRecoverableErrorCallbackHandle {
        self.record.on_recoverable_error()
    }

    #[must_use]
    pub(crate) const fn error_option_callback_record(
        &self,
        root: FiberRootId,
        phase: RootErrorOptionCallbackPhase,
    ) -> RootErrorOptionCallbackRecord {
        self.record.error_option_callback_record(root, phase)
    }

    #[must_use]
    pub const fn hydration_callbacks(&self) -> RootHydrationCallbacksHandle {
        self.record.hydration_callbacks()
    }

    #[must_use]
    pub const fn transition_callbacks(&self) -> RootTransitionCallbacksHandle {
        self.record.transition_callbacks()
    }

    #[must_use]
    pub const fn default_transition_indicator(&self) -> RootDefaultTransitionIndicatorHandle {
        self.record.default_transition_indicator()
    }

    #[must_use]
    pub const fn form_state(&self) -> RootFormStateHandle {
        self.record.form_state()
    }

    #[must_use]
    pub const fn host_root_mode(&self, tag: RootTag) -> FiberMode {
        if matches!(tag, RootTag::Concurrent) {
            let mut mode = FiberMode::CONCURRENT;
            if self.is_strict_mode() {
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
        Self::new()
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
    finished_work: Option<FiberId>,
    lanes: Lanes,
    passive_unmounts: Vec<PendingPassiveEffectRecord>,
    passive_mounts: Vec<PendingPassiveEffectRecord>,
    next_sequence: u64,
}

impl PendingPassiveState {
    pub const NONE: Self = Self {
        root: None,
        finished_work: None,
        lanes: Lanes::NO,
        passive_unmounts: Vec::new(),
        passive_mounts: Vec::new(),
        next_sequence: 0,
    };

    #[must_use]
    pub const fn new(root: Option<FiberRootId>, lanes: Lanes) -> Self {
        Self {
            root,
            finished_work: None,
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
    pub const fn finished_work(&self) -> Option<FiberId> {
        self.finished_work
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.root.is_none()
            && self.finished_work.is_none()
            && self.lanes.is_empty()
            && self.passive_unmounts.is_empty()
            && self.passive_mounts.is_empty()
    }

    #[must_use]
    pub fn has_commit_handoff(&self) -> bool {
        self.root.is_some() && self.finished_work.is_some() && self.lanes.is_non_empty()
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

    pub(crate) fn record_commit_handoff(
        &mut self,
        root: FiberRootId,
        finished_work: FiberId,
        lanes: Lanes,
    ) -> bool {
        if self.root != Some(root) || lanes.is_empty() {
            return false;
        }

        self.finished_work = Some(finished_work);
        self.lanes = lanes;
        true
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
        assert_eq!(options.on_uncaught_error(), RootErrorCallbackHandle::NONE);
        assert_eq!(options.on_caught_error(), RootErrorCallbackHandle::NONE);
        assert_eq!(
            options.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::NONE
        );
        assert_eq!(
            options.host_root_mode(RootTag::Concurrent),
            FiberMode::CONCURRENT
        );
        assert_eq!(RootKind::Client, RootKind::Client);
        assert!(RootKind::Client.is_client());
        assert!(!RootKind::Client.is_reserved_unsupported_hydration());
        assert_eq!(RootKind::Client.unsupported_hydration_kind(), None);
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
    fn root_config_callback_handle_record_preserves_custom_handles() {
        let mut record = RootOptionsRecord::new();

        record.set_on_uncaught_error(RootErrorCallbackHandle::from_raw(10));
        record.set_on_caught_error(RootErrorCallbackHandle::from_raw(20));
        record.set_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(30));

        assert_eq!(
            record.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(10)
        );
        assert_eq!(
            record.on_caught_error(),
            RootErrorCallbackHandle::from_raw(20)
        );
        assert_eq!(
            record.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(30)
        );
    }

    #[test]
    fn root_config_options_preserve_distinct_callback_handles() {
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
    fn root_config_error_option_callback_record_preserves_handles_as_metadata() {
        let root = root_id();
        let record = RootOptions::new()
            .with_on_uncaught_error(RootErrorCallbackHandle::from_raw(41))
            .with_on_caught_error(RootErrorCallbackHandle::from_raw(42))
            .with_on_recoverable_error(RootRecoverableErrorCallbackHandle::from_raw(43))
            .error_option_callback_record(root, RootErrorOptionCallbackPhase::Render);

        assert_eq!(record.root(), root);
        assert_eq!(record.phase(), RootErrorOptionCallbackPhase::Render);
        assert_eq!(
            record.on_uncaught_error(),
            RootErrorCallbackHandle::from_raw(41)
        );
        assert_eq!(
            record.on_caught_error(),
            RootErrorCallbackHandle::from_raw(42)
        );
        assert_eq!(
            record.on_recoverable_error(),
            RootRecoverableErrorCallbackHandle::from_raw(43)
        );
        assert!(record.has_configured_error_callback());
        assert!(!record.root_error_callbacks_invoked());
        assert!(!record.public_error_boundaries_enabled());
        assert!(!record.recoverable_error_compatibility_claimed());
    }

    #[test]
    fn root_config_reserves_unsupported_hydration_kind() {
        let kind = RootKind::ReservedUnsupportedHydration(UnsupportedHydrationKind::HydrationRoot);

        assert_eq!(
            kind,
            RootKind::ReservedUnsupportedHydration(UnsupportedHydrationKind::HydrationRoot)
        );
        assert!(!kind.is_client());
        assert!(kind.is_reserved_unsupported_hydration());
        assert_eq!(
            kind.unsupported_hydration_kind(),
            Some(UnsupportedHydrationKind::HydrationRoot)
        );
        assert_eq!(
            UnsupportedHydrationKind::HydrationRoot.as_str(),
            "hydration root"
        );
    }

    #[test]
    fn root_config_reserves_typed_hydration_boundary_handles_without_markers() {
        assert_eq!(HydrationBoundaryKind::Activity.as_str(), "activity");
        assert_eq!(HydrationBoundaryKind::Suspense.as_str(), "suspense");

        let boundary = HydrationBoundaryHandle::from_raw(4);
        let tree_context = HydrationTreeContextHandle::from_raw(5);
        let errors = HydrationErrorQueueHandle::from_raw(6);

        assert!(HydrationBoundaryHandle::NONE.is_none());
        assert!(HydrationTreeContextHandle::NONE.is_none());
        assert!(HydrationErrorQueueHandle::NONE.is_none());
        assert!(boundary.is_some());
        assert!(tree_context.is_some());
        assert!(errors.is_some());
        assert_eq!(boundary.raw(), 4);
        assert_eq!(tree_context.raw(), 5);
        assert_eq!(errors.raw(), 6);
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
        assert!(!state.has_commit_handoff());
        assert_eq!(state.root(), None);
        assert_eq!(state.finished_work(), None);
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
    fn root_config_pending_passive_commit_handoff_records_only_root_finished_work_and_lanes() {
        let mut state = PendingPassiveState::new(Some(root_id()), Lanes::SYNC);
        let finished_work = fiber_id(4);

        assert!(state.record_commit_handoff(root_id(), finished_work, Lanes::DEFAULT));

        assert_eq!(state.root(), Some(root_id()));
        assert_eq!(state.finished_work(), Some(finished_work));
        assert_eq!(state.lanes(), Lanes::DEFAULT);
        assert!(state.has_commit_handoff());
        assert!(!state.has_effects());
        assert!(state.passive_unmounts().is_empty());
        assert!(state.passive_mounts().is_empty());
        assert_eq!(state.flush_ordered_records().count(), 0);
    }

    #[test]
    fn root_config_pending_passive_commit_handoff_rejects_empty_or_wrong_root() {
        let finished_work = fiber_id(5);
        let mut empty = PendingPassiveState::default();
        let mut state = PendingPassiveState::new(Some(root_id()), Lanes::SYNC);
        let wrong_root = FiberRootId::new(2).unwrap();

        assert!(!empty.record_commit_handoff(root_id(), finished_work, Lanes::DEFAULT));
        assert!(empty.is_empty());

        assert!(!state.record_commit_handoff(root_id(), finished_work, Lanes::NO));
        assert_eq!(state.finished_work(), None);
        assert_eq!(state.lanes(), Lanes::SYNC);
        assert!(!state.has_commit_handoff());

        assert!(!state.record_commit_handoff(wrong_root, finished_work, Lanes::DEFAULT));
        assert_eq!(state.finished_work(), None);
        assert_eq!(state.lanes(), Lanes::SYNC);
        assert!(!state.has_commit_handoff());
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
