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

/// Result type for host operations that can fail at the renderer boundary.
pub type HostResult<T> = Result<T, HostError>;

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
    /// Canonical renderer capability order used by diagnostics.
    ///
    /// The enum is non-exhaustive so downstream crates cannot safely enumerate
    /// every variant themselves. This list is the crate-owned stable order for
    /// capability reports and set iteration.
    pub const ALL: [Self; 12] = [
        Self::Mutation,
        Self::Persistence,
        Self::Hydration,
        Self::Portals,
        Self::Microtasks,
        Self::PostPaintCallbacks,
        Self::CommitSuspension,
        Self::Forms,
        Self::Resources,
        Self::Singletons,
        Self::ViewTransitions,
        Self::Diagnostics,
    ];

    #[must_use]
    pub fn all() -> &'static [Self] {
        &Self::ALL
    }

    pub fn iter() -> impl DoubleEndedIterator<Item = Self> + ExactSizeIterator + Clone {
        Self::ALL.into_iter()
    }

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
#[derive(Default, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HostCapabilitySet {
    bits: u16,
}

impl HostCapabilitySet {
    pub const EMPTY: Self = Self { bits: 0 };
    /// Set containing every capability known to this crate version.
    pub const ALL: Self = Self {
        bits: Self::KNOWN_BITS,
    };

    const KNOWN_BITS: u16 = HostCapability::Mutation.bit()
        | HostCapability::Persistence.bit()
        | HostCapability::Hydration.bit()
        | HostCapability::Portals.bit()
        | HostCapability::Microtasks.bit()
        | HostCapability::PostPaintCallbacks.bit()
        | HostCapability::CommitSuspension.bit()
        | HostCapability::Forms.bit()
        | HostCapability::Resources.bit()
        | HostCapability::Singletons.bit()
        | HostCapability::ViewTransitions.bit()
        | HostCapability::Diagnostics.bit();

    #[must_use]
    pub const fn empty() -> Self {
        Self::EMPTY
    }

    #[must_use]
    pub const fn all() -> Self {
        Self::ALL
    }

    /// Builds a set from compact bits, rejecting bits that are not assigned to
    /// a known [`HostCapability`].
    pub fn from_bits(bits: u16) -> Result<Self, UnknownHostCapabilityBits> {
        let unknown_bits = bits & !Self::KNOWN_BITS;
        if unknown_bits == 0 {
            Ok(Self { bits })
        } else {
            Err(UnknownHostCapabilityBits { unknown_bits })
        }
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
    pub const fn is_empty(self) -> bool {
        self.bits == 0
    }

    #[must_use]
    pub fn len(self) -> usize {
        self.iter().count()
    }

    /// Iterates supported capabilities in [`HostCapability::ALL`] order.
    #[must_use]
    pub fn iter(self) -> HostCapabilitySetIter {
        HostCapabilitySetIter {
            set: self,
            next_index: 0,
        }
    }

    /// Returns compact storage bits.
    ///
    /// Prefer [`Self::iter`] or [`Display`] for diagnostics so output stays
    /// tied to capability names instead of bit positions.
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
            Err(UnsupportedHostCapability::new(renderer_name, capability).into())
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

    pub fn validate_tree_update_mode(
        self,
        renderer_name: &'static str,
    ) -> Result<HostTreeUpdateMode, HostTreeUpdateModeDiagnostic> {
        self.tree_update_mode()
            .map_err(|error| HostTreeUpdateModeDiagnostic::new(renderer_name, self, error))
    }
}

impl Display for HostCapabilitySet {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        if self.is_empty() {
            return formatter.write_str("none");
        }

        for (index, capability) in self.iter().enumerate() {
            if index > 0 {
                formatter.write_str(", ")?;
            }
            Display::fmt(&capability, formatter)?;
        }

        Ok(())
    }
}

impl fmt::Debug for HostCapabilitySet {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(formatter, "HostCapabilitySet({self})")
    }
}

impl TryFrom<u16> for HostCapabilitySet {
    type Error = UnknownHostCapabilityBits;

    fn try_from(bits: u16) -> Result<Self, Self::Error> {
        Self::from_bits(bits)
    }
}

impl IntoIterator for HostCapabilitySet {
    type Item = HostCapability;
    type IntoIter = HostCapabilitySetIter;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}

/// Iterator over the supported capabilities in a [`HostCapabilitySet`].
#[derive(Debug, Clone)]
pub struct HostCapabilitySetIter {
    set: HostCapabilitySet,
    next_index: usize,
}

impl Iterator for HostCapabilitySetIter {
    type Item = HostCapability;

    fn next(&mut self) -> Option<Self::Item> {
        while self.next_index < HostCapability::ALL.len() {
            let capability = HostCapability::ALL[self.next_index];
            self.next_index += 1;

            if self.set.supports(capability) {
                return Some(capability);
            }
        }

        None
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        let len = self.len();
        (len, Some(len))
    }
}

impl ExactSizeIterator for HostCapabilitySetIter {
    fn len(&self) -> usize {
        self.clone().count()
    }
}

impl std::iter::FusedIterator for HostCapabilitySetIter {}

/// Error returned when compact capability bits contain unknown flags.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UnknownHostCapabilityBits {
    unknown_bits: u16,
}

impl UnknownHostCapabilityBits {
    #[must_use]
    pub const fn unknown_bits(&self) -> u16 {
        self.unknown_bits
    }
}

impl Display for UnknownHostCapabilityBits {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(
            formatter,
            "host capability set contains unknown capability bits {:#06x}",
            self.unknown_bits
        )
    }
}

impl Error for UnknownHostCapabilityBits {}

/// The reconciler should choose exactly one tree update strategy per root.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HostTreeUpdateMode {
    Mutation,
    Persistence,
}

impl HostTreeUpdateMode {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Mutation => "mutation",
            Self::Persistence => "persistence",
        }
    }
}

impl Display for HostTreeUpdateMode {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
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

/// Renderer-scoped tree update mode validation failure.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostTreeUpdateModeDiagnostic {
    renderer_name: &'static str,
    capabilities: HostCapabilitySet,
    error: HostTreeUpdateModeError,
}

impl HostTreeUpdateModeDiagnostic {
    #[must_use]
    pub const fn new(
        renderer_name: &'static str,
        capabilities: HostCapabilitySet,
        error: HostTreeUpdateModeError,
    ) -> Self {
        Self {
            renderer_name,
            capabilities,
            error,
        }
    }

    #[must_use]
    pub const fn renderer_name(&self) -> &'static str {
        self.renderer_name
    }

    #[must_use]
    pub const fn capabilities(&self) -> HostCapabilitySet {
        self.capabilities
    }

    #[must_use]
    pub const fn error(&self) -> HostTreeUpdateModeError {
        self.error
    }
}

impl Display for HostTreeUpdateModeDiagnostic {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self.error {
            HostTreeUpdateModeError::Missing => write!(
                formatter,
                "renderer '{}' must enable exactly one tree update capability \
                 (mutation or persistence); supported capabilities: {}",
                self.renderer_name, self.capabilities
            ),
            HostTreeUpdateModeError::Conflicting => write!(
                formatter,
                "renderer '{}' enabled conflicting tree update capabilities \
                 (mutation and persistence); supported capabilities: {}",
                self.renderer_name, self.capabilities
            ),
        }
    }
}

impl Error for HostTreeUpdateModeDiagnostic {}

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

/// Top-level host boundary error.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HostError {
    UnsupportedCapability(UnsupportedHostCapability),
    Operation(HostOperationError),
}

impl HostError {
    #[must_use]
    pub const fn as_unsupported_capability(&self) -> Option<&UnsupportedHostCapability> {
        match self {
            Self::UnsupportedCapability(error) => Some(error),
            Self::Operation(_) => None,
        }
    }

    #[must_use]
    pub const fn as_operation_error(&self) -> Option<&HostOperationError> {
        match self {
            Self::UnsupportedCapability(_) => None,
            Self::Operation(error) => Some(error),
        }
    }

    #[must_use]
    pub const fn renderer_name(&self) -> &'static str {
        match self {
            Self::UnsupportedCapability(error) => error.renderer_name(),
            Self::Operation(error) => error.renderer_name(),
        }
    }
}

impl Display for HostError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnsupportedCapability(error) => Display::fmt(error, formatter),
            Self::Operation(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for HostError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::UnsupportedCapability(error) => Some(error),
            Self::Operation(error) => Some(error),
        }
    }
}

impl From<UnsupportedHostCapability> for HostError {
    fn from(error: UnsupportedHostCapability) -> Self {
        Self::UnsupportedCapability(error)
    }
}

impl From<HostOperationError> for HostError {
    fn from(error: HostOperationError) -> Self {
        Self::Operation(error)
    }
}

/// Opaque host handle categories used in operation diagnostics.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HostHandleKind {
    Container,
    Instance,
    TextInstance,
}

impl HostHandleKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Container => "container",
            Self::Instance => "instance",
            Self::TextInstance => "text instance",
        }
    }
}

impl Display for HostHandleKind {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

/// Parent categories for host tree mutations.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HostParentKind {
    Container,
    Instance,
}

impl HostParentKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Container => "container",
            Self::Instance => "instance",
        }
    }
}

impl Display for HostParentKind {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

/// Child categories for host tree mutations.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HostChildKind {
    Instance,
    TextInstance,
}

impl HostChildKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Instance => "instance",
            Self::TextInstance => "text instance",
        }
    }
}

impl Display for HostChildKind {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

/// Why a requested host mutation cannot be represented as a tree.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HostMutationViolation {
    ChildIsParent,
    ChildIsAncestorOfParent,
}

impl HostMutationViolation {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::ChildIsParent => "child is the parent",
            Self::ChildIsAncestorOfParent => "child is an ancestor of the parent",
        }
    }
}

impl Display for HostMutationViolation {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

/// Structured renderer operation failures that are distinct from unsupported
/// host capabilities.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostOperationError {
    renderer_name: &'static str,
    kind: HostOperationErrorKind,
}

impl HostOperationError {
    #[must_use]
    pub const fn invalid_handle(renderer_name: &'static str, handle: HostHandleKind) -> Self {
        Self {
            renderer_name,
            kind: HostOperationErrorKind::InvalidHandle { handle },
        }
    }

    #[must_use]
    pub const fn missing_insertion_target(
        renderer_name: &'static str,
        parent: HostParentKind,
        target: HostChildKind,
    ) -> Self {
        Self {
            renderer_name,
            kind: HostOperationErrorKind::MissingInsertionTarget { parent, target },
        }
    }

    #[must_use]
    pub const fn missing_removal_target(
        renderer_name: &'static str,
        parent: HostParentKind,
        child: HostChildKind,
    ) -> Self {
        Self {
            renderer_name,
            kind: HostOperationErrorKind::MissingRemovalTarget { parent, child },
        }
    }

    #[must_use]
    pub const fn impossible_mutation(
        renderer_name: &'static str,
        parent: HostParentKind,
        child: HostChildKind,
        violation: HostMutationViolation,
    ) -> Self {
        Self {
            renderer_name,
            kind: HostOperationErrorKind::ImpossibleMutation {
                parent,
                child,
                violation,
            },
        }
    }

    #[must_use]
    pub const fn renderer_name(&self) -> &'static str {
        self.renderer_name
    }

    #[must_use]
    pub const fn kind(&self) -> &HostOperationErrorKind {
        &self.kind
    }
}

impl Display for HostOperationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self.kind() {
            HostOperationErrorKind::InvalidHandle { handle } => write!(
                formatter,
                "renderer '{}' received an invalid {} host handle",
                self.renderer_name, handle
            ),
            HostOperationErrorKind::MissingInsertionTarget { parent, target } => write!(
                formatter,
                "renderer '{}' cannot insert before missing {} target in {} parent",
                self.renderer_name, target, parent
            ),
            HostOperationErrorKind::MissingRemovalTarget { parent, child } => write!(
                formatter,
                "renderer '{}' cannot remove missing {} child from {} parent",
                self.renderer_name, child, parent
            ),
            HostOperationErrorKind::ImpossibleMutation {
                parent,
                child,
                violation,
            } => write!(
                formatter,
                "renderer '{}' cannot attach {} child to {} parent: {}",
                self.renderer_name, child, parent, violation
            ),
        }
    }
}

impl Error for HostOperationError {}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum HostOperationErrorKind {
    InvalidHandle {
        handle: HostHandleKind,
    },
    MissingInsertionTarget {
        parent: HostParentKind,
        target: HostChildKind,
    },
    MissingRemovalTarget {
        parent: HostParentKind,
        child: HostChildKind,
    },
    ImpossibleMutation {
        parent: HostParentKind,
        child: HostChildKind,
        violation: HostMutationViolation,
    },
}

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

    fn get_public_instance(&self, instance: &Self::Instance) -> HostResult<Self::PublicInstance>;

    fn root_host_context(&self, container: &Self::Container) -> HostResult<Self::HostContext>;

    fn child_host_context(
        &self,
        parent_context: &Self::HostContext,
        ty: &Self::Type,
        props: &Self::Props,
    ) -> HostResult<Self::HostContext>;

    fn unsupported<T>(&self, capability: HostCapability) -> HostResult<T> {
        Err(UnsupportedHostCapability::new(self.renderer_name(), capability).into())
    }

    fn require_capability(&self, capability: HostCapability) -> HostResult<()> {
        self.capabilities()
            .require(self.renderer_name(), capability)
    }

    fn validate_tree_update_mode(
        &self,
    ) -> Result<HostTreeUpdateMode, HostTreeUpdateModeDiagnostic> {
        self.capabilities()
            .validate_tree_update_mode(self.renderer_name())
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

    fn validate_tree_update_mode(
        &self,
    ) -> Result<HostTreeUpdateMode, HostTreeUpdateModeDiagnostic> {
        self.host_capabilities()
            .validate_tree_update_mode(self.renderer_name())
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
    fn host_capability_catalog_covers_all_defined_bits_and_display_names() {
        let expected = [
            (HostCapability::Mutation, "mutation", 1 << 0),
            (HostCapability::Persistence, "persistence", 1 << 1),
            (HostCapability::Hydration, "hydration", 1 << 2),
            (HostCapability::Portals, "portals", 1 << 3),
            (HostCapability::Microtasks, "microtasks", 1 << 4),
            (
                HostCapability::PostPaintCallbacks,
                "post-paint-callbacks",
                1 << 5,
            ),
            (
                HostCapability::CommitSuspension,
                "commit-suspension",
                1 << 6,
            ),
            (HostCapability::Forms, "forms", 1 << 7),
            (HostCapability::Resources, "resources", 1 << 8),
            (HostCapability::Singletons, "singletons", 1 << 9),
            (HostCapability::ViewTransitions, "view-transitions", 1 << 10),
            (HostCapability::Diagnostics, "diagnostics", 1 << 11),
        ];

        let expected_capabilities = expected
            .iter()
            .map(|(capability, _, _)| *capability)
            .collect::<Vec<_>>();
        assert_eq!(HostCapability::all(), expected_capabilities.as_slice());
        assert!(
            expected_capabilities
                .iter()
                .all(|capability| HostCapabilitySet::all().supports(*capability))
        );
        assert_eq!(
            HostCapability::iter().collect::<Vec<_>>(),
            expected_capabilities
        );

        let expected_names = expected
            .iter()
            .map(|(_, name, _)| *name)
            .collect::<Vec<_>>();
        let unique_names = expected_names
            .iter()
            .copied()
            .collect::<std::collections::BTreeSet<_>>();
        assert_eq!(unique_names.len(), expected_names.len());

        let mut known_bits = 0;
        for (capability, name, bit) in expected {
            assert_eq!(capability.as_str(), name);
            assert_eq!(capability.to_string(), name);
            assert_eq!(capability.bit(), bit);
            assert_eq!(bit.count_ones(), 1);
            assert_eq!(known_bits & bit, 0);
            known_bits |= bit;
        }

        assert_eq!(HostCapabilitySet::all().bits(), known_bits);
        assert_eq!(
            HostCapabilitySet::from_bits(known_bits),
            Ok(HostCapabilitySet::all())
        );
    }

    #[test]
    fn capability_sets_iterate_and_display_in_stable_order() {
        let set = HostCapabilitySet::empty()
            .with(HostCapability::Diagnostics)
            .with(HostCapability::Hydration)
            .with(HostCapability::Mutation)
            .with(HostCapability::ViewTransitions)
            .with(HostCapability::PostPaintCallbacks);

        assert_eq!(set.len(), 5);
        assert!(!set.is_empty());
        assert_eq!(
            set.iter().map(HostCapability::as_str).collect::<Vec<_>>(),
            [
                "mutation",
                "hydration",
                "post-paint-callbacks",
                "view-transitions",
                "diagnostics",
            ]
        );
        assert_eq!(
            set.into_iter()
                .map(HostCapability::as_str)
                .collect::<Vec<_>>(),
            [
                "mutation",
                "hydration",
                "post-paint-callbacks",
                "view-transitions",
                "diagnostics",
            ]
        );
        assert_eq!(
            set.to_string(),
            "mutation, hydration, post-paint-callbacks, view-transitions, diagnostics"
        );
        assert_eq!(
            format!("{set:?}"),
            "HostCapabilitySet(mutation, hydration, post-paint-callbacks, \
             view-transitions, diagnostics)"
        );
        assert_eq!(HostCapabilitySet::empty().len(), 0);
        assert!(HostCapabilitySet::empty().is_empty());
        assert_eq!(HostCapabilitySet::empty().to_string(), "none");
        assert_eq!(
            format!("{:?}", HostCapabilitySet::empty()),
            "HostCapabilitySet(none)"
        );
    }

    #[test]
    fn capability_sets_reject_unknown_bits() {
        let mutation_bits = HostCapability::Mutation.bit();
        assert_eq!(
            HostCapabilitySet::from_bits(mutation_bits),
            Ok(HostCapabilitySet::empty().with(HostCapability::Mutation))
        );
        assert_eq!(
            HostCapabilitySet::try_from(mutation_bits),
            Ok(HostCapabilitySet::empty().with(HostCapability::Mutation))
        );

        let error = HostCapabilitySet::from_bits(1 << 12).unwrap_err();
        assert_eq!(error.unknown_bits(), 1 << 12);
        assert_eq!(
            error.to_string(),
            "host capability set contains unknown capability bits 0x1000"
        );
    }

    #[test]
    fn capability_absence_is_an_explicit_error() {
        let error = HostCapabilitySet::empty()
            .require("minimal-renderer", HostCapability::Hydration)
            .unwrap_err();
        let unsupported = error.as_unsupported_capability().unwrap();

        assert_eq!(unsupported.renderer_name(), "minimal-renderer");
        assert_eq!(unsupported.capability(), HostCapability::Hydration);
        assert!(error.as_operation_error().is_none());
        assert_eq!(
            error.to_string(),
            "renderer 'minimal-renderer' does not support host capability 'hydration'"
        );
    }

    #[test]
    fn tree_update_mode_accepts_exactly_one_strategy() {
        assert_eq!(
            HostCapabilitySet::empty().tree_update_mode(),
            Err(HostTreeUpdateModeError::Missing)
        );
        assert_eq!(
            HostCapabilitySet::empty()
                .with(HostCapability::Hydration)
                .tree_update_mode(),
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
                .with(HostCapability::Hydration)
                .tree_update_mode(),
            Ok(HostTreeUpdateMode::Mutation)
        );
        assert_eq!(
            HostCapabilitySet::empty()
                .with(HostCapability::Persistence)
                .tree_update_mode(),
            Ok(HostTreeUpdateMode::Persistence)
        );
        assert_eq!(
            HostCapabilitySet::empty()
                .with(HostCapability::Persistence)
                .with(HostCapability::Hydration)
                .tree_update_mode(),
            Ok(HostTreeUpdateMode::Persistence)
        );

        assert_eq!(
            HostCapabilitySet::empty()
                .with(HostCapability::Mutation)
                .with(HostCapability::Persistence)
                .tree_update_mode(),
            Err(HostTreeUpdateModeError::Conflicting)
        );
        assert_eq!(
            HostCapabilitySet::empty()
                .with(HostCapability::Mutation)
                .with(HostCapability::Persistence)
                .with(HostCapability::Hydration)
                .tree_update_mode(),
            Err(HostTreeUpdateModeError::Conflicting)
        );
    }

    #[test]
    fn tree_update_mode_display_strings_are_stable() {
        assert_eq!(HostTreeUpdateMode::Mutation.to_string(), "mutation");
        assert_eq!(HostTreeUpdateMode::Persistence.to_string(), "persistence");
        assert_eq!(
            HostTreeUpdateModeError::Missing.to_string(),
            "host config must choose mutation or persistence for tree updates"
        );
        assert_eq!(
            HostTreeUpdateModeError::Conflicting.to_string(),
            "host config cannot enable both mutation and persistence tree updates"
        );
    }

    #[test]
    fn tree_update_mode_diagnostics_include_renderer_and_capability_set() {
        let missing = HostCapabilitySet::empty()
            .with(HostCapability::Hydration)
            .validate_tree_update_mode("diagnostic-renderer")
            .unwrap_err();

        assert_eq!(missing.renderer_name(), "diagnostic-renderer");
        assert_eq!(missing.error(), HostTreeUpdateModeError::Missing);
        assert_eq!(
            missing.capabilities(),
            HostCapabilitySet::empty().with(HostCapability::Hydration)
        );
        assert_eq!(
            missing.to_string(),
            "renderer 'diagnostic-renderer' must enable exactly one tree update \
             capability (mutation or persistence); supported capabilities: hydration"
        );

        let conflicting = HostCapabilitySet::empty()
            .with(HostCapability::Hydration)
            .with(HostCapability::Persistence)
            .with(HostCapability::Mutation)
            .validate_tree_update_mode("diagnostic-renderer")
            .unwrap_err();

        assert_eq!(conflicting.renderer_name(), "diagnostic-renderer");
        assert_eq!(conflicting.error(), HostTreeUpdateModeError::Conflicting);
        assert_eq!(
            conflicting.capabilities(),
            HostCapabilitySet::empty()
                .with(HostCapability::Mutation)
                .with(HostCapability::Persistence)
                .with(HostCapability::Hydration)
        );
        assert_eq!(
            conflicting.to_string(),
            "renderer 'diagnostic-renderer' enabled conflicting tree update \
             capabilities (mutation and persistence); supported capabilities: \
             mutation, persistence, hydration"
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
            HostConfig::validate_tree_update_mode(&host),
            Ok(HostTreeUpdateMode::Mutation)
        );
        assert_eq!(
            host.require_host_capability(HostCapability::Hydration)
                .unwrap_err()
                .as_unsupported_capability()
                .unwrap()
                .capability(),
            HostCapability::Hydration
        );
    }

    #[test]
    fn host_operation_errors_are_distinct_from_capability_errors() {
        let error: HostError = HostOperationError::missing_removal_target(
            "minimal-renderer",
            HostParentKind::Instance,
            HostChildKind::TextInstance,
        )
        .into();
        let operation = error.as_operation_error().unwrap();

        assert!(error.as_unsupported_capability().is_none());
        assert_eq!(operation.renderer_name(), "minimal-renderer");
        assert_eq!(
            operation.kind(),
            &HostOperationErrorKind::MissingRemovalTarget {
                parent: HostParentKind::Instance,
                child: HostChildKind::TextInstance,
            }
        );
        assert!(
            error
                .to_string()
                .contains("cannot remove missing text instance child")
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
        assert_eq!(
            HostIdentityAndContext::validate_tree_update_mode(&host),
            Ok(HostTreeUpdateMode::Mutation)
        );

        let unsupported = host
            .require_capability(HostCapability::Hydration)
            .unwrap_err();
        let unsupported = unsupported.as_unsupported_capability().unwrap();
        assert_eq!(unsupported.renderer_name(), "skeleton");
        assert_eq!(unsupported.capability(), HostCapability::Hydration);
    }

    #[test]
    fn mutation_capability_is_a_separate_trait_bound() {
        fn assert_mutation_host<H: HostIdentityAndContext + MutationHost>() {}

        assert_mutation_host::<SkeletonHost>();
    }
}
