//! Reconciler root configuration and inert root-level handles.
//!
//! This module models the configuration/state shape needed to create an
//! internal FiberRoot. It deliberately does not schedule work, enqueue
//! HostRoot updates, call host APIs, or expose public React DOM root behavior.

use fast_react_core::{FiberMode, Lane, Lanes};

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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PendingPassiveState {
    root: Option<FiberRootId>,
    lanes: Lanes,
}

impl PendingPassiveState {
    pub const NONE: Self = Self {
        root: None,
        lanes: Lanes::NO,
    };

    #[must_use]
    pub const fn new(root: Option<FiberRootId>, lanes: Lanes) -> Self {
        Self { root, lanes }
    }

    #[must_use]
    pub const fn root(self) -> Option<FiberRootId> {
        self.root
    }

    #[must_use]
    pub const fn lanes(self) -> Lanes {
        self.lanes
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
}
