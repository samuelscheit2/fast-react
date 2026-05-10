//! Private test-only complete/unwind helpers.
//!
//! These helpers model only the Provider stack restoration point and narrow
//! HostRoot child-set completion points needed by root-loop canaries. They do
//! not implement general complete-work traversal, public arrays, keyed
//! children, portals, Suspense, commit, or renderer output.

#![cfg(test)]
#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextHandle, ContextStackError, ContextStackSnapshot, ContextValueHandle, FiberArena,
    FiberFlags, FiberId, FiberTag, FiberTopologyError, Lanes, bubble_properties,
};

use crate::begin_work::{
    ContextProviderUseContextOpenScopeBeginWorkRecord,
    UnsupportedOffscreenVisibilityChildTraversalBlocker,
    UnsupportedOffscreenVisibilityTransitionRecord,
    unsupported_offscreen_visibility_transition_record,
};
use crate::function_component::FunctionComponentContextRenderStore;
use crate::unsupported_features::OFFSCREEN_UNSUPPORTED_FEATURE;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ContextProviderStackRestorationPhase {
    Complete,
    Unwind,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderStackRestorationRecord {
    provider: FiberId,
    context: ContextHandle,
    value: ContextValueHandle,
    provider_snapshot: ContextStackSnapshot,
    phase: ContextProviderStackRestorationPhase,
    stack_depth_before_restore: usize,
    restored_stack_depth: usize,
    child_lanes: Lanes,
    subtree_flags: FiberFlags,
}

impl ContextProviderStackRestorationRecord {
    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn value(self) -> ContextValueHandle {
        self.value
    }

    #[must_use]
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.provider_snapshot
    }

    #[must_use]
    pub const fn phase(self) -> ContextProviderStackRestorationPhase {
        self.phase
    }

    #[must_use]
    pub const fn stack_depth_before_restore(self) -> usize {
        self.stack_depth_before_restore
    }

    #[must_use]
    pub const fn restored_stack_depth(self) -> usize {
        self.restored_stack_depth
    }

    #[must_use]
    pub const fn child_lanes(self) -> Lanes {
        self.child_lanes
    }

    #[must_use]
    pub const fn subtree_flags(self) -> FiberFlags {
        self.subtree_flags
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum ContextProviderStackRestorationError {
    FiberTopology(FiberTopologyError),
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    ContextRestore {
        provider: FiberId,
        context: ContextHandle,
        snapshot: ContextStackSnapshot,
        error: Box<ContextStackError>,
    },
}

impl Display for ContextProviderStackRestorationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be ContextProvider for private provider stack restoration, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::ContextRestore {
                provider,
                context,
                snapshot,
                error,
            } => write!(
                formatter,
                "ContextProvider fiber {} could not restore context {} snapshot at depth {} during private complete/unwind: {error}",
                provider.slot().get(),
                context.raw(),
                snapshot.depth()
            ),
        }
    }
}

impl Error for ContextProviderStackRestorationError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ContextRestore { error, .. } => Some(error),
            Self::UnexpectedFiberTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for ContextProviderStackRestorationError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub(crate) fn complete_context_provider_for_test(
    arena: &mut FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: ContextProviderUseContextOpenScopeBeginWorkRecord,
) -> Result<ContextProviderStackRestorationRecord, ContextProviderStackRestorationError> {
    restore_context_provider_stack_for_test(
        arena,
        context_store,
        begin_work,
        ContextProviderStackRestorationPhase::Complete,
        true,
    )
}

pub(crate) fn unwind_context_provider_for_test(
    arena: &mut FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: ContextProviderUseContextOpenScopeBeginWorkRecord,
) -> Result<ContextProviderStackRestorationRecord, ContextProviderStackRestorationError> {
    restore_context_provider_stack_for_test(
        arena,
        context_store,
        begin_work,
        ContextProviderStackRestorationPhase::Unwind,
        false,
    )
}

fn restore_context_provider_stack_for_test(
    arena: &mut FiberArena,
    context_store: &mut FunctionComponentContextRenderStore,
    begin_work: ContextProviderUseContextOpenScopeBeginWorkRecord,
    phase: ContextProviderStackRestorationPhase,
    bubble_provider: bool,
) -> Result<ContextProviderStackRestorationRecord, ContextProviderStackRestorationError> {
    expect_context_provider(arena, begin_work.provider())?;
    let stack_depth_before_restore = context_store.stack_depth();
    context_store
        .restore_snapshot(begin_work.provider_snapshot())
        .map_err(
            |error| ContextProviderStackRestorationError::ContextRestore {
                provider: begin_work.provider(),
                context: begin_work.context(),
                snapshot: begin_work.provider_snapshot(),
                error: Box::new(error),
            },
        )?;
    let restored_stack_depth = context_store.stack_depth();

    if bubble_provider {
        let bubbled = bubble_properties(arena, begin_work.provider())?;
        let provider = arena.get_mut(begin_work.provider())?;
        provider.set_child_lanes(bubbled.child_lanes());
        provider.set_subtree_flags(bubbled.subtree_flags());
    }

    let provider = arena.get(begin_work.provider())?;
    Ok(ContextProviderStackRestorationRecord {
        provider: begin_work.provider(),
        context: begin_work.context(),
        value: begin_work.value(),
        provider_snapshot: begin_work.provider_snapshot(),
        phase,
        stack_depth_before_restore,
        restored_stack_depth,
        child_lanes: provider.child_lanes(),
        subtree_flags: provider.subtree_flags(),
    })
}

fn expect_context_provider(
    arena: &FiberArena,
    fiber: FiberId,
) -> Result<(), ContextProviderStackRestorationError> {
    let tag = arena.get(fiber)?.tag();
    if tag == FiberTag::ContextProvider {
        Ok(())
    } else {
        Err(ContextProviderStackRestorationError::UnexpectedFiberTag { fiber, tag })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct OffscreenVisibilityTransitionCompleteWorkBlockerRecord {
    offscreen: FiberId,
    child: Option<FiberId>,
    child_tag: Option<FiberTag>,
    child_sibling: Option<FiberId>,
    child_sibling_tag: Option<FiberTag>,
    flags: FiberFlags,
    subtree_flags: FiberFlags,
    transition: UnsupportedOffscreenVisibilityTransitionRecord,
    feature: &'static str,
}

impl OffscreenVisibilityTransitionCompleteWorkBlockerRecord {
    #[must_use]
    pub const fn offscreen(&self) -> FiberId {
        self.offscreen
    }

    #[must_use]
    pub const fn child(&self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub const fn child_tag(&self) -> Option<FiberTag> {
        self.child_tag
    }

    #[must_use]
    pub const fn child_sibling(&self) -> Option<FiberId> {
        self.child_sibling
    }

    #[must_use]
    pub const fn child_sibling_tag(&self) -> Option<FiberTag> {
        self.child_sibling_tag
    }

    #[must_use]
    pub const fn flags(&self) -> FiberFlags {
        self.flags
    }

    #[must_use]
    pub const fn subtree_flags(&self) -> FiberFlags {
        self.subtree_flags
    }

    #[must_use]
    pub const fn transition(&self) -> &UnsupportedOffscreenVisibilityTransitionRecord {
        &self.transition
    }

    #[must_use]
    pub const fn feature(&self) -> &'static str {
        self.feature
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum OffscreenVisibilityTransitionCompleteWorkBlockerError {
    FiberTopology(FiberTopologyError),
    UnexpectedFiberTag { fiber: FiberId, tag: FiberTag },
    MissingVisibilityTransition { offscreen: FiberId },
}

impl Display for OffscreenVisibilityTransitionCompleteWorkBlockerError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be Offscreen for private visibility transition complete-work blocker diagnostics, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::MissingVisibilityTransition { offscreen } => write!(
                formatter,
                "Offscreen fiber {} has no hidden/visible transition for private complete-work blocker diagnostics",
                offscreen.slot().get()
            ),
        }
    }
}

impl Error for OffscreenVisibilityTransitionCompleteWorkBlockerError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::UnexpectedFiberTag { .. } | Self::MissingVisibilityTransition { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for OffscreenVisibilityTransitionCompleteWorkBlockerError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub(crate) fn complete_offscreen_visibility_transition_blocker_for_test(
    arena: &FiberArena,
    offscreen: FiberId,
    render_lanes: Lanes,
) -> Result<
    OffscreenVisibilityTransitionCompleteWorkBlockerRecord,
    OffscreenVisibilityTransitionCompleteWorkBlockerError,
> {
    let node = arena.get(offscreen)?;
    let tag = node.tag();
    if tag != FiberTag::Offscreen {
        return Err(
            OffscreenVisibilityTransitionCompleteWorkBlockerError::UnexpectedFiberTag {
                fiber: offscreen,
                tag,
            },
        );
    }

    let child = node.child();
    let (child_tag, child_sibling, child_sibling_tag) = match child {
        Some(child) => {
            let child_node = arena.get(child)?;
            let child_sibling = child_node.sibling();
            let child_sibling_tag = match child_sibling {
                Some(child_sibling) => Some(arena.get(child_sibling)?.tag()),
                None => None,
            };
            (Some(child_node.tag()), child_sibling, child_sibling_tag)
        }
        None => (None, None, None),
    };

    let transition = unsupported_offscreen_visibility_transition_record(
        arena,
        offscreen,
        render_lanes,
        UnsupportedOffscreenVisibilityChildTraversalBlocker::CompleteWorkDoesNotBubbleChildrenOrScheduleVisibility,
    )?
    .ok_or(OffscreenVisibilityTransitionCompleteWorkBlockerError::MissingVisibilityTransition {
        offscreen,
    })?;

    Ok(OffscreenVisibilityTransitionCompleteWorkBlockerRecord {
        offscreen,
        child,
        child_tag,
        child_sibling,
        child_sibling_tag,
        flags: node.flags(),
        subtree_flags: node.subtree_flags(),
        transition,
        feature: OFFSCREEN_UNSUPPORTED_FEATURE,
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootOneLevelChildSetCompletionRecord {
    host_root: FiberId,
    child_count: usize,
    first_child: FiberId,
    first_child_tag: FiberTag,
    last_child: FiberId,
    last_child_tag: FiberTag,
    child_lanes: Lanes,
    subtree_flags: FiberFlags,
}

impl HostRootOneLevelChildSetCompletionRecord {
    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn child_count(self) -> usize {
        self.child_count
    }

    #[must_use]
    pub const fn first_child(self) -> FiberId {
        self.first_child
    }

    #[must_use]
    pub const fn first_child_tag(self) -> FiberTag {
        self.first_child_tag
    }

    #[must_use]
    pub const fn last_child(self) -> FiberId {
        self.last_child
    }

    #[must_use]
    pub const fn last_child_tag(self) -> FiberTag {
        self.last_child_tag
    }

    #[must_use]
    pub const fn child_lanes(self) -> Lanes {
        self.child_lanes
    }

    #[must_use]
    pub const fn subtree_flags(self) -> FiberFlags {
        self.subtree_flags
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootOneLevelChildSetCompletionError {
    FiberTopology(FiberTopologyError),
    UnexpectedHostRootTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    ChildCountMismatch {
        host_root: FiberId,
        expected: usize,
        actual: usize,
    },
    MissingFirstChild {
        host_root: FiberId,
    },
    UnsupportedChildTag {
        host_root: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

impl Display for HostRootOneLevelChildSetCompletionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UnexpectedHostRootTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be HostRoot for private one-level child-set completion, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::ChildCountMismatch {
                host_root,
                expected,
                actual,
            } => write!(
                formatter,
                "HostRoot fiber {} expected {expected} one-level host children during private completion, found {actual}",
                host_root.slot().get()
            ),
            Self::MissingFirstChild { host_root } => write!(
                formatter,
                "HostRoot fiber {} has no child for private one-level child-set completion",
                host_root.slot().get()
            ),
            Self::UnsupportedChildTag {
                host_root,
                child,
                tag,
            } => write!(
                formatter,
                "HostRoot fiber {} child {} has unsupported one-level completion tag {:?}; only HostComponent and HostText children are admitted",
                host_root.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

impl Error for HostRootOneLevelChildSetCompletionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::UnexpectedHostRootTag { .. }
            | Self::ChildCountMismatch { .. }
            | Self::MissingFirstChild { .. }
            | Self::UnsupportedChildTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for HostRootOneLevelChildSetCompletionError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub(crate) fn complete_host_root_one_level_child_set_for_test(
    arena: &mut FiberArena,
    host_root: FiberId,
    expected_child_count: usize,
) -> Result<HostRootOneLevelChildSetCompletionRecord, HostRootOneLevelChildSetCompletionError> {
    let tag = arena.get(host_root)?.tag();
    if tag != FiberTag::HostRoot {
        return Err(
            HostRootOneLevelChildSetCompletionError::UnexpectedHostRootTag {
                fiber: host_root,
                tag,
            },
        );
    }

    let children = arena.child_ids(host_root)?;
    if children.len() != expected_child_count {
        return Err(
            HostRootOneLevelChildSetCompletionError::ChildCountMismatch {
                host_root,
                expected: expected_child_count,
                actual: children.len(),
            },
        );
    }

    let first_child = *children
        .first()
        .ok_or(HostRootOneLevelChildSetCompletionError::MissingFirstChild { host_root })?;
    let last_child = *children
        .last()
        .expect("first child was already required for HostRoot completion");
    let mut first_child_tag = None;
    let mut last_child_tag = None;

    for (index, child) in children.iter().copied().enumerate() {
        let tag = arena.get(child)?.tag();
        if !matches!(tag, FiberTag::HostComponent | FiberTag::HostText) {
            return Err(
                HostRootOneLevelChildSetCompletionError::UnsupportedChildTag {
                    host_root,
                    child,
                    tag,
                },
            );
        }
        if index == 0 {
            first_child_tag = Some(tag);
        }
        if index + 1 == children.len() {
            last_child_tag = Some(tag);
        }
    }

    let bubbled = bubble_properties(arena, host_root)?;
    let node = arena.get_mut(host_root)?;
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());

    Ok(HostRootOneLevelChildSetCompletionRecord {
        host_root,
        child_count: children.len(),
        first_child,
        first_child_tag: first_child_tag.expect("first child tag was captured during validation"),
        last_child,
        last_child_tag: last_child_tag.expect("last child tag was captured during validation"),
        child_lanes: bubbled.child_lanes(),
        subtree_flags: bubbled.subtree_flags(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::begin_work::{
        ContextProviderBeginWorkRequest, UnsupportedOffscreenVisibility,
        UnsupportedOffscreenVisibilityChildTraversalBlocker, UnsupportedOffscreenVisibilityMode,
        UnsupportedOffscreenVisibilityTransitionKind,
        begin_work_context_provider_use_context_child_for_complete_traversal,
    };
    use crate::function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextRenderReader,
        FunctionComponentInvocationError, FunctionComponentInvocationRequest,
        FunctionComponentOutputHandle, FunctionComponentRenderError,
    };
    use fast_react_core::{FiberMode, FiberTypeHandle, Lane, PropsHandle, ReactKey, StateHandle};

    fn context_value(raw: u64) -> ContextValueHandle {
        ContextValueHandle::from_raw(raw)
    }

    #[derive(Debug)]
    struct TestUseContextInvoker {
        component: FiberTypeHandle,
        context: ContextHandle,
    }

    impl FunctionComponentContextConsumerInvoker for TestUseContextInvoker {
        fn invoke_function_component_context_consumer(
            &mut self,
            request: FunctionComponentInvocationRequest,
            reader: &mut FunctionComponentContextRenderReader<'_>,
        ) -> Result<FunctionComponentOutputHandle, FunctionComponentRenderError> {
            if request.component() != self.component {
                return Err(FunctionComponentRenderError::Invocation {
                    fiber: request.fiber(),
                    component: request.component(),
                    error: FunctionComponentInvocationError::component_error(
                        "missing complete-work provider test component",
                    ),
                });
            }

            let read = reader.use_context(self.context)?;
            Ok(FunctionComponentOutputHandle::from_raw(read.value().raw()))
        }
    }

    fn provider_scope() -> (
        FiberArena,
        FunctionComponentContextRenderStore,
        ContextProviderUseContextOpenScopeBeginWorkRecord,
        ContextValueHandle,
    ) {
        let mut arena = FiberArena::new();
        let provider = arena.create_fiber(
            FiberTag::ContextProvider,
            None,
            PropsHandle::from_raw(1),
            FiberMode::NO,
        );
        let child_current = arena.create_fiber(
            FiberTag::FunctionComponent,
            None,
            PropsHandle::from_raw(2),
            FiberMode::NO,
        );
        let component = FiberTypeHandle::from_raw(3);
        arena
            .get_mut(child_current)
            .unwrap()
            .set_fiber_type(component);
        let child = arena
            .create_work_in_progress(child_current, PropsHandle::from_raw(4))
            .unwrap();
        arena.set_children(provider, &[child]).unwrap();
        arena
            .get_mut(child)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);

        let mut context_store = FunctionComponentContextRenderStore::new();
        let default_value = context_value(10);
        let provided_value = context_value(11);
        let context = context_store.create_context(default_value);
        let mut invoker = TestUseContextInvoker { component, context };
        let begin_work = begin_work_context_provider_use_context_child_for_complete_traversal(
            &mut arena,
            ContextProviderBeginWorkRequest::new(provider, Lanes::DEFAULT, context, provided_value),
            &mut context_store,
            &mut invoker,
        )
        .unwrap();

        (arena, context_store, begin_work, default_value)
    }

    fn offscreen_complete_transition_pair(
        key: &'static str,
        previous_hidden_state: StateHandle,
        current_hidden_state: StateHandle,
        previous_lanes: Lanes,
        previous_child_lanes: Lanes,
        work_in_progress_lanes: Lanes,
        work_in_progress_child_lanes: Lanes,
    ) -> (FiberArena, FiberId, FiberId, FiberId, FiberId) {
        let mut arena = FiberArena::new();
        let previous = arena.create_fiber(
            FiberTag::Offscreen,
            Some(ReactKey::from_normalized(key)),
            PropsHandle::from_raw(900),
            FiberMode::CONCURRENT,
        );
        {
            let node = arena.get_mut(previous).unwrap();
            node.set_memoized_state(previous_hidden_state);
            node.set_lanes(previous_lanes);
            node.set_child_lanes(previous_child_lanes);
        }
        let work_in_progress = arena
            .create_work_in_progress(previous, PropsHandle::from_raw(901))
            .unwrap();
        {
            let node = arena.get_mut(work_in_progress).unwrap();
            node.set_memoized_state(current_hidden_state);
            node.set_lanes(work_in_progress_lanes);
            node.set_child_lanes(work_in_progress_child_lanes);
        }
        let first_child = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(902),
            FiberMode::NO,
        );
        let second_child = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(903),
            FiberMode::NO,
        );
        arena
            .get_mut(first_child)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);
        arena
            .set_children(work_in_progress, &[first_child, second_child])
            .unwrap();

        (arena, previous, work_in_progress, first_child, second_child)
    }

    #[test]
    fn complete_context_provider_restores_stack_and_bubbles_children() {
        let (mut arena, mut context_store, begin_work, default_value) = provider_scope();

        let record =
            complete_context_provider_for_test(&mut arena, &mut context_store, begin_work).unwrap();

        assert_eq!(record.provider(), begin_work.provider());
        assert_eq!(record.context(), begin_work.context());
        assert_eq!(record.value(), begin_work.value());
        assert_eq!(
            record.phase(),
            ContextProviderStackRestorationPhase::Complete
        );
        assert_eq!(record.stack_depth_before_restore(), 1);
        assert_eq!(record.restored_stack_depth(), 0);
        assert!(record.subtree_flags().contains_all(FiberFlags::PLACEMENT));
        assert_eq!(
            context_store.current_value(begin_work.context()).unwrap(),
            default_value
        );
        assert_eq!(context_store.stack_depth(), 0);
    }

    #[test]
    fn unwind_context_provider_restores_stack_without_bubbling() {
        let (mut arena, mut context_store, begin_work, default_value) = provider_scope();

        let record =
            unwind_context_provider_for_test(&mut arena, &mut context_store, begin_work).unwrap();

        assert_eq!(record.phase(), ContextProviderStackRestorationPhase::Unwind);
        assert_eq!(record.stack_depth_before_restore(), 1);
        assert_eq!(record.restored_stack_depth(), 0);
        assert_eq!(record.subtree_flags(), FiberFlags::NO);
        assert_eq!(
            context_store.current_value(begin_work.context()).unwrap(),
            default_value
        );
        assert_eq!(context_store.stack_depth(), 0);
    }

    #[test]
    fn complete_offscreen_visibility_transition_blocker_keeps_effects_blocked() {
        let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
        let previous_lanes = Lanes::OFFSCREEN;
        let previous_child_lanes = Lanes::from(Lane::RETRY_1);
        let work_in_progress_lanes = Lanes::DEFAULT;
        let work_in_progress_child_lanes = Lanes::from(Lane::TRANSITION_1);
        let (arena, previous, work_in_progress, first_child, second_child) =
            offscreen_complete_transition_pair(
                "complete-hidden-panel",
                StateHandle::from_raw(904),
                StateHandle::NONE,
                previous_lanes,
                previous_child_lanes,
                work_in_progress_lanes,
                work_in_progress_child_lanes,
            );

        let record = complete_offscreen_visibility_transition_blocker_for_test(
            &arena,
            work_in_progress,
            render_lanes,
        )
        .unwrap();

        assert_eq!(record.offscreen(), work_in_progress);
        assert_eq!(record.child(), Some(first_child));
        assert_eq!(record.child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(record.child_sibling(), Some(second_child));
        assert_eq!(record.child_sibling_tag(), Some(FiberTag::HostText));
        assert_eq!(record.flags(), FiberFlags::NO);
        assert_eq!(record.subtree_flags(), FiberFlags::NO);
        assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
        let transition = record.transition();
        assert_eq!(transition.previous(), previous);
        assert_eq!(transition.work_in_progress(), work_in_progress);
        assert_eq!(
            transition.key().map(ReactKey::as_str),
            Some("complete-hidden-panel")
        );
        assert_eq!(
            transition.mode(),
            UnsupportedOffscreenVisibilityMode::Visible
        );
        assert_eq!(
            transition.previous_visibility(),
            UnsupportedOffscreenVisibility::Hidden
        );
        assert_eq!(
            transition.current_visibility(),
            UnsupportedOffscreenVisibility::Visible
        );
        assert_eq!(
            transition.transition(),
            UnsupportedOffscreenVisibilityTransitionKind::HiddenToVisible
        );
        assert_eq!(
            transition.child_traversal_blocker(),
            UnsupportedOffscreenVisibilityChildTraversalBlocker::CompleteWorkDoesNotBubbleChildrenOrScheduleVisibility
        );
        assert_eq!(transition.render_lanes(), render_lanes);
        assert_eq!(transition.previous_lanes(), previous_lanes);
        assert_eq!(transition.previous_child_lanes(), previous_child_lanes);
        assert_eq!(transition.work_in_progress_lanes(), work_in_progress_lanes);
        assert_eq!(
            transition.work_in_progress_child_lanes(),
            work_in_progress_child_lanes
        );
        assert!(transition.render_includes_offscreen_lane());
        assert!(!transition.work_in_progress_includes_offscreen_lane());
        assert_eq!(arena.get(work_in_progress).unwrap().flags(), FiberFlags::NO);
        assert_eq!(
            arena.get(work_in_progress).unwrap().subtree_flags(),
            FiberFlags::NO
        );
        assert!(
            arena
                .get(first_child)
                .unwrap()
                .flags()
                .contains_all(FiberFlags::PLACEMENT)
        );

        let render_lanes = Lanes::DEFAULT;
        let previous_lanes = Lanes::SYNC;
        let previous_child_lanes = Lanes::from(Lane::TRANSITION_2);
        let work_in_progress_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
        let work_in_progress_child_lanes = Lanes::from(Lane::RETRY_2);
        let (arena, previous, work_in_progress, first_child, second_child) =
            offscreen_complete_transition_pair(
                "complete-visible-panel",
                StateHandle::NONE,
                StateHandle::from_raw(905),
                previous_lanes,
                previous_child_lanes,
                work_in_progress_lanes,
                work_in_progress_child_lanes,
            );

        let record = complete_offscreen_visibility_transition_blocker_for_test(
            &arena,
            work_in_progress,
            render_lanes,
        )
        .unwrap();

        assert_eq!(record.offscreen(), work_in_progress);
        assert_eq!(record.child(), Some(first_child));
        assert_eq!(record.child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(record.child_sibling(), Some(second_child));
        assert_eq!(record.child_sibling_tag(), Some(FiberTag::HostText));
        assert_eq!(record.flags(), FiberFlags::NO);
        assert_eq!(record.subtree_flags(), FiberFlags::NO);
        assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
        let transition = record.transition();
        assert_eq!(transition.previous(), previous);
        assert_eq!(transition.work_in_progress(), work_in_progress);
        assert_eq!(
            transition.key().map(ReactKey::as_str),
            Some("complete-visible-panel")
        );
        assert_eq!(
            transition.mode(),
            UnsupportedOffscreenVisibilityMode::Hidden
        );
        assert_eq!(
            transition.previous_visibility(),
            UnsupportedOffscreenVisibility::Visible
        );
        assert_eq!(
            transition.current_visibility(),
            UnsupportedOffscreenVisibility::Hidden
        );
        assert_eq!(
            transition.transition(),
            UnsupportedOffscreenVisibilityTransitionKind::VisibleToHidden
        );
        assert_eq!(
            transition.child_traversal_blocker(),
            UnsupportedOffscreenVisibilityChildTraversalBlocker::CompleteWorkDoesNotBubbleChildrenOrScheduleVisibility
        );
        assert_eq!(transition.render_lanes(), render_lanes);
        assert_eq!(transition.previous_lanes(), previous_lanes);
        assert_eq!(transition.previous_child_lanes(), previous_child_lanes);
        assert_eq!(transition.work_in_progress_lanes(), work_in_progress_lanes);
        assert_eq!(
            transition.work_in_progress_child_lanes(),
            work_in_progress_child_lanes
        );
        assert!(!transition.render_includes_offscreen_lane());
        assert!(transition.work_in_progress_includes_offscreen_lane());
        assert!(
            !arena
                .get(work_in_progress)
                .unwrap()
                .flags()
                .contains_any(FiberFlags::VISIBILITY)
        );
        assert_eq!(
            arena.get(work_in_progress).unwrap().subtree_flags(),
            FiberFlags::NO
        );
        assert!(
            arena
                .get(first_child)
                .unwrap()
                .flags()
                .contains_all(FiberFlags::PLACEMENT)
        );
    }

    #[test]
    fn complete_host_root_one_level_child_set_bubbles_multiple_host_children() {
        let mut arena = FiberArena::new();
        let host_root =
            arena.create_fiber(FiberTag::HostRoot, None, PropsHandle::NONE, FiberMode::NO);
        let first = arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::from_raw(20),
            FiberMode::NO,
        );
        let second = arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::from_raw(21),
            FiberMode::NO,
        );
        arena.set_children(host_root, &[first, second]).unwrap();
        arena.get_mut(first).unwrap().set_lanes(Lanes::DEFAULT);
        arena
            .get_mut(second)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);

        let record =
            complete_host_root_one_level_child_set_for_test(&mut arena, host_root, 2).unwrap();

        assert_eq!(record.host_root(), host_root);
        assert_eq!(record.child_count(), 2);
        assert_eq!(record.first_child(), first);
        assert_eq!(record.first_child_tag(), FiberTag::HostComponent);
        assert_eq!(record.last_child(), second);
        assert_eq!(record.last_child_tag(), FiberTag::HostText);
        assert_eq!(record.child_lanes(), Lanes::DEFAULT);
        assert!(record.subtree_flags().contains_all(FiberFlags::PLACEMENT));

        let root_node = arena.get(host_root).unwrap();
        assert_eq!(root_node.child_lanes(), Lanes::DEFAULT);
        assert!(
            root_node
                .subtree_flags()
                .contains_all(FiberFlags::PLACEMENT)
        );
    }

    #[test]
    fn complete_host_root_one_level_child_set_fails_closed_for_invalid_shape() {
        let mut non_root_arena = FiberArena::new();
        let non_root = non_root_arena.create_fiber(
            FiberTag::HostComponent,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        assert_eq!(
            complete_host_root_one_level_child_set_for_test(&mut non_root_arena, non_root, 2),
            Err(
                HostRootOneLevelChildSetCompletionError::UnexpectedHostRootTag {
                    fiber: non_root,
                    tag: FiberTag::HostComponent,
                },
            )
        );

        let mut count_arena = FiberArena::new();
        let host_root =
            count_arena.create_fiber(FiberTag::HostRoot, None, PropsHandle::NONE, FiberMode::NO);
        let only_child =
            count_arena.create_fiber(FiberTag::HostText, None, PropsHandle::NONE, FiberMode::NO);
        count_arena.set_children(host_root, &[only_child]).unwrap();
        assert_eq!(
            complete_host_root_one_level_child_set_for_test(&mut count_arena, host_root, 2),
            Err(
                HostRootOneLevelChildSetCompletionError::ChildCountMismatch {
                    host_root,
                    expected: 2,
                    actual: 1,
                },
            )
        );

        let mut unsupported_arena = FiberArena::new();
        let unsupported_root = unsupported_arena.create_fiber(
            FiberTag::HostRoot,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let unsupported_child = unsupported_arena.create_fiber(
            FiberTag::Fragment,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        let host_child = unsupported_arena.create_fiber(
            FiberTag::HostText,
            None,
            PropsHandle::NONE,
            FiberMode::NO,
        );
        unsupported_arena
            .set_children(unsupported_root, &[unsupported_child, host_child])
            .unwrap();
        assert_eq!(
            complete_host_root_one_level_child_set_for_test(
                &mut unsupported_arena,
                unsupported_root,
                2,
            ),
            Err(
                HostRootOneLevelChildSetCompletionError::UnsupportedChildTag {
                    host_root: unsupported_root,
                    child: unsupported_child,
                    tag: FiberTag::Fragment,
                },
            )
        );
        assert_eq!(
            unsupported_arena
                .get(unsupported_root)
                .unwrap()
                .subtree_flags(),
            FiberFlags::NO
        );
    }
}
