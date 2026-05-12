use super::*;

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

#[allow(
    clippy::result_large_err,
    reason = "private Offscreen canary diagnostics intentionally return complete begin/complete-work evidence"
)]
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
