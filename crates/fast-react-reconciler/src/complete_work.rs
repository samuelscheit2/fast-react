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
    ContextProviderUseContextOpenScopeBeginWorkRecord, UnsupportedOffscreenChildShapeKind,
    UnsupportedOffscreenChildShapeRecord, UnsupportedOffscreenVisibility,
    UnsupportedOffscreenVisibilityChildTraversalBlocker,
    UnsupportedOffscreenVisibilityTransitionKind, UnsupportedOffscreenVisibilityTransitionRecord,
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum OffscreenVisibilitySubtreeFlagBubblingIntent {
    BubbleVisibleSubtree,
    BubbleHiddenSubtreeAtOffscreenLane,
    DeferHiddenSubtreeUntilOffscreenLane,
    SkipCapturedHiddenSubtree,
}

impl OffscreenVisibilitySubtreeFlagBubblingIntent {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::BubbleVisibleSubtree => "bubble-visible-subtree",
            Self::BubbleHiddenSubtreeAtOffscreenLane => "bubble-hidden-subtree-at-offscreen-lane",
            Self::DeferHiddenSubtreeUntilOffscreenLane => {
                "defer-hidden-subtree-until-offscreen-lane"
            }
            Self::SkipCapturedHiddenSubtree => "skip-captured-hidden-subtree",
        }
    }

    #[must_use]
    pub const fn should_bubble_subtree_flags(self) -> bool {
        matches!(
            self,
            Self::BubbleVisibleSubtree | Self::BubbleHiddenSubtreeAtOffscreenLane
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum OffscreenVisibilitySubtreeFlagBubblingBlocker {
    CompleteWorkDoesNotApplyBubbledChildLanesOrSubtreeFlags,
}

impl OffscreenVisibilitySubtreeFlagBubblingBlocker {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::CompleteWorkDoesNotApplyBubbledChildLanesOrSubtreeFlags => {
                "complete-work-does-not-apply-bubbled-child-lanes-or-subtree-flags"
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum OffscreenVisibilityEffectSchedulingBlocker {
    CompleteWorkDoesNotSetVisibilityFlag,
}

impl OffscreenVisibilityEffectSchedulingBlocker {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::CompleteWorkDoesNotSetVisibilityFlag => {
                "complete-work-does-not-set-visibility-flag"
            }
        }
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
    begin_work_transition: UnsupportedOffscreenVisibilityTransitionRecord,
    transition: UnsupportedOffscreenVisibilityTransitionRecord,
    subtree_flag_bubbling_intent: OffscreenVisibilitySubtreeFlagBubblingIntent,
    subtree_flag_bubbling_blocker: OffscreenVisibilitySubtreeFlagBubblingBlocker,
    candidate_child_lanes: Lanes,
    candidate_subtree_flags: FiberFlags,
    would_schedule_visibility_effect: bool,
    would_schedule_visibility_for_subtree_mutation: bool,
    visibility_effect_scheduling_blocker: OffscreenVisibilityEffectSchedulingBlocker,
    child_traversal_blocked: bool,
    host_mutation_blocked: bool,
    public_compatibility_blocked: bool,
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
    pub const fn begin_work_transition(&self) -> &UnsupportedOffscreenVisibilityTransitionRecord {
        &self.begin_work_transition
    }

    #[must_use]
    pub const fn transition(&self) -> &UnsupportedOffscreenVisibilityTransitionRecord {
        &self.transition
    }

    #[must_use]
    pub const fn subtree_flag_bubbling_intent(
        &self,
    ) -> OffscreenVisibilitySubtreeFlagBubblingIntent {
        self.subtree_flag_bubbling_intent
    }

    #[must_use]
    pub const fn subtree_flag_bubbling_blocker(
        &self,
    ) -> OffscreenVisibilitySubtreeFlagBubblingBlocker {
        self.subtree_flag_bubbling_blocker
    }

    #[must_use]
    pub const fn candidate_child_lanes(&self) -> Lanes {
        self.candidate_child_lanes
    }

    #[must_use]
    pub const fn candidate_subtree_flags(&self) -> FiberFlags {
        self.candidate_subtree_flags
    }

    #[must_use]
    pub const fn would_schedule_visibility_effect(&self) -> bool {
        self.would_schedule_visibility_effect
    }

    #[must_use]
    pub const fn would_schedule_visibility_for_subtree_mutation(&self) -> bool {
        self.would_schedule_visibility_for_subtree_mutation
    }

    #[must_use]
    pub const fn visibility_effect_scheduling_blocker(
        &self,
    ) -> OffscreenVisibilityEffectSchedulingBlocker {
        self.visibility_effect_scheduling_blocker
    }

    #[must_use]
    pub const fn child_traversal_blocked(&self) -> bool {
        self.child_traversal_blocked
    }

    #[must_use]
    pub const fn host_mutation_blocked(&self) -> bool {
        self.host_mutation_blocked
    }

    #[must_use]
    pub const fn public_compatibility_blocked(&self) -> bool {
        self.public_compatibility_blocked
    }

    #[must_use]
    pub const fn feature(&self) -> &'static str {
        self.feature
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum OffscreenRevealCommitMetadataStatus {
    AcceptedHiddenToVisibleReveal,
}

impl OffscreenRevealCommitMetadataStatus {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::AcceptedHiddenToVisibleReveal => "accepted-hidden-to-visible-reveal",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct OffscreenRevealCommitMetadataRecord {
    offscreen: FiberId,
    child: FiberId,
    child_tag: FiberTag,
    committed_lanes: Lanes,
    transition: UnsupportedOffscreenVisibilityTransitionRecord,
    subtree_flag_bubbling_intent: OffscreenVisibilitySubtreeFlagBubblingIntent,
    status: OffscreenRevealCommitMetadataStatus,
    suspensey_commit_flag: FiberFlags,
    candidate_subtree_flags: FiberFlags,
    child_may_suspend_commit: bool,
    would_accumulate_newly_visible_suspensey_commit: bool,
    would_unhide_host_children: bool,
    visibility_effect_required: bool,
    visibility_flag_set: bool,
    host_visibility_mutation_blocked: bool,
    passive_visibility_effects_blocked: bool,
    public_compatibility_blocked: bool,
    feature: &'static str,
}

impl OffscreenRevealCommitMetadataRecord {
    #[must_use]
    pub const fn offscreen(&self) -> FiberId {
        self.offscreen
    }

    #[must_use]
    pub const fn child(&self) -> FiberId {
        self.child
    }

    #[must_use]
    pub const fn child_tag(&self) -> FiberTag {
        self.child_tag
    }

    #[must_use]
    pub const fn committed_lanes(&self) -> Lanes {
        self.committed_lanes
    }

    #[must_use]
    pub const fn transition(&self) -> &UnsupportedOffscreenVisibilityTransitionRecord {
        &self.transition
    }

    #[must_use]
    pub const fn subtree_flag_bubbling_intent(
        &self,
    ) -> OffscreenVisibilitySubtreeFlagBubblingIntent {
        self.subtree_flag_bubbling_intent
    }

    #[must_use]
    pub const fn status(&self) -> OffscreenRevealCommitMetadataStatus {
        self.status
    }

    #[must_use]
    pub const fn suspensey_commit_flag(&self) -> FiberFlags {
        self.suspensey_commit_flag
    }

    #[must_use]
    pub const fn candidate_subtree_flags(&self) -> FiberFlags {
        self.candidate_subtree_flags
    }

    #[must_use]
    pub const fn child_may_suspend_commit(&self) -> bool {
        self.child_may_suspend_commit
    }

    #[must_use]
    pub const fn would_accumulate_newly_visible_suspensey_commit(&self) -> bool {
        self.would_accumulate_newly_visible_suspensey_commit
    }

    #[must_use]
    pub const fn would_unhide_host_children(&self) -> bool {
        self.would_unhide_host_children
    }

    #[must_use]
    pub const fn visibility_effect_required(&self) -> bool {
        self.visibility_effect_required
    }

    #[must_use]
    pub const fn visibility_flag_set(&self) -> bool {
        self.visibility_flag_set
    }

    #[must_use]
    pub const fn host_visibility_mutation_blocked(&self) -> bool {
        self.host_visibility_mutation_blocked
    }

    #[must_use]
    pub const fn passive_visibility_effects_blocked(&self) -> bool {
        self.passive_visibility_effects_blocked
    }

    #[must_use]
    pub const fn public_compatibility_blocked(&self) -> bool {
        self.public_compatibility_blocked
    }

    #[must_use]
    pub const fn feature(&self) -> &'static str {
        self.feature
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum OffscreenRevealCommitMetadataError {
    UnsupportedVisibilityTransition {
        offscreen: FiberId,
        transition: UnsupportedOffscreenVisibilityTransitionKind,
    },
    UnsupportedSubtreeBubblingIntent {
        offscreen: FiberId,
        intent: OffscreenVisibilitySubtreeFlagBubblingIntent,
    },
    MissingOffscreenChild {
        offscreen: FiberId,
    },
    UnsupportedOffscreenChild {
        offscreen: FiberId,
        child: FiberId,
        child_tag: FiberTag,
        child_sibling: Option<FiberId>,
        child_sibling_tag: Option<FiberTag>,
    },
}

impl Display for OffscreenRevealCommitMetadataError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnsupportedVisibilityTransition {
                offscreen,
                transition,
            } => write!(
                formatter,
                "Offscreen fiber {} cannot accept private reveal commit metadata for {} transition",
                offscreen.slot().get(),
                transition.as_str()
            ),
            Self::UnsupportedSubtreeBubblingIntent { offscreen, intent } => write!(
                formatter,
                "Offscreen fiber {} cannot accept private reveal commit metadata with {} bubbling intent",
                offscreen.slot().get(),
                intent.as_str()
            ),
            Self::MissingOffscreenChild { offscreen } => write!(
                formatter,
                "Offscreen fiber {} cannot accept private reveal commit metadata without a child",
                offscreen.slot().get()
            ),
            Self::UnsupportedOffscreenChild {
                offscreen,
                child,
                child_tag,
                child_sibling,
                child_sibling_tag,
            } => write!(
                formatter,
                "Offscreen fiber {} cannot accept private reveal commit metadata for child {} ({:?}) with sibling {:?} ({:?})",
                offscreen.slot().get(),
                child.slot().get(),
                child_tag,
                child_sibling.map(|fiber| fiber.slot().get()),
                child_sibling_tag
            ),
        }
    }
}

impl Error for OffscreenRevealCommitMetadataError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum OffscreenVisibilityTransitionCompleteWorkBlockerError {
    FiberTopology(FiberTopologyError),
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    UnsupportedOffscreenShape {
        offscreen: FiberId,
        shape: UnsupportedOffscreenChildShapeKind,
    },
    StaleBeginWorkOffscreen {
        offscreen: FiberId,
        begin_work_offscreen: FiberId,
    },
    StaleBeginWorkChildShape {
        offscreen: FiberId,
        begin_work_child: Option<FiberId>,
        current_child: Option<FiberId>,
        begin_work_child_sibling: Option<FiberId>,
        current_child_sibling: Option<FiberId>,
    },
    MissingBeginWorkVisibilityTransition {
        offscreen: FiberId,
    },
    MissingVisibilityTransition {
        offscreen: FiberId,
    },
    StaleBeginWorkVisibilityTransition {
        offscreen: FiberId,
        begin_work_transition: UnsupportedOffscreenVisibilityTransitionRecord,
        complete_work_transition: UnsupportedOffscreenVisibilityTransitionRecord,
    },
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
            Self::UnsupportedOffscreenShape { offscreen, shape } => write!(
                formatter,
                "Offscreen fiber {} has unsupported {} child shape for private visibility transition complete-work blocker diagnostics",
                offscreen.slot().get(),
                shape.as_str()
            ),
            Self::StaleBeginWorkOffscreen {
                offscreen,
                begin_work_offscreen,
            } => write!(
                formatter,
                "Offscreen fiber {} cannot complete private visibility transition diagnostics from stale begin-work record for fiber {}",
                offscreen.slot().get(),
                begin_work_offscreen.slot().get()
            ),
            Self::StaleBeginWorkChildShape {
                offscreen,
                begin_work_child,
                current_child,
                begin_work_child_sibling,
                current_child_sibling,
            } => write!(
                formatter,
                "Offscreen fiber {} has stale begin-work child shape for private visibility transition complete-work blocker diagnostics; begin child {:?}/sibling {:?}, current child {:?}/sibling {:?}",
                offscreen.slot().get(),
                begin_work_child.map(|fiber| fiber.slot().get()),
                begin_work_child_sibling.map(|fiber| fiber.slot().get()),
                current_child.map(|fiber| fiber.slot().get()),
                current_child_sibling.map(|fiber| fiber.slot().get())
            ),
            Self::MissingBeginWorkVisibilityTransition { offscreen } => write!(
                formatter,
                "Offscreen fiber {} begin-work record has no hidden/visible transition for private complete-work blocker diagnostics",
                offscreen.slot().get()
            ),
            Self::MissingVisibilityTransition { offscreen } => write!(
                formatter,
                "Offscreen fiber {} has no hidden/visible transition for private complete-work blocker diagnostics",
                offscreen.slot().get()
            ),
            Self::StaleBeginWorkVisibilityTransition {
                offscreen,
                begin_work_transition,
                complete_work_transition,
            } => write!(
                formatter,
                "Offscreen fiber {} has stale begin-work visibility transition for private complete-work blocker diagnostics; begin {} from {} to {} with render lanes {:?}, complete {} from {} to {} with render lanes {:?}",
                offscreen.slot().get(),
                begin_work_transition.transition().as_str(),
                begin_work_transition.previous_visibility().as_str(),
                begin_work_transition.current_visibility().as_str(),
                begin_work_transition.render_lanes(),
                complete_work_transition.transition().as_str(),
                complete_work_transition.previous_visibility().as_str(),
                complete_work_transition.current_visibility().as_str(),
                complete_work_transition.render_lanes()
            ),
        }
    }
}

impl Error for OffscreenVisibilityTransitionCompleteWorkBlockerError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::UnexpectedFiberTag { .. }
            | Self::UnsupportedOffscreenShape { .. }
            | Self::StaleBeginWorkOffscreen { .. }
            | Self::StaleBeginWorkChildShape { .. }
            | Self::MissingBeginWorkVisibilityTransition { .. }
            | Self::MissingVisibilityTransition { .. }
            | Self::StaleBeginWorkVisibilityTransition { .. } => None,
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
    begin_work: &UnsupportedOffscreenChildShapeRecord,
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

    if begin_work.fiber() != offscreen {
        return Err(
            OffscreenVisibilityTransitionCompleteWorkBlockerError::StaleBeginWorkOffscreen {
                offscreen,
                begin_work_offscreen: begin_work.fiber(),
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
    let current_shape = match (child, child_sibling) {
        (None, _) => UnsupportedOffscreenChildShapeKind::Empty,
        (Some(_), None) => UnsupportedOffscreenChildShapeKind::SingleChild,
        (Some(_), Some(_)) => UnsupportedOffscreenChildShapeKind::MultipleChildren,
    };

    if begin_work.shape() != UnsupportedOffscreenChildShapeKind::SingleChild {
        return Err(
            OffscreenVisibilityTransitionCompleteWorkBlockerError::UnsupportedOffscreenShape {
                offscreen,
                shape: begin_work.shape(),
            },
        );
    }

    if current_shape != UnsupportedOffscreenChildShapeKind::SingleChild {
        return Err(
            OffscreenVisibilityTransitionCompleteWorkBlockerError::UnsupportedOffscreenShape {
                offscreen,
                shape: current_shape,
            },
        );
    }

    if begin_work.child() != child || begin_work.child_sibling() != child_sibling {
        return Err(
            OffscreenVisibilityTransitionCompleteWorkBlockerError::StaleBeginWorkChildShape {
                offscreen,
                begin_work_child: begin_work.child(),
                current_child: child,
                begin_work_child_sibling: begin_work.child_sibling(),
                current_child_sibling: child_sibling,
            },
        );
    }

    let begin_work_transition = begin_work.visibility_transition().cloned().ok_or(
        OffscreenVisibilityTransitionCompleteWorkBlockerError::MissingBeginWorkVisibilityTransition {
            offscreen,
        },
    )?;

    let transition = unsupported_offscreen_visibility_transition_record(
        arena,
        offscreen,
        render_lanes,
        UnsupportedOffscreenVisibilityChildTraversalBlocker::CompleteWorkDoesNotBubbleChildrenOrScheduleVisibility,
    )?
    .ok_or(OffscreenVisibilityTransitionCompleteWorkBlockerError::MissingVisibilityTransition {
        offscreen,
    })?;

    if begin_work_transition.child_traversal_blocker()
        != UnsupportedOffscreenVisibilityChildTraversalBlocker::BeginWorkDoesNotTraverseOffscreenChildren
        || !begin_work_transition.has_same_transition_identity(&transition)
    {
        return Err(
            OffscreenVisibilityTransitionCompleteWorkBlockerError::StaleBeginWorkVisibilityTransition {
                offscreen,
                begin_work_transition,
                complete_work_transition: transition,
            },
        );
    }

    let child = child.expect("single-child shape guarantees an Offscreen child");
    let child_node = arena.get(child)?;
    let candidate_child_lanes = child_node.lanes().merge(child_node.child_lanes());
    let candidate_subtree_flags = child_node.flags() | child_node.subtree_flags();
    let subtree_flag_bubbling_intent =
        offscreen_visibility_subtree_flag_bubbling_intent(node.flags(), &transition);
    let would_schedule_visibility_for_subtree_mutation = subtree_flag_bubbling_intent
        == OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleHiddenSubtreeAtOffscreenLane
        && candidate_subtree_flags.contains_any(FiberFlags::PLACEMENT | FiberFlags::UPDATE);

    Ok(OffscreenVisibilityTransitionCompleteWorkBlockerRecord {
        offscreen,
        child: Some(child),
        child_tag,
        child_sibling,
        child_sibling_tag,
        flags: node.flags(),
        subtree_flags: node.subtree_flags(),
        begin_work_transition,
        transition,
        subtree_flag_bubbling_intent,
        subtree_flag_bubbling_blocker:
            OffscreenVisibilitySubtreeFlagBubblingBlocker::CompleteWorkDoesNotApplyBubbledChildLanesOrSubtreeFlags,
        candidate_child_lanes,
        candidate_subtree_flags,
        would_schedule_visibility_effect: true,
        would_schedule_visibility_for_subtree_mutation,
        visibility_effect_scheduling_blocker:
            OffscreenVisibilityEffectSchedulingBlocker::CompleteWorkDoesNotSetVisibilityFlag,
        child_traversal_blocked: true,
        host_mutation_blocked: true,
        public_compatibility_blocked: true,
        feature: OFFSCREEN_UNSUPPORTED_FEATURE,
    })
}

pub(crate) fn offscreen_reveal_commit_metadata_for_test(
    complete_work: &OffscreenVisibilityTransitionCompleteWorkBlockerRecord,
    committed_lanes: Lanes,
) -> Result<OffscreenRevealCommitMetadataRecord, OffscreenRevealCommitMetadataError> {
    let transition = complete_work.transition();
    if !transition.is_hidden_to_visible_reveal() {
        return Err(
            OffscreenRevealCommitMetadataError::UnsupportedVisibilityTransition {
                offscreen: complete_work.offscreen(),
                transition: transition.transition(),
            },
        );
    }

    let intent = complete_work.subtree_flag_bubbling_intent();
    if intent != OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleVisibleSubtree {
        return Err(
            OffscreenRevealCommitMetadataError::UnsupportedSubtreeBubblingIntent {
                offscreen: complete_work.offscreen(),
                intent,
            },
        );
    }

    let child =
        complete_work
            .child()
            .ok_or(OffscreenRevealCommitMetadataError::MissingOffscreenChild {
                offscreen: complete_work.offscreen(),
            })?;
    let child_tag = complete_work.child_tag().ok_or(
        OffscreenRevealCommitMetadataError::MissingOffscreenChild {
            offscreen: complete_work.offscreen(),
        },
    )?;
    if !matches!(child_tag, FiberTag::HostComponent | FiberTag::HostText)
        || complete_work.child_sibling().is_some()
    {
        return Err(
            OffscreenRevealCommitMetadataError::UnsupportedOffscreenChild {
                offscreen: complete_work.offscreen(),
                child,
                child_tag,
                child_sibling: complete_work.child_sibling(),
                child_sibling_tag: complete_work.child_sibling_tag(),
            },
        );
    }

    let candidate_subtree_flags = complete_work.candidate_subtree_flags();
    let child_may_suspend_commit =
        candidate_subtree_flags.contains_any(FiberFlags::MAY_SUSPEND_COMMIT);

    Ok(OffscreenRevealCommitMetadataRecord {
        offscreen: complete_work.offscreen(),
        child,
        child_tag,
        committed_lanes,
        transition: transition.clone(),
        subtree_flag_bubbling_intent: intent,
        status: OffscreenRevealCommitMetadataStatus::AcceptedHiddenToVisibleReveal,
        suspensey_commit_flag: FiberFlags::MAY_SUSPEND_COMMIT,
        candidate_subtree_flags,
        child_may_suspend_commit,
        would_accumulate_newly_visible_suspensey_commit: child_may_suspend_commit,
        would_unhide_host_children: true,
        visibility_effect_required: complete_work.would_schedule_visibility_effect(),
        visibility_flag_set: complete_work.flags().contains_any(FiberFlags::VISIBILITY),
        host_visibility_mutation_blocked: complete_work.host_mutation_blocked(),
        passive_visibility_effects_blocked: true,
        public_compatibility_blocked: complete_work.public_compatibility_blocked(),
        feature: complete_work.feature(),
    })
}

fn offscreen_visibility_subtree_flag_bubbling_intent(
    offscreen_flags: FiberFlags,
    transition: &UnsupportedOffscreenVisibilityTransitionRecord,
) -> OffscreenVisibilitySubtreeFlagBubblingIntent {
    if transition.current_visibility() == UnsupportedOffscreenVisibility::Visible {
        return OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleVisibleSubtree;
    }

    if offscreen_flags.contains_all(FiberFlags::DID_CAPTURE) {
        return OffscreenVisibilitySubtreeFlagBubblingIntent::SkipCapturedHiddenSubtree;
    }

    if transition.render_includes_offscreen_lane() {
        OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleHiddenSubtreeAtOffscreenLane
    } else {
        OffscreenVisibilitySubtreeFlagBubblingIntent::DeferHiddenSubtreeUntilOffscreenLane
    }
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
        BeginWorkError, BeginWorkRequest, ContextProviderBeginWorkRequest,
        UnsupportedOffscreenVisibility, UnsupportedOffscreenVisibilityChildTraversalBlocker,
        UnsupportedOffscreenVisibilityMode, UnsupportedOffscreenVisibilityTransitionKind,
        begin_work, begin_work_context_provider_use_context_child_for_complete_traversal,
    };
    use crate::function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextRenderReader,
        FunctionComponentInvocationError, FunctionComponentInvocationRequest,
        FunctionComponentInvoker, FunctionComponentOutputHandle, FunctionComponentRenderError,
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

    #[derive(Debug)]
    struct UnexpectedFunctionComponentInvoker;

    impl FunctionComponentInvoker for UnexpectedFunctionComponentInvoker {
        fn invoke_function_component(
            &mut self,
            _request: FunctionComponentInvocationRequest,
        ) -> Result<FunctionComponentOutputHandle, FunctionComponentInvocationError> {
            Err(FunctionComponentInvocationError::component_error(
                "unexpected function component invocation for complete-work Offscreen test",
            ))
        }
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
        second_child: bool,
    ) -> (FiberArena, FiberId, FiberId, FiberId, Option<FiberId>) {
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
        arena
            .get_mut(first_child)
            .unwrap()
            .merge_flags(FiberFlags::PLACEMENT);
        let second_child = if second_child {
            let second_child = arena.create_fiber(
                FiberTag::HostText,
                None,
                PropsHandle::from_raw(903),
                FiberMode::NO,
            );
            arena
                .set_children(work_in_progress, &[first_child, second_child])
                .unwrap();
            Some(second_child)
        } else {
            arena
                .set_children(work_in_progress, &[first_child])
                .unwrap();
            None
        };

        (arena, previous, work_in_progress, first_child, second_child)
    }

    fn offscreen_begin_work_visibility_record(
        arena: &mut FiberArena,
        offscreen: FiberId,
        render_lanes: Lanes,
    ) -> UnsupportedOffscreenChildShapeRecord {
        let mut invoker = UnexpectedFunctionComponentInvoker;
        match begin_work(
            arena,
            BeginWorkRequest::new(offscreen, render_lanes),
            &mut invoker,
        )
        .unwrap_err()
        {
            BeginWorkError::UnsupportedOffscreenChildShape(record) => record,
            other => panic!("expected Offscreen begin-work visibility record, got {other:?}"),
        }
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
        let (mut arena, previous, work_in_progress, first_child, second_child) =
            offscreen_complete_transition_pair(
                "complete-hidden-panel",
                StateHandle::from_raw(904),
                StateHandle::NONE,
                previous_lanes,
                previous_child_lanes,
                work_in_progress_lanes,
                work_in_progress_child_lanes,
                false,
            );
        arena
            .get_mut(first_child)
            .unwrap()
            .merge_flags(FiberFlags::MAY_SUSPEND_COMMIT);
        let begin_work_record =
            offscreen_begin_work_visibility_record(&mut arena, work_in_progress, render_lanes);

        let record = complete_offscreen_visibility_transition_blocker_for_test(
            &arena,
            work_in_progress,
            &begin_work_record,
            render_lanes,
        )
        .unwrap();

        assert_eq!(record.offscreen(), work_in_progress);
        assert_eq!(record.child(), Some(first_child));
        assert_eq!(record.child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(record.child_sibling(), second_child);
        assert_eq!(record.child_sibling_tag(), None);
        assert_eq!(record.flags(), FiberFlags::NO);
        assert_eq!(record.subtree_flags(), FiberFlags::NO);
        assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
        let transition = record.transition();
        assert!(
            record
                .begin_work_transition()
                .has_same_transition_identity(transition)
        );
        assert_eq!(
            record.begin_work_transition().child_traversal_blocker(),
            UnsupportedOffscreenVisibilityChildTraversalBlocker::BeginWorkDoesNotTraverseOffscreenChildren
        );
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
        assert_eq!(
            record.subtree_flag_bubbling_intent(),
            OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleVisibleSubtree
        );
        assert!(
            record
                .subtree_flag_bubbling_intent()
                .should_bubble_subtree_flags()
        );
        assert_eq!(
            record.subtree_flag_bubbling_intent().as_str(),
            "bubble-visible-subtree"
        );
        assert_eq!(
            record.subtree_flag_bubbling_blocker(),
            OffscreenVisibilitySubtreeFlagBubblingBlocker::CompleteWorkDoesNotApplyBubbledChildLanesOrSubtreeFlags
        );
        assert_eq!(
            record.subtree_flag_bubbling_blocker().as_str(),
            "complete-work-does-not-apply-bubbled-child-lanes-or-subtree-flags"
        );
        assert_eq!(record.candidate_child_lanes(), Lanes::NO);
        assert!(
            record
                .candidate_subtree_flags()
                .contains_all(FiberFlags::PLACEMENT | FiberFlags::MAY_SUSPEND_COMMIT)
        );
        assert!(record.would_schedule_visibility_effect());
        assert!(!record.would_schedule_visibility_for_subtree_mutation());
        assert_eq!(
            record.visibility_effect_scheduling_blocker(),
            OffscreenVisibilityEffectSchedulingBlocker::CompleteWorkDoesNotSetVisibilityFlag
        );
        assert_eq!(
            record.visibility_effect_scheduling_blocker().as_str(),
            "complete-work-does-not-set-visibility-flag"
        );
        assert!(record.child_traversal_blocked());
        assert!(record.host_mutation_blocked());
        assert!(record.public_compatibility_blocked());
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
        let reveal = offscreen_reveal_commit_metadata_for_test(&record, render_lanes).unwrap();
        assert_eq!(reveal.offscreen(), work_in_progress);
        assert_eq!(reveal.child(), first_child);
        assert_eq!(reveal.child_tag(), FiberTag::HostComponent);
        assert_eq!(reveal.committed_lanes(), render_lanes);
        assert_eq!(
            reveal.transition().transition(),
            UnsupportedOffscreenVisibilityTransitionKind::HiddenToVisible
        );
        assert_eq!(
            reveal.subtree_flag_bubbling_intent(),
            OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleVisibleSubtree
        );
        assert_eq!(
            reveal.status(),
            OffscreenRevealCommitMetadataStatus::AcceptedHiddenToVisibleReveal
        );
        assert_eq!(
            reveal.status().as_str(),
            "accepted-hidden-to-visible-reveal"
        );
        assert_eq!(
            reveal.suspensey_commit_flag(),
            FiberFlags::MAY_SUSPEND_COMMIT
        );
        assert!(
            reveal
                .candidate_subtree_flags()
                .contains_all(FiberFlags::PLACEMENT | FiberFlags::MAY_SUSPEND_COMMIT)
        );
        assert!(reveal.child_may_suspend_commit());
        assert!(reveal.would_accumulate_newly_visible_suspensey_commit());
        assert!(reveal.would_unhide_host_children());
        assert!(reveal.visibility_effect_required());
        assert!(!reveal.visibility_flag_set());
        assert!(reveal.host_visibility_mutation_blocked());
        assert!(reveal.passive_visibility_effects_blocked());
        assert!(reveal.public_compatibility_blocked());
        assert_eq!(reveal.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);

        let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
        let previous_lanes = Lanes::SYNC;
        let previous_child_lanes = Lanes::from(Lane::TRANSITION_2);
        let work_in_progress_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
        let work_in_progress_child_lanes = Lanes::from(Lane::RETRY_2);
        let (mut arena, previous, work_in_progress, first_child, second_child) =
            offscreen_complete_transition_pair(
                "complete-visible-panel",
                StateHandle::NONE,
                StateHandle::from_raw(905),
                previous_lanes,
                previous_child_lanes,
                work_in_progress_lanes,
                work_in_progress_child_lanes,
                false,
            );
        arena
            .get_mut(first_child)
            .unwrap()
            .set_subtree_flags(FiberFlags::UPDATE);
        let begin_work_record =
            offscreen_begin_work_visibility_record(&mut arena, work_in_progress, render_lanes);

        let record = complete_offscreen_visibility_transition_blocker_for_test(
            &arena,
            work_in_progress,
            &begin_work_record,
            render_lanes,
        )
        .unwrap();

        assert_eq!(record.offscreen(), work_in_progress);
        assert_eq!(record.child(), Some(first_child));
        assert_eq!(record.child_tag(), Some(FiberTag::HostComponent));
        assert_eq!(record.child_sibling(), second_child);
        assert_eq!(record.child_sibling_tag(), None);
        assert_eq!(record.flags(), FiberFlags::NO);
        assert_eq!(record.subtree_flags(), FiberFlags::NO);
        assert_eq!(record.feature(), OFFSCREEN_UNSUPPORTED_FEATURE);
        let transition = record.transition();
        assert!(
            record
                .begin_work_transition()
                .has_same_transition_identity(transition)
        );
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
        assert!(transition.render_includes_offscreen_lane());
        assert!(transition.work_in_progress_includes_offscreen_lane());
        assert_eq!(
            record.subtree_flag_bubbling_intent(),
            OffscreenVisibilitySubtreeFlagBubblingIntent::BubbleHiddenSubtreeAtOffscreenLane
        );
        assert!(
            record
                .subtree_flag_bubbling_intent()
                .should_bubble_subtree_flags()
        );
        assert_eq!(record.candidate_child_lanes(), Lanes::NO);
        assert!(
            record
                .candidate_subtree_flags()
                .contains_all(FiberFlags::PLACEMENT | FiberFlags::UPDATE)
        );
        assert!(record.would_schedule_visibility_effect());
        assert!(record.would_schedule_visibility_for_subtree_mutation());
        assert_eq!(
            record.visibility_effect_scheduling_blocker(),
            OffscreenVisibilityEffectSchedulingBlocker::CompleteWorkDoesNotSetVisibilityFlag
        );
        assert!(record.child_traversal_blocked());
        assert!(record.host_mutation_blocked());
        assert!(record.public_compatibility_blocked());
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
        assert_eq!(
            offscreen_reveal_commit_metadata_for_test(&record, render_lanes),
            Err(
                OffscreenRevealCommitMetadataError::UnsupportedVisibilityTransition {
                    offscreen: work_in_progress,
                    transition: UnsupportedOffscreenVisibilityTransitionKind::VisibleToHidden,
                },
            )
        );
    }

    #[test]
    fn complete_offscreen_visibility_transition_blocker_rejects_shapes_and_stale_begin_work() {
        let render_lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
        let (mut arena, _, work_in_progress, _, _) = offscreen_complete_transition_pair(
            "complete-multiple-panel",
            StateHandle::from_raw(906),
            StateHandle::NONE,
            Lanes::OFFSCREEN,
            Lanes::NO,
            Lanes::DEFAULT,
            Lanes::NO,
            true,
        );
        let begin_work_record =
            offscreen_begin_work_visibility_record(&mut arena, work_in_progress, render_lanes);

        assert_eq!(
            complete_offscreen_visibility_transition_blocker_for_test(
                &arena,
                work_in_progress,
                &begin_work_record,
                render_lanes,
            ),
            Err(
                OffscreenVisibilityTransitionCompleteWorkBlockerError::UnsupportedOffscreenShape {
                    offscreen: work_in_progress,
                    shape: UnsupportedOffscreenChildShapeKind::MultipleChildren,
                },
            )
        );

        let (mut arena, _, work_in_progress, _, _) = offscreen_complete_transition_pair(
            "complete-stale-panel",
            StateHandle::from_raw(907),
            StateHandle::NONE,
            Lanes::OFFSCREEN,
            Lanes::NO,
            Lanes::DEFAULT,
            Lanes::NO,
            false,
        );
        let begin_work_record =
            offscreen_begin_work_visibility_record(&mut arena, work_in_progress, render_lanes);
        arena
            .get_mut(work_in_progress)
            .unwrap()
            .set_lanes(Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN));

        match complete_offscreen_visibility_transition_blocker_for_test(
            &arena,
            work_in_progress,
            &begin_work_record,
            render_lanes,
        ) {
            Err(
                OffscreenVisibilityTransitionCompleteWorkBlockerError::StaleBeginWorkVisibilityTransition {
                    offscreen,
                    begin_work_transition,
                    complete_work_transition,
                },
            ) => {
                assert_eq!(offscreen, work_in_progress);
                assert_eq!(begin_work_transition.work_in_progress(), work_in_progress);
                assert_eq!(complete_work_transition.work_in_progress(), work_in_progress);
                assert!(!begin_work_transition.has_same_transition_identity(
                    &complete_work_transition
                ));
                assert!(!begin_work_transition.work_in_progress_includes_offscreen_lane());
                assert!(complete_work_transition.work_in_progress_includes_offscreen_lane());
            }
            other => panic!("expected stale begin-work transition record, got {other:?}"),
        }
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
