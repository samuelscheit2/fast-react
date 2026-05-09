//! Renderer-independent host-config trait skeleton.
//!
//! This crate owns the boundary between the future reconciler and renderer
//! adapters. Host values are opaque associated types, and optional renderer
//! powers are represented as explicit capabilities instead of fake no-op
//! methods. Concrete DOM, native, hydration, persistence, and reconciler
//! behavior must live outside this crate.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{UnimplementedReactBehavior, unimplemented_behavior};

/// Result type for host operations that can fail because a capability is not
/// implemented by the current renderer.
pub type HostResult<T> = Result<T, UnsupportedHostCapability>;

/// Renderer powers that are optional in the React 19 host-config surface.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[non_exhaustive]
pub enum HostCapability {
    Mutation,
    Persistence,
    Hydration,
    Portals,
    Microtasks,
    PostPaintCallbacks,
    CommitSuspension,
    Forms,
    Resources,
    Singletons,
    ViewTransitions,
    Diagnostics,
}

impl HostCapability {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Mutation => "mutation",
            Self::Persistence => "persistence",
            Self::Hydration => "hydration",
            Self::Portals => "portals",
            Self::Microtasks => "microtasks",
            Self::PostPaintCallbacks => "post-paint-callbacks",
            Self::CommitSuspension => "commit-suspension",
            Self::Forms => "forms",
            Self::Resources => "resources",
            Self::Singletons => "singletons",
            Self::ViewTransitions => "view-transitions",
            Self::Diagnostics => "diagnostics",
        }
    }

    const fn bit(self) -> u16 {
        match self {
            Self::Mutation => 1 << 0,
            Self::Persistence => 1 << 1,
            Self::Hydration => 1 << 2,
            Self::Portals => 1 << 3,
            Self::Microtasks => 1 << 4,
            Self::PostPaintCallbacks => 1 << 5,
            Self::CommitSuspension => 1 << 6,
            Self::Forms => 1 << 7,
            Self::Resources => 1 << 8,
            Self::Singletons => 1 << 9,
            Self::ViewTransitions => 1 << 10,
            Self::Diagnostics => 1 << 11,
        }
    }
}

impl Display for HostCapability {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

/// Compact runtime declaration of a renderer's supported host capabilities.
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HostCapabilitySet {
    bits: u16,
}

impl HostCapabilitySet {
    pub const EMPTY: Self = Self { bits: 0 };

    #[must_use]
    pub const fn empty() -> Self {
        Self::EMPTY
    }

    #[must_use]
    pub const fn with(self, capability: HostCapability) -> Self {
        Self {
            bits: self.bits | capability.bit(),
        }
    }

    #[must_use]
    pub const fn supports(self, capability: HostCapability) -> bool {
        self.bits & capability.bit() != 0
    }

    #[must_use]
    pub const fn bits(self) -> u16 {
        self.bits
    }

    pub fn require(
        self,
        renderer_name: &'static str,
        capability: HostCapability,
    ) -> HostResult<()> {
        if self.supports(capability) {
            Ok(())
        } else {
            Err(UnsupportedHostCapability::new(renderer_name, capability))
        }
    }

    pub fn tree_update_mode(self) -> Result<HostTreeUpdateMode, HostTreeUpdateModeError> {
        match (
            self.supports(HostCapability::Mutation),
            self.supports(HostCapability::Persistence),
        ) {
            (true, false) => Ok(HostTreeUpdateMode::Mutation),
            (false, true) => Ok(HostTreeUpdateMode::Persistence),
            (false, false) => Err(HostTreeUpdateModeError::Missing),
            (true, true) => Err(HostTreeUpdateModeError::Conflicting),
        }
    }
}

/// The reconciler should choose exactly one tree update strategy per root.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HostTreeUpdateMode {
    Mutation,
    Persistence,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostTreeUpdateModeError {
    Missing,
    Conflicting,
}

impl Display for HostTreeUpdateModeError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Missing => formatter
                .write_str("host config must choose mutation or persistence for tree updates"),
            Self::Conflicting => formatter
                .write_str("host config cannot enable both mutation and persistence tree updates"),
        }
    }
}

impl Error for HostTreeUpdateModeError {}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UnsupportedHostCapability {
    renderer_name: &'static str,
    capability: HostCapability,
}

impl UnsupportedHostCapability {
    #[must_use]
    pub const fn new(renderer_name: &'static str, capability: HostCapability) -> Self {
        Self {
            renderer_name,
            capability,
        }
    }

    #[must_use]
    pub const fn renderer_name(&self) -> &'static str {
        self.renderer_name
    }

    #[must_use]
    pub const fn capability(&self) -> HostCapability {
        self.capability
    }
}

impl Display for UnsupportedHostCapability {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(
            formatter,
            "renderer '{}' does not support host capability '{}'",
            self.renderer_name, self.capability
        )
    }
}

impl Error for UnsupportedHostCapability {}

/// Renderer-owned host types. These must remain opaque to the reconciler.
pub trait HostTypes {
    type Type;
    type Props;
    type Container;
    type Instance;
    type TextInstance;
    type PublicInstance;
    type HostContext;
    type UpdatePayload;
    type TimeoutHandle;
    type NoTimeout;
    type CommitState;
    type EventPriority;
    type EventType;
    type EventTimestamp;
    type ActivityInstance;
    type SuspenseInstance;
    type HydratableInstance;
    type FormInstance;
    type ChildSet;
    type Resource;
    type HoistableRoot;
    type TransitionStatus;
    type SuspendedState;
    type RunningViewTransition;
    type ViewTransitionInstance;
    type InstanceMeasurement;
    type EventResponder;
    type GestureTimeline;
    type FragmentInstance;
    type RendererInspectionConfig;
}

/// Core identity and host-context hooks shared by all renderer modes.
pub trait HostIdentityAndContext: HostTypes {
    fn renderer_name(&self) -> &'static str;

    fn renderer_version(&self) -> Option<&'static str> {
        None
    }

    fn is_primary_renderer(&self) -> bool {
        true
    }

    fn capabilities(&self) -> HostCapabilitySet {
        HostCapabilitySet::EMPTY
    }

    fn get_public_instance(&self, instance: &Self::Instance) -> Self::PublicInstance;

    fn root_host_context(&self, container: &Self::Container) -> Self::HostContext;

    fn child_host_context(
        &self,
        parent_context: &Self::HostContext,
        ty: &Self::Type,
        props: &Self::Props,
    ) -> Self::HostContext;

    fn unsupported<T>(&self, capability: HostCapability) -> HostResult<T> {
        Err(UnsupportedHostCapability::new(
            self.renderer_name(),
            capability,
        ))
    }

    fn require_capability(&self, capability: HostCapability) -> HostResult<()> {
        self.capabilities()
            .require(self.renderer_name(), capability)
    }
}

/// A child handle passed across the host boundary without exposing its storage.
pub enum HostChild<'a, H: HostTypes + ?Sized> {
    Instance(&'a H::Instance),
    Text(&'a H::TextInstance),
}

/// Whether finalizing initial children requires a follow-up mount commit hook.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum InitialChildrenFinalization {
    NoCommitMount,
    CommitMount,
}

/// Base creation hooks used before a host node is mounted.
pub trait HostCreation: HostIdentityAndContext {
    fn should_set_text_content(
        &self,
        ty: &Self::Type,
        props: &Self::Props,
        context: &Self::HostContext,
    ) -> bool;

    fn create_instance(
        &mut self,
        ty: &Self::Type,
        props: &Self::Props,
        container: &Self::Container,
        context: &Self::HostContext,
    ) -> HostResult<Self::Instance>;

    fn create_text_instance(
        &mut self,
        text: &str,
        container: &Self::Container,
        context: &Self::HostContext,
    ) -> HostResult<Self::TextInstance>;

    fn append_initial_child(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
    ) -> HostResult<()>;

    fn finalize_initial_children(
        &mut self,
        instance: &mut Self::Instance,
        ty: &Self::Type,
        props: &Self::Props,
        container: &Self::Container,
        context: &Self::HostContext,
    ) -> HostResult<InitialChildrenFinalization>;

    fn clone_mutable_instance(
        &mut self,
        instance: &Self::Instance,
        update_payload: Option<&Self::UpdatePayload>,
    ) -> HostResult<Self::Instance>;

    fn clone_mutable_text_instance(
        &mut self,
        text_instance: &Self::TextInstance,
    ) -> HostResult<Self::TextInstance>;
}

/// Commit hooks shared by mutation and persistence renderers.
pub trait HostCommit: HostIdentityAndContext {
    fn prepare_for_commit(&mut self, container: &Self::Container) -> HostResult<Self::CommitState>;

    fn reset_after_commit(
        &mut self,
        container: &Self::Container,
        commit_state: Self::CommitState,
    ) -> HostResult<()>;

    fn commit_mount(
        &mut self,
        instance: &mut Self::Instance,
        ty: &Self::Type,
        props: &Self::Props,
    ) -> HostResult<()>;

    fn commit_update(
        &mut self,
        instance: &mut Self::Instance,
        update_payload: Self::UpdatePayload,
        ty: &Self::Type,
        old_props: &Self::Props,
        new_props: &Self::Props,
    ) -> HostResult<()>;

    fn commit_text_update(
        &mut self,
        text_instance: &mut Self::TextInstance,
        old_text: &str,
        new_text: &str,
    ) -> HostResult<()>;

    fn reset_text_content(&mut self, instance: &mut Self::Instance) -> HostResult<()>;

    fn hide_instance(&mut self, instance: &mut Self::Instance) -> HostResult<()>;

    fn unhide_instance(
        &mut self,
        instance: &mut Self::Instance,
        props: &Self::Props,
    ) -> HostResult<()>;

    fn hide_text_instance(&mut self, text_instance: &mut Self::TextInstance) -> HostResult<()>;

    fn unhide_text_instance(
        &mut self,
        text_instance: &mut Self::TextInstance,
        text: &str,
    ) -> HostResult<()>;

    fn detach_deleted_instance(&mut self, instance: Self::Instance) -> HostResult<()>;

    fn reset_form_instance(&mut self, form: &mut Self::FormInstance) -> HostResult<()> {
        let _form = form;
        self.unsupported(HostCapability::Forms)
    }
}

pub type HostTimeoutCallback = Box<dyn FnOnce() + Send + 'static>;
pub type HostMicrotaskCallback = Box<dyn FnOnce() + Send + 'static>;
pub type HostPostPaintCallback = Box<dyn FnOnce() + Send + 'static>;

/// Host hooks for timer, event-priority, and commit-suspension integration.
pub trait HostScheduling: HostIdentityAndContext {
    fn schedule_timeout(
        &mut self,
        callback: HostTimeoutCallback,
        delay_ms: u64,
    ) -> HostResult<Self::TimeoutHandle>;

    fn cancel_timeout(&mut self, handle: Self::TimeoutHandle) -> HostResult<()>;

    fn no_timeout(&self) -> Self::NoTimeout;

    fn set_current_update_priority(&mut self, priority: Self::EventPriority);

    fn current_update_priority(&self) -> Self::EventPriority;

    fn resolve_update_priority(&self) -> Self::EventPriority;

    fn resolve_event_type(&self) -> Option<Self::EventType>;

    fn resolve_event_timestamp(&self) -> Option<Self::EventTimestamp>;

    fn should_attempt_eager_transition(&self) -> bool {
        false
    }

    fn schedule_microtask(&mut self, callback: HostMicrotaskCallback) -> HostResult<()> {
        let _callback = callback;
        self.unsupported(HostCapability::Microtasks)
    }

    fn request_post_paint_callback(&mut self, callback: HostPostPaintCallback) -> HostResult<()> {
        let _callback = callback;
        self.unsupported(HostCapability::PostPaintCallbacks)
    }

    fn start_suspending_commit(&mut self) -> HostResult<Self::SuspendedState> {
        self.unsupported(HostCapability::CommitSuspension)
    }

    fn wait_for_commit_to_be_ready(
        &mut self,
        suspended_state: Self::SuspendedState,
    ) -> HostResult<()> {
        let _suspended_state = suspended_state;
        self.unsupported(HostCapability::CommitSuspension)
    }
}

/// Imperative tree mutation capability.
pub trait MutationHost: HostIdentityAndContext {
    fn append_child(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
    ) -> HostResult<()>;

    fn append_child_to_container(
        &mut self,
        container: &mut Self::Container,
        child: HostChild<'_, Self>,
    ) -> HostResult<()>;

    fn insert_before(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
        before_child: HostChild<'_, Self>,
    ) -> HostResult<()>;

    fn insert_in_container_before(
        &mut self,
        container: &mut Self::Container,
        child: HostChild<'_, Self>,
        before_child: HostChild<'_, Self>,
    ) -> HostResult<()>;

    fn remove_child(
        &mut self,
        parent: &mut Self::Instance,
        child: HostChild<'_, Self>,
    ) -> HostResult<()>;

    fn remove_child_from_container(
        &mut self,
        container: &mut Self::Container,
        child: HostChild<'_, Self>,
    ) -> HostResult<()>;

    fn clear_container(&mut self, container: &mut Self::Container) -> HostResult<()>;
}

/// Persistent child-set replacement capability.
pub trait PersistenceHost: HostIdentityAndContext {
    fn clone_instance(
        &mut self,
        instance: &Self::Instance,
        update_payload: Option<&Self::UpdatePayload>,
    ) -> HostResult<Self::Instance>;

    fn clone_hidden_instance(&mut self, instance: &Self::Instance) -> HostResult<Self::Instance>;

    fn clone_hidden_text_instance(
        &mut self,
        text_instance: &Self::TextInstance,
    ) -> HostResult<Self::TextInstance>;

    fn create_container_child_set(
        &mut self,
        container: &Self::Container,
    ) -> HostResult<Self::ChildSet>;

    fn append_child_to_container_child_set(
        &mut self,
        child_set: &mut Self::ChildSet,
        child: HostChild<'_, Self>,
    ) -> HostResult<()>;

    fn finalize_container_children(
        &mut self,
        container: &Self::Container,
        child_set: &mut Self::ChildSet,
    ) -> HostResult<()>;

    fn replace_container_children(
        &mut self,
        container: &mut Self::Container,
        child_set: Self::ChildSet,
    ) -> HostResult<()>;
}

/// Hydration capability reserved for DOM-like and future server-rendered hosts.
pub trait HydrationHost: HostIdentityAndContext {
    fn get_first_hydratable_child(
        &self,
        container: &Self::Container,
    ) -> Option<Self::HydratableInstance>;

    fn get_next_hydratable_sibling(
        &self,
        instance: &Self::HydratableInstance,
    ) -> Option<Self::HydratableInstance>;

    fn can_hydrate_instance(
        &self,
        instance: &Self::HydratableInstance,
        ty: &Self::Type,
        props: &Self::Props,
    ) -> bool;

    fn can_hydrate_text_instance(&self, instance: &Self::HydratableInstance, text: &str) -> bool;

    fn can_hydrate_activity_instance(&self, instance: &Self::HydratableInstance) -> bool;

    fn can_hydrate_suspense_instance(&self, instance: &Self::HydratableInstance) -> bool;

    fn hydrate_instance(
        &mut self,
        instance: &Self::HydratableInstance,
        ty: &Self::Type,
        props: &Self::Props,
        context: &Self::HostContext,
    ) -> HostResult<Option<Self::UpdatePayload>>;

    fn hydrate_text_instance(
        &mut self,
        text_instance: &Self::HydratableInstance,
        text: &str,
    ) -> HostResult<bool>;

    fn hydrate_activity_instance(
        &mut self,
        activity_instance: &Self::ActivityInstance,
    ) -> HostResult<()>;

    fn hydrate_suspense_instance(
        &mut self,
        suspense_instance: &Self::SuspenseInstance,
    ) -> HostResult<()>;

    fn commit_hydrated_instance(&mut self, instance: &mut Self::Instance) -> HostResult<()>;

    fn commit_hydrated_container(&mut self, container: &mut Self::Container) -> HostResult<()>;

    fn commit_hydrated_activity_instance(
        &mut self,
        activity_instance: &mut Self::ActivityInstance,
    ) -> HostResult<()>;

    fn commit_hydrated_suspense_instance(
        &mut self,
        suspense_instance: &mut Self::SuspenseInstance,
    ) -> HostResult<()>;

    fn flush_hydration_events(&mut self) -> HostResult<()>;

    fn should_delete_unhydrated_tail_instances(
        &self,
        parent_type: &Self::Type,
        parent_props: &Self::Props,
    ) -> bool;

    fn clear_activity_boundary(
        &mut self,
        activity_instance: &mut Self::ActivityInstance,
    ) -> HostResult<()>;

    fn clear_suspense_boundary(
        &mut self,
        suspense_instance: &mut Self::SuspenseInstance,
    ) -> HostResult<()>;
}

pub trait PortalHost: HostIdentityAndContext {
    fn prepare_portal_mount(&mut self, container: &mut Self::Container) -> HostResult<()>;
}

/// Resource and hoistable hooks. DOM adapters own their concrete semantics.
pub trait ResourceHost: HostIdentityAndContext {
    fn is_host_hoistable_type(&self, ty: &Self::Type, props: &Self::Props) -> bool;

    fn get_hoistable_root(&self, container: &Self::Container) -> HostResult<Self::HoistableRoot>;

    fn get_resource(
        &mut self,
        root: &Self::HoistableRoot,
        ty: &Self::Type,
        props: &Self::Props,
    ) -> HostResult<Self::Resource>;

    fn acquire_resource(&mut self, resource: &mut Self::Resource) -> HostResult<()>;

    fn release_resource(&mut self, resource: Self::Resource) -> HostResult<()>;

    fn preload_resource(&mut self, resource: &Self::Resource) -> HostResult<()>;
}

pub trait SingletonHost: HostIdentityAndContext {
    fn is_host_singleton_type(&self, ty: &Self::Type, props: &Self::Props) -> bool;

    fn is_singleton_scope(&self, ty: &Self::Type, props: &Self::Props) -> bool;

    fn resolve_singleton_instance(
        &mut self,
        ty: &Self::Type,
        props: &Self::Props,
        container: &Self::Container,
        context: &Self::HostContext,
    ) -> HostResult<Self::Instance>;

    fn acquire_singleton_instance(
        &mut self,
        instance: &mut Self::Instance,
        props: &Self::Props,
    ) -> HostResult<()>;

    fn release_singleton_instance(&mut self, instance: Self::Instance) -> HostResult<()>;
}

pub trait ViewTransitionHost: HostIdentityAndContext {
    fn apply_view_transition_name(
        &mut self,
        instance: &mut Self::Instance,
        name: &str,
    ) -> HostResult<()>;

    fn restore_view_transition_name(&mut self, instance: &mut Self::Instance) -> HostResult<()>;

    fn cancel_view_transition_name(&mut self, instance: &mut Self::Instance) -> HostResult<()>;

    fn measure_instance(&self, instance: &Self::Instance) -> HostResult<Self::InstanceMeasurement>;

    fn start_view_transition(&mut self) -> HostResult<Self::RunningViewTransition>;

    fn stop_view_transition(
        &mut self,
        transition: Self::RunningViewTransition,
    ) -> HostResult<Self::TransitionStatus>;
}

pub trait DiagnosticsHost: HostIdentityAndContext {
    fn renderer_inspection_config(&self) -> Option<Self::RendererInspectionConfig>;

    fn get_bounding_rect(&self, instance: &Self::Instance)
    -> HostResult<Self::InstanceMeasurement>;

    fn get_text_content(&self, instance: &Self::Instance) -> HostResult<String>;

    fn match_accessibility_role(&self, instance: &Self::Instance, role: &str) -> bool;

    fn set_focus_if_focusable(&mut self, instance: &mut Self::Instance) -> HostResult<bool>;
}

pub trait MutationRenderer: HostCreation + HostCommit + MutationHost {}

impl<T> MutationRenderer for T where T: HostCreation + HostCommit + MutationHost {}

pub trait PersistenceRenderer: HostCreation + HostCommit + PersistenceHost {}

impl<T> PersistenceRenderer for T where T: HostCreation + HostCommit + PersistenceHost {}

/// Legacy scaffold compatibility trait.
///
/// The canonical host boundary starts at [`HostTypes`] and the capability
/// traits above. This small trait remains so scaffold crates outside this
/// worker's write scope can keep compiling until they migrate.
pub trait HostConfig {
    type Instance;
    type TextInstance;

    fn renderer_name(&self) -> &'static str;

    fn supports_mutation(&self) -> bool {
        false
    }

    fn host_capabilities(&self) -> HostCapabilitySet {
        if self.supports_mutation() {
            HostCapabilitySet::empty().with(HostCapability::Mutation)
        } else {
            HostCapabilitySet::empty()
        }
    }

    fn require_host_capability(&self, capability: HostCapability) -> HostResult<()> {
        self.host_capabilities()
            .require(self.renderer_name(), capability)
    }
}

pub fn create_instance_placeholder<H: HostConfig>(
    host: &H,
) -> Result<(), UnimplementedReactBehavior> {
    let _renderer_name = host.renderer_name();
    Err(unimplemented_behavior("HostConfig.createInstance"))
}

#[cfg(test)]
mod tests {
    use super::*;

    struct PlaceholderHost;

    impl HostConfig for PlaceholderHost {
        type Instance = ();
        type TextInstance = ();

        fn renderer_name(&self) -> &'static str {
            "placeholder"
        }
    }

    #[test]
    fn host_boundary_has_no_default_mutation_support() {
        let host = PlaceholderHost;
        assert!(!host.supports_mutation());
        assert!(!host.host_capabilities().supports(HostCapability::Mutation));
    }

    #[test]
    fn instance_creation_is_explicitly_unimplemented() {
        let host = PlaceholderHost;
        let error = create_instance_placeholder(&host).unwrap_err();
        assert_eq!(error.feature(), "HostConfig.createInstance");
    }

    #[test]
    fn capability_absence_is_an_explicit_error() {
        let error = HostCapabilitySet::empty()
            .require("minimal-renderer", HostCapability::Hydration)
            .unwrap_err();

        assert_eq!(error.renderer_name(), "minimal-renderer");
        assert_eq!(error.capability(), HostCapability::Hydration);
        assert!(
            error
                .to_string()
                .contains("does not support host capability 'hydration'")
        );
    }

    #[test]
    fn tree_update_mode_requires_exactly_one_strategy() {
        assert_eq!(
            HostCapabilitySet::empty().tree_update_mode(),
            Err(HostTreeUpdateModeError::Missing)
        );

        assert_eq!(
            HostCapabilitySet::empty()
                .with(HostCapability::Mutation)
                .tree_update_mode(),
            Ok(HostTreeUpdateMode::Mutation)
        );

        assert_eq!(
            HostCapabilitySet::empty()
                .with(HostCapability::Mutation)
                .with(HostCapability::Persistence)
                .tree_update_mode(),
            Err(HostTreeUpdateModeError::Conflicting)
        );
    }

    struct LegacyMutationHost;

    impl HostConfig for LegacyMutationHost {
        type Instance = ();
        type TextInstance = ();

        fn renderer_name(&self) -> &'static str {
            "legacy-mutation"
        }

        fn supports_mutation(&self) -> bool {
            true
        }
    }

    #[test]
    fn legacy_mutation_flag_maps_to_capability_set() {
        let host = LegacyMutationHost;

        assert!(host.host_capabilities().supports(HostCapability::Mutation));
        assert_eq!(
            host.require_host_capability(HostCapability::Mutation),
            Ok(())
        );
        assert_eq!(
            host.require_host_capability(HostCapability::Hydration)
                .unwrap_err()
                .capability(),
            HostCapability::Hydration
        );
    }

    struct SkeletonHost;

    impl HostTypes for SkeletonHost {
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

    impl HostIdentityAndContext for SkeletonHost {
        fn renderer_name(&self) -> &'static str {
            "skeleton"
        }

        fn capabilities(&self) -> HostCapabilitySet {
            HostCapabilitySet::empty().with(HostCapability::Mutation)
        }

        fn get_public_instance(&self, instance: &Self::Instance) -> Self::PublicInstance {
            *instance
        }

        fn root_host_context(&self, container: &Self::Container) -> Self::HostContext {
            *container
        }

        fn child_host_context(
            &self,
            parent_context: &Self::HostContext,
            _ty: &Self::Type,
            _props: &Self::Props,
        ) -> Self::HostContext {
            *parent_context
        }
    }

    impl MutationHost for SkeletonHost {
        fn append_child(
            &mut self,
            parent: &mut Self::Instance,
            child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            let _parent = parent;
            let _child = child;
            Ok(())
        }

        fn append_child_to_container(
            &mut self,
            container: &mut Self::Container,
            child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            let _container = container;
            let _child = child;
            Ok(())
        }

        fn insert_before(
            &mut self,
            parent: &mut Self::Instance,
            child: HostChild<'_, Self>,
            before_child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            let _parent = parent;
            let _child = child;
            let _before_child = before_child;
            Ok(())
        }

        fn insert_in_container_before(
            &mut self,
            container: &mut Self::Container,
            child: HostChild<'_, Self>,
            before_child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            let _container = container;
            let _child = child;
            let _before_child = before_child;
            Ok(())
        }

        fn remove_child(
            &mut self,
            parent: &mut Self::Instance,
            child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            let _parent = parent;
            let _child = child;
            Ok(())
        }

        fn remove_child_from_container(
            &mut self,
            container: &mut Self::Container,
            child: HostChild<'_, Self>,
        ) -> HostResult<()> {
            let _container = container;
            let _child = child;
            Ok(())
        }

        fn clear_container(&mut self, container: &mut Self::Container) -> HostResult<()> {
            let _container = container;
            Ok(())
        }
    }

    #[test]
    fn canonical_traits_keep_handles_opaque_and_capabilities_explicit() {
        let host = SkeletonHost;

        assert_eq!(host.require_capability(HostCapability::Mutation), Ok(()));

        let unsupported = host
            .require_capability(HostCapability::Hydration)
            .unwrap_err();
        assert_eq!(unsupported.renderer_name(), "skeleton");
        assert_eq!(unsupported.capability(), HostCapability::Hydration);
    }

    #[test]
    fn mutation_capability_is_a_separate_trait_bound() {
        fn assert_mutation_host<H: HostIdentityAndContext + MutationHost>() {}

        assert_mutation_host::<SkeletonHost>();
    }
}
