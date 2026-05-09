//! Reconciler placeholders for fibers, lanes, hooks, context, and scheduling.
//!
//! Real reconciliation is intentionally absent from the scaffold. The module
//! layout reserves the boundary where lane/update/hook semantics will be built.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{UnimplementedReactBehavior, unimplemented_behavior};
use fast_react_host_config::{
    HostCapability, HostTreeUpdateMode, HostTreeUpdateModeError, MutationRenderer,
    UnsupportedHostCapability,
};

pub const RENDER_PLACEHOLDER_FEATURE: &str = "Reconciler.render";
pub const MUTATION_RENDER_PLACEHOLDER_FEATURE: &str = "Reconciler.render.mutation";

pub type ReconcilerResult<T> = Result<T, ReconcilerError>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReconcilerError {
    Unimplemented(UnimplementedReactBehavior),
    UnsupportedHostCapability(UnsupportedHostCapability),
    InvalidHostTreeUpdateMode(HostTreeUpdateModeError),
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
            Self::InvalidHostTreeUpdateMode(error) => Display::fmt(error, formatter),
        }
    }
}

impl Error for ReconcilerError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Unimplemented(error) => Some(error),
            Self::UnsupportedHostCapability(error) => Some(error),
            Self::InvalidHostTreeUpdateMode(error) => Some(error),
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

impl From<HostTreeUpdateModeError> for ReconcilerError {
    fn from(error: HostTreeUpdateModeError) -> Self {
        Self::InvalidHostTreeUpdateMode(error)
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

#[cfg(test)]
mod tests {
    use super::*;
    use fast_react_host_config::{
        HostCapabilitySet, HostChild, HostCommit, HostCreation, HostIdentityAndContext, HostResult,
        HostTypes, InitialChildrenFinalization, MutationHost,
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
            _ty: &Self::Type,
            _props: &Self::Props,
            _container: &Self::Container,
            _context: &Self::HostContext,
        ) -> HostResult<Self::Instance> {
            Ok(())
        }

        fn create_text_instance(
            &mut self,
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
            _instance: &mut Self::Instance,
            _ty: &Self::Type,
            _props: &Self::Props,
        ) -> HostResult<()> {
            Ok(())
        }

        fn commit_update(
            &mut self,
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

        fn detach_deleted_instance(&mut self, _instance: Self::Instance) -> HostResult<()> {
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
    fn scheduler_stays_internal_placeholder() {
        assert!(scheduler::STATUS.contains("placeholder"));
        let error = scheduler::schedule_update_placeholder().unwrap_err();
        assert_eq!(error.feature(), "Reconciler.scheduler.scheduleUpdate");
    }
}
