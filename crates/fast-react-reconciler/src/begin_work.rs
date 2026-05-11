//! Private begin-work handoff for function components and narrow Fragment/array canaries.
//!
//! This is intentionally below the public work loop. The default handoff
//! delegates only the accepted function-component render skeleton and one
//! unkeyed Fragment with exactly one existing HostComponent/HostText child. The
//! private function-component single-child helper records one admitted
//! HostComponent/HostText output for root-loop canaries. The HostRoot child-set
//! helper validates only one-level unkeyed arrays or top-level unkeyed fragments
//! containing multiple host children. It does not implement broad
//! reconciliation, complete host work, commit effects, mutate hosts, keyed
//! diffing, or root switching.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{
    ContextFrameId, ContextHandle, ContextStackError, ContextStackSnapshot, ContextValueHandle,
    DependenciesHandle, FiberArena, FiberFlags, FiberId, FiberMode, FiberTag, FiberTopologyError,
    Lane, Lanes, PropsHandle, ReactKey, StateHandle, StateNodeHandle, UpdateQueueHandle,
};

use crate::{
    RootElementHandle,
    function_component::{
        FunctionComponentContextConsumerInvoker, FunctionComponentContextDependencyHandle,
        FunctionComponentContextDependencyRecord, FunctionComponentContextReadRecord,
        FunctionComponentContextRenderState, FunctionComponentContextRenderStore,
        FunctionComponentHookRenderResult, FunctionComponentHookRenderStore,
        FunctionComponentInvoker, FunctionComponentOutputHandle, FunctionComponentRenderError,
        FunctionComponentRenderRecord, FunctionComponentSingleChildOutputResolver,
        FunctionComponentSingleChildReconciliationError,
        FunctionComponentSingleChildReconciliationRecord, FunctionComponentStateActionHandle,
        FunctionComponentUseContextRenderRecord, FunctionComponentUseStateHookRenderRecord,
        FunctionComponentUseStateRenderRecord, FunctionComponentUseStateRenderRequest,
        reconcile_function_component_single_child_output, render_function_component,
        render_function_component_with_context_reads,
        render_function_component_with_required_use_context,
        render_function_component_with_use_context, render_function_component_with_use_state,
    },
    unsupported_features::{
        ACTIVITY_UNSUPPORTED_FEATURE, OFFSCREEN_UNSUPPORTED_FEATURE,
        SUSPENSE_LIST_UNSUPPORTED_FEATURE, SUSPENSE_UNSUPPORTED_FEATURE,
    },
};

pub(crate) const PORTAL_RECONCILER_UNSUPPORTED_FEATURE: &str = "Reconciler.fiber.Portal";
pub(crate) const CONTEXT_PROVIDER_SUBTREE_TRAVERSAL_MAX_FIBERS: usize = 16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedThenableIdentityClass {
    NoThenable,
    OpaqueWakeable,
    SuspenseyCommitResource,
    OpaqueWakeableAndSuspenseyCommitResource,
}

impl UnsupportedThenableIdentityClass {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::NoThenable => "no-thenable",
            Self::OpaqueWakeable => "opaque-wakeable",
            Self::SuspenseyCommitResource => "suspensey-commit-resource",
            Self::OpaqueWakeableAndSuspenseyCommitResource => {
                "opaque-wakeable-and-suspensey-commit-resource"
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedThenableRetryQueueKind {
    None,
    SuspenseBoundary,
    PrimaryOffscreen,
    SuspenseBoundaryAndPrimaryOffscreen,
    Offscreen,
}

impl UnsupportedThenableRetryQueueKind {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::None => "none",
            Self::SuspenseBoundary => "suspense-boundary",
            Self::PrimaryOffscreen => "primary-offscreen",
            Self::SuspenseBoundaryAndPrimaryOffscreen => "suspense-boundary-and-primary-offscreen",
            Self::Offscreen => "offscreen",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct UnsupportedThenablePingBlockerRecord {
    thenable_identity_class: UnsupportedThenableIdentityClass,
    ping_lane: Lane,
    ping_lanes: Lanes,
    retry_queue_kind: UnsupportedThenableRetryQueueKind,
    retry_queue: UpdateQueueHandle,
    primary_offscreen_retry_queue: Option<UpdateQueueHandle>,
    schedule_retry_flag: bool,
    primary_child_rendering_blocked: bool,
    fallback_child_rendering_blocked: bool,
}

impl UnsupportedThenablePingBlockerRecord {
    #[must_use]
    pub(crate) const fn thenable_identity_class(self) -> UnsupportedThenableIdentityClass {
        self.thenable_identity_class
    }

    #[must_use]
    pub(crate) const fn ping_lane(self) -> Lane {
        self.ping_lane
    }

    #[must_use]
    pub(crate) const fn ping_lanes(self) -> Lanes {
        self.ping_lanes
    }

    #[must_use]
    pub(crate) const fn retry_queue_kind(self) -> UnsupportedThenableRetryQueueKind {
        self.retry_queue_kind
    }

    #[must_use]
    pub(crate) const fn retry_queue(self) -> UpdateQueueHandle {
        self.retry_queue
    }

    #[must_use]
    pub(crate) const fn primary_offscreen_retry_queue(self) -> Option<UpdateQueueHandle> {
        self.primary_offscreen_retry_queue
    }

    #[must_use]
    pub(crate) const fn schedule_retry_flag(self) -> bool {
        self.schedule_retry_flag
    }

    #[must_use]
    pub(crate) const fn primary_child_rendering_blocked(self) -> bool {
        self.primary_child_rendering_blocked
    }

    #[must_use]
    pub(crate) const fn fallback_child_rendering_blocked(self) -> bool {
        self.fallback_child_rendering_blocked
    }

    #[must_use]
    pub(crate) const fn has_suspense_boundary_retry_queue(self) -> bool {
        self.retry_queue.is_some()
            && matches!(
                self.retry_queue_kind,
                UnsupportedThenableRetryQueueKind::SuspenseBoundary
                    | UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen
            )
    }

    #[must_use]
    pub(crate) const fn is_offscreen_only_retry_queue(self) -> bool {
        matches!(
            self.retry_queue_kind,
            UnsupportedThenableRetryQueueKind::PrimaryOffscreen
                | UnsupportedThenableRetryQueueKind::Offscreen
        )
    }

    #[must_use]
    pub(crate) const fn has_compatible_retry_ping_lanes(self) -> bool {
        self.ping_lane.is_non_empty()
            && self.ping_lanes.is_non_empty()
            && self.ping_lanes.contains_lane(self.ping_lane)
            && self.ping_lanes.includes_only_retries()
    }

    #[must_use]
    pub(crate) const fn is_accepted_suspense_retry_ping_blocker(self) -> bool {
        self.has_suspense_boundary_retry_queue() && self.has_compatible_retry_ping_lanes()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct BeginWorkRequest {
    work_in_progress: FiberId,
    render_lanes: Lanes,
}

impl BeginWorkRequest {
    #[must_use]
    pub const fn new(work_in_progress: FiberId, render_lanes: Lanes) -> Self {
        Self {
            work_in_progress,
            render_lanes,
        }
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum BeginWorkResult {
    FunctionComponent(FunctionComponentBeginWorkRecord),
    Fragment(FragmentSingleHostChildBeginWorkRecord),
}

impl BeginWorkResult {
    #[must_use]
    pub fn function_component(self) -> FunctionComponentBeginWorkRecord {
        match self {
            Self::FunctionComponent(record) => record,
            Self::Fragment(_) => panic!("begin-work result was not a FunctionComponent"),
        }
    }

    #[must_use]
    pub fn fragment(self) -> FragmentSingleHostChildBeginWorkRecord {
        match self {
            Self::Fragment(record) => record,
            Self::FunctionComponent(_) => panic!("begin-work result was not a Fragment"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct UnsupportedPortalBeginWorkRecord {
    fiber: FiberId,
    key: Option<ReactKey>,
    pending_props: PropsHandle,
    state_node: StateNodeHandle,
    child: Option<FiberId>,
    render_lanes: Lanes,
    feature: &'static str,
}

impl UnsupportedPortalBeginWorkRecord {
    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) fn key(&self) -> Option<&ReactKey> {
        self.key.as_ref()
    }

    #[must_use]
    pub(crate) const fn pending_props(&self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn child(&self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn feature(&self) -> &'static str {
        self.feature
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedSuspenseChildShapeKind {
    Empty,
    PrimaryOffscreen,
    PrimaryOffscreenWithFallback,
    Dehydrated,
    UnsupportedPrimary,
}

impl UnsupportedSuspenseChildShapeKind {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::Empty => "empty",
            Self::PrimaryOffscreen => "primary-offscreen",
            Self::PrimaryOffscreenWithFallback => "primary-offscreen-with-fallback",
            Self::Dehydrated => "dehydrated",
            Self::UnsupportedPrimary => "unsupported-primary",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct UnsupportedSuspenseChildShapeRecord {
    fiber: FiberId,
    key: Option<ReactKey>,
    pending_props: PropsHandle,
    memoized_state: StateHandle,
    child: Option<FiberId>,
    child_tag: Option<FiberTag>,
    fallback_child: Option<FiberId>,
    fallback_child_tag: Option<FiberTag>,
    render_lanes: Lanes,
    thenable_ping_blocker: UnsupportedThenablePingBlockerRecord,
    shape: UnsupportedSuspenseChildShapeKind,
    feature: &'static str,
}

impl UnsupportedSuspenseChildShapeRecord {
    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) fn key(&self) -> Option<&ReactKey> {
        self.key.as_ref()
    }

    #[must_use]
    pub(crate) const fn pending_props(&self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub(crate) const fn memoized_state(&self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub(crate) const fn child(&self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub(crate) const fn child_tag(&self) -> Option<FiberTag> {
        self.child_tag
    }

    #[must_use]
    pub(crate) const fn fallback_child(&self) -> Option<FiberId> {
        self.fallback_child
    }

    #[must_use]
    pub(crate) const fn fallback_child_tag(&self) -> Option<FiberTag> {
        self.fallback_child_tag
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn thenable_ping_blocker(&self) -> UnsupportedThenablePingBlockerRecord {
        self.thenable_ping_blocker
    }

    #[must_use]
    pub(crate) const fn shape(&self) -> UnsupportedSuspenseChildShapeKind {
        self.shape
    }

    #[must_use]
    pub(crate) const fn feature(&self) -> &'static str {
        self.feature
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedOffscreenChildShapeKind {
    Empty,
    SingleChild,
    MultipleChildren,
}

impl UnsupportedOffscreenChildShapeKind {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::Empty => "empty",
            Self::SingleChild => "single-child",
            Self::MultipleChildren => "multiple-children",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct UnsupportedOffscreenChildShapeRecord {
    fiber: FiberId,
    key: Option<ReactKey>,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    memoized_state: StateHandle,
    state_node: StateNodeHandle,
    child: Option<FiberId>,
    child_tag: Option<FiberTag>,
    child_sibling: Option<FiberId>,
    child_sibling_tag: Option<FiberTag>,
    render_lanes: Lanes,
    thenable_ping_blocker: UnsupportedThenablePingBlockerRecord,
    shape: UnsupportedOffscreenChildShapeKind,
    visibility_transition: Option<UnsupportedOffscreenVisibilityTransitionRecord>,
    feature: &'static str,
}

impl UnsupportedOffscreenChildShapeRecord {
    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) fn key(&self) -> Option<&ReactKey> {
        self.key.as_ref()
    }

    #[must_use]
    pub(crate) const fn pending_props(&self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub(crate) const fn memoized_props(&self) -> PropsHandle {
        self.memoized_props
    }

    #[must_use]
    pub(crate) const fn memoized_state(&self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn child(&self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub(crate) const fn child_tag(&self) -> Option<FiberTag> {
        self.child_tag
    }

    #[must_use]
    pub(crate) const fn child_sibling(&self) -> Option<FiberId> {
        self.child_sibling
    }

    #[must_use]
    pub(crate) const fn child_sibling_tag(&self) -> Option<FiberTag> {
        self.child_sibling_tag
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn thenable_ping_blocker(&self) -> UnsupportedThenablePingBlockerRecord {
        self.thenable_ping_blocker
    }

    #[must_use]
    pub(crate) const fn shape(&self) -> UnsupportedOffscreenChildShapeKind {
        self.shape
    }

    #[must_use]
    pub(crate) fn visibility_transition(
        &self,
    ) -> Option<&UnsupportedOffscreenVisibilityTransitionRecord> {
        self.visibility_transition.as_ref()
    }

    #[must_use]
    pub(crate) const fn feature(&self) -> &'static str {
        self.feature
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedOffscreenVisibilityMode {
    Visible,
    Hidden,
}

impl UnsupportedOffscreenVisibilityMode {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::Visible => "visible",
            Self::Hidden => "hidden",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedOffscreenVisibility {
    Visible,
    Hidden,
}

impl UnsupportedOffscreenVisibility {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::Visible => "visible",
            Self::Hidden => "hidden",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedOffscreenVisibilityTransitionKind {
    HiddenToVisible,
    VisibleToHidden,
}

impl UnsupportedOffscreenVisibilityTransitionKind {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::HiddenToVisible => "hidden-to-visible",
            Self::VisibleToHidden => "visible-to-hidden",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedOffscreenVisibilityChildTraversalBlocker {
    BeginWorkDoesNotTraverseOffscreenChildren,
    CompleteWorkDoesNotBubbleChildrenOrScheduleVisibility,
}

impl UnsupportedOffscreenVisibilityChildTraversalBlocker {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::BeginWorkDoesNotTraverseOffscreenChildren => {
                "begin-work-does-not-traverse-offscreen-children"
            }
            Self::CompleteWorkDoesNotBubbleChildrenOrScheduleVisibility => {
                "complete-work-does-not-bubble-children-or-schedule-visibility"
            }
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct UnsupportedOffscreenVisibilityTransitionRecord {
    work_in_progress: FiberId,
    previous: FiberId,
    key: Option<ReactKey>,
    mode: UnsupportedOffscreenVisibilityMode,
    previous_visibility: UnsupportedOffscreenVisibility,
    current_visibility: UnsupportedOffscreenVisibility,
    transition: UnsupportedOffscreenVisibilityTransitionKind,
    child_traversal_blocker: UnsupportedOffscreenVisibilityChildTraversalBlocker,
    render_lanes: Lanes,
    work_in_progress_lanes: Lanes,
    work_in_progress_child_lanes: Lanes,
    previous_lanes: Lanes,
    previous_child_lanes: Lanes,
    render_includes_offscreen_lane: bool,
    work_in_progress_includes_offscreen_lane: bool,
}

impl UnsupportedOffscreenVisibilityTransitionRecord {
    #[must_use]
    pub(crate) const fn work_in_progress(&self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub(crate) const fn previous(&self) -> FiberId {
        self.previous
    }

    #[must_use]
    pub(crate) fn key(&self) -> Option<&ReactKey> {
        self.key.as_ref()
    }

    #[must_use]
    pub(crate) const fn mode(&self) -> UnsupportedOffscreenVisibilityMode {
        self.mode
    }

    #[must_use]
    pub(crate) const fn previous_visibility(&self) -> UnsupportedOffscreenVisibility {
        self.previous_visibility
    }

    #[must_use]
    pub(crate) const fn current_visibility(&self) -> UnsupportedOffscreenVisibility {
        self.current_visibility
    }

    #[must_use]
    pub(crate) const fn transition(&self) -> UnsupportedOffscreenVisibilityTransitionKind {
        self.transition
    }

    #[must_use]
    pub(crate) const fn child_traversal_blocker(
        &self,
    ) -> UnsupportedOffscreenVisibilityChildTraversalBlocker {
        self.child_traversal_blocker
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn work_in_progress_lanes(&self) -> Lanes {
        self.work_in_progress_lanes
    }

    #[must_use]
    pub(crate) const fn work_in_progress_child_lanes(&self) -> Lanes {
        self.work_in_progress_child_lanes
    }

    #[must_use]
    pub(crate) const fn previous_lanes(&self) -> Lanes {
        self.previous_lanes
    }

    #[must_use]
    pub(crate) const fn previous_child_lanes(&self) -> Lanes {
        self.previous_child_lanes
    }

    #[must_use]
    pub(crate) const fn render_includes_offscreen_lane(&self) -> bool {
        self.render_includes_offscreen_lane
    }

    #[must_use]
    pub(crate) const fn work_in_progress_includes_offscreen_lane(&self) -> bool {
        self.work_in_progress_includes_offscreen_lane
    }

    #[must_use]
    pub(crate) const fn is_hidden_to_visible_reveal(&self) -> bool {
        matches!(
            self.transition,
            UnsupportedOffscreenVisibilityTransitionKind::HiddenToVisible
        )
    }

    #[must_use]
    pub(crate) const fn is_visible_to_hidden_hide(&self) -> bool {
        matches!(
            self.transition,
            UnsupportedOffscreenVisibilityTransitionKind::VisibleToHidden
        )
    }

    #[must_use]
    pub(crate) const fn records_offscreen_lane_participation(&self) -> bool {
        self.render_includes_offscreen_lane || self.work_in_progress_includes_offscreen_lane
    }

    #[must_use]
    pub(crate) fn has_same_transition_identity(&self, other: &Self) -> bool {
        self.work_in_progress == other.work_in_progress
            && self.previous == other.previous
            && self.key == other.key
            && self.mode == other.mode
            && self.previous_visibility == other.previous_visibility
            && self.current_visibility == other.current_visibility
            && self.transition == other.transition
            && self.render_lanes == other.render_lanes
            && self.work_in_progress_lanes == other.work_in_progress_lanes
            && self.work_in_progress_child_lanes == other.work_in_progress_child_lanes
            && self.previous_lanes == other.previous_lanes
            && self.previous_child_lanes == other.previous_child_lanes
            && self.render_includes_offscreen_lane == other.render_includes_offscreen_lane
            && self.work_in_progress_includes_offscreen_lane
                == other.work_in_progress_includes_offscreen_lane
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedSuspenseListChildShapeKind {
    Empty,
    SingleChild,
    MultipleChildren,
}

impl UnsupportedSuspenseListChildShapeKind {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::Empty => "empty",
            Self::SingleChild => "single-child",
            Self::MultipleChildren => "multiple-children",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct UnsupportedSuspenseListChildShapeRecord {
    fiber: FiberId,
    key: Option<ReactKey>,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    memoized_state: StateHandle,
    child: Option<FiberId>,
    child_tag: Option<FiberTag>,
    child_sibling: Option<FiberId>,
    child_sibling_tag: Option<FiberTag>,
    render_lanes: Lanes,
    shape: UnsupportedSuspenseListChildShapeKind,
    feature: &'static str,
}

impl UnsupportedSuspenseListChildShapeRecord {
    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) fn key(&self) -> Option<&ReactKey> {
        self.key.as_ref()
    }

    #[must_use]
    pub(crate) const fn pending_props(&self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub(crate) const fn memoized_props(&self) -> PropsHandle {
        self.memoized_props
    }

    #[must_use]
    pub(crate) const fn memoized_state(&self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub(crate) const fn child(&self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub(crate) const fn child_tag(&self) -> Option<FiberTag> {
        self.child_tag
    }

    #[must_use]
    pub(crate) const fn child_sibling(&self) -> Option<FiberId> {
        self.child_sibling
    }

    #[must_use]
    pub(crate) const fn child_sibling_tag(&self) -> Option<FiberTag> {
        self.child_sibling_tag
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn shape(&self) -> UnsupportedSuspenseListChildShapeKind {
        self.shape
    }

    #[must_use]
    pub(crate) const fn feature(&self) -> &'static str {
        self.feature
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnsupportedActivityChildShapeKind {
    Empty,
    PrimaryOffscreen,
    PrimaryOffscreenWithSibling,
    Dehydrated,
    UnsupportedPrimary,
}

impl UnsupportedActivityChildShapeKind {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::Empty => "empty",
            Self::PrimaryOffscreen => "primary-offscreen",
            Self::PrimaryOffscreenWithSibling => "primary-offscreen-with-sibling",
            Self::Dehydrated => "dehydrated",
            Self::UnsupportedPrimary => "unsupported-primary",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct UnsupportedActivityChildShapeRecord {
    fiber: FiberId,
    key: Option<ReactKey>,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    memoized_state: StateHandle,
    state_node: StateNodeHandle,
    child: Option<FiberId>,
    child_tag: Option<FiberTag>,
    child_sibling: Option<FiberId>,
    child_sibling_tag: Option<FiberTag>,
    render_lanes: Lanes,
    shape: UnsupportedActivityChildShapeKind,
    feature: &'static str,
}

impl UnsupportedActivityChildShapeRecord {
    #[must_use]
    pub(crate) const fn fiber(&self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub(crate) fn key(&self) -> Option<&ReactKey> {
        self.key.as_ref()
    }

    #[must_use]
    pub(crate) const fn pending_props(&self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub(crate) const fn memoized_props(&self) -> PropsHandle {
        self.memoized_props
    }

    #[must_use]
    pub(crate) const fn memoized_state(&self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub(crate) const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    #[must_use]
    pub(crate) const fn child(&self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub(crate) const fn child_tag(&self) -> Option<FiberTag> {
        self.child_tag
    }

    #[must_use]
    pub(crate) const fn child_sibling(&self) -> Option<FiberId> {
        self.child_sibling
    }

    #[must_use]
    pub(crate) const fn child_sibling_tag(&self) -> Option<FiberTag> {
        self.child_sibling_tag
    }

    #[must_use]
    pub(crate) const fn render_lanes(&self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn shape(&self) -> UnsupportedActivityChildShapeKind {
        self.shape
    }

    #[must_use]
    pub(crate) const fn feature(&self) -> &'static str {
        self.feature
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentBeginWorkRecord {
    render: FunctionComponentRenderRecord,
}

impl FunctionComponentBeginWorkRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn current(self) -> Option<FiberId> {
        self.render.current()
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.render.work_in_progress()
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render.render_lanes()
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.render.output()
    }

    #[must_use]
    pub const fn context_state(self) -> Option<FunctionComponentContextRenderState> {
        self.render.context_state()
    }

    #[must_use]
    pub const fn context_read_count(self) -> usize {
        self.render.context_read_count()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentBeginWorkBailoutBlockerRecord {
    current: FiberId,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    current_lanes_before: Lanes,
    current_lanes_after: Lanes,
    skipped_lanes: Lanes,
    child: Option<FiberId>,
    child_lanes: Lanes,
    child_to_visit: Option<FiberId>,
    context_dependency_count: usize,
    context_dependency_lanes: Lanes,
    work_in_progress_update_queue_before: UpdateQueueHandle,
    work_in_progress_update_queue_after: UpdateQueueHandle,
    work_in_progress_dependencies_before: DependenciesHandle,
    work_in_progress_dependencies_after: DependenciesHandle,
    reused_update_queue: UpdateQueueHandle,
    reused_dependencies: DependenciesHandle,
    work_in_progress_flags_before: FiberFlags,
    work_in_progress_flags_after: FiberFlags,
    removed_hook_effect_flags: FiberFlags,
    child_traversal_blocked: bool,
}

impl FunctionComponentBeginWorkBailoutBlockerRecord {
    #[must_use]
    pub const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn pending_props(self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub const fn memoized_props(self) -> PropsHandle {
        self.memoized_props
    }

    #[must_use]
    pub const fn current_lanes_before(self) -> Lanes {
        self.current_lanes_before
    }

    #[must_use]
    pub const fn current_lanes_after(self) -> Lanes {
        self.current_lanes_after
    }

    #[must_use]
    pub const fn skipped_lanes(self) -> Lanes {
        self.skipped_lanes
    }

    #[must_use]
    pub const fn child(self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub const fn child_lanes(self) -> Lanes {
        self.child_lanes
    }

    #[must_use]
    pub const fn child_to_visit(self) -> Option<FiberId> {
        self.child_to_visit
    }

    #[must_use]
    pub const fn context_dependency_count(self) -> usize {
        self.context_dependency_count
    }

    #[must_use]
    pub const fn context_dependency_lanes(self) -> Lanes {
        self.context_dependency_lanes
    }

    #[must_use]
    pub const fn work_in_progress_update_queue_before(self) -> UpdateQueueHandle {
        self.work_in_progress_update_queue_before
    }

    #[must_use]
    pub const fn work_in_progress_update_queue_after(self) -> UpdateQueueHandle {
        self.work_in_progress_update_queue_after
    }

    #[must_use]
    pub const fn work_in_progress_dependencies_before(self) -> DependenciesHandle {
        self.work_in_progress_dependencies_before
    }

    #[must_use]
    pub const fn work_in_progress_dependencies_after(self) -> DependenciesHandle {
        self.work_in_progress_dependencies_after
    }

    #[must_use]
    pub const fn reused_update_queue(self) -> UpdateQueueHandle {
        self.reused_update_queue
    }

    #[must_use]
    pub const fn reused_dependencies(self) -> DependenciesHandle {
        self.reused_dependencies
    }

    #[must_use]
    pub const fn work_in_progress_flags_before(self) -> FiberFlags {
        self.work_in_progress_flags_before
    }

    #[must_use]
    pub const fn work_in_progress_flags_after(self) -> FiberFlags {
        self.work_in_progress_flags_after
    }

    #[must_use]
    pub const fn removed_hook_effect_flags(self) -> FiberFlags {
        self.removed_hook_effect_flags
    }

    #[must_use]
    pub const fn child_traversal_blocked(self) -> bool {
        self.child_traversal_blocked
    }

    #[must_use]
    pub fn reused_hook_update_queue(self) -> bool {
        self.work_in_progress_update_queue_after == self.reused_update_queue
    }

    #[must_use]
    pub fn reused_current_dependencies(self) -> bool {
        self.work_in_progress_dependencies_after == self.reused_dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentSingleChildBeginWorkRecord {
    begin_work: FunctionComponentBeginWorkRecord,
    single_child: FunctionComponentSingleChildReconciliationRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseStateBeginWorkRecord {
    begin_work: FunctionComponentBeginWorkRecord,
    hook_result: FunctionComponentHookRenderResult,
    state_hook: FunctionComponentUseStateHookRenderRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseContextBeginWorkRecord {
    render: FunctionComponentUseContextRenderRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FragmentSingleHostChildBeginWorkRecord {
    fragment: FiberId,
    current: Option<FiberId>,
    child: FiberId,
    child_tag: FiberTag,
    pending_props: PropsHandle,
    child_pending_props: PropsHandle,
    render_lanes: Lanes,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootOneLevelChildSetKind {
    Array,
    Fragment,
}

impl HostRootOneLevelChildSetKind {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Array => "array",
            Self::Fragment => "fragment",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootOneLevelChildSet {
    root_element: RootElementHandle,
    kind: HostRootOneLevelChildSetKind,
    key: Option<ReactKey>,
    entries: Vec<HostRootOneLevelChildSetEntry>,
}

impl HostRootOneLevelChildSet {
    #[must_use]
    pub fn array(
        root_element: RootElementHandle,
        entries: Vec<HostRootOneLevelChildSetEntry>,
    ) -> Self {
        Self {
            root_element,
            kind: HostRootOneLevelChildSetKind::Array,
            key: None,
            entries,
        }
    }

    #[must_use]
    pub fn fragment(
        root_element: RootElementHandle,
        key: Option<ReactKey>,
        entries: Vec<HostRootOneLevelChildSetEntry>,
    ) -> Self {
        Self {
            root_element,
            kind: HostRootOneLevelChildSetKind::Fragment,
            key,
            entries,
        }
    }

    #[must_use]
    pub const fn root_element(&self) -> RootElementHandle {
        self.root_element
    }

    #[must_use]
    pub const fn kind(&self) -> HostRootOneLevelChildSetKind {
        self.kind
    }

    #[must_use]
    pub fn key(&self) -> Option<&ReactKey> {
        self.key.as_ref()
    }

    #[must_use]
    pub fn entries(&self) -> &[HostRootOneLevelChildSetEntry] {
        &self.entries
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootOneLevelChildSetEntry {
    Host {
        element: RootElementHandle,
    },
    KeyedHost {
        element: RootElementHandle,
        key: ReactKey,
    },
    NestedArray {
        first_child: Option<RootElementHandle>,
    },
    NestedFragment {
        key: Option<ReactKey>,
        first_child: Option<RootElementHandle>,
    },
}

impl HostRootOneLevelChildSetEntry {
    #[must_use]
    pub const fn host(element: RootElementHandle) -> Self {
        Self::Host { element }
    }

    #[must_use]
    pub fn keyed_host(element: RootElementHandle, key: ReactKey) -> Self {
        Self::KeyedHost { element, key }
    }

    #[must_use]
    pub const fn nested_array(first_child: Option<RootElementHandle>) -> Self {
        Self::NestedArray { first_child }
    }

    #[must_use]
    pub fn nested_fragment(key: Option<ReactKey>, first_child: Option<RootElementHandle>) -> Self {
        Self::NestedFragment { key, first_child }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootOneLevelChildSetBeginWorkRecord {
    root_element: RootElementHandle,
    kind: HostRootOneLevelChildSetKind,
    child_count: usize,
    first_child: RootElementHandle,
    last_child: RootElementHandle,
    children: Vec<RootElementHandle>,
}

impl HostRootOneLevelChildSetBeginWorkRecord {
    #[must_use]
    pub const fn root_element(&self) -> RootElementHandle {
        self.root_element
    }

    #[must_use]
    pub const fn kind(&self) -> HostRootOneLevelChildSetKind {
        self.kind
    }

    #[must_use]
    pub const fn child_count(&self) -> usize {
        self.child_count
    }

    #[must_use]
    pub const fn first_child(&self) -> RootElementHandle {
        self.first_child
    }

    #[must_use]
    pub const fn last_child(&self) -> RootElementHandle {
        self.last_child
    }

    #[must_use]
    pub fn children(&self) -> &[RootElementHandle] {
        &self.children
    }
}

impl FragmentSingleHostChildBeginWorkRecord {
    #[must_use]
    pub const fn fragment(self) -> FiberId {
        self.fragment
    }

    #[must_use]
    pub const fn current(self) -> Option<FiberId> {
        self.current
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
    }

    #[must_use]
    pub const fn child_tag(self) -> FiberTag {
        self.child_tag
    }

    #[must_use]
    pub const fn pending_props(self) -> PropsHandle {
        self.pending_props
    }

    #[must_use]
    pub const fn child_pending_props(self) -> PropsHandle {
        self.child_pending_props
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }
}

impl FunctionComponentSingleChildBeginWorkRecord {
    #[must_use]
    pub const fn begin_work(self) -> FunctionComponentBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub const fn single_child(self) -> FunctionComponentSingleChildReconciliationRecord {
        self.single_child
    }

    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.begin_work.render()
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.begin_work.work_in_progress()
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.begin_work.output()
    }
}

impl FunctionComponentUseStateBeginWorkRecord {
    #[must_use]
    pub const fn begin_work(self) -> FunctionComponentBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.begin_work.render()
    }

    #[must_use]
    pub const fn hook_result(self) -> FunctionComponentHookRenderResult {
        self.hook_result
    }

    #[must_use]
    pub const fn state_hook(self) -> FunctionComponentUseStateHookRenderRecord {
        self.state_hook
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.begin_work.work_in_progress()
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.begin_work.output()
    }
}

impl FunctionComponentUseContextBeginWorkRecord {
    #[must_use]
    pub const fn render(self) -> FunctionComponentRenderRecord {
        self.render.render()
    }

    #[must_use]
    pub const fn use_context_render(self) -> FunctionComponentUseContextRenderRecord {
        self.render
    }

    #[must_use]
    pub const fn context_read(self) -> FunctionComponentContextReadRecord {
        self.render.context_read()
    }

    #[must_use]
    pub const fn context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.render.context_dependency()
    }

    #[must_use]
    pub const fn current(self) -> Option<FiberId> {
        self.render.current()
    }

    #[must_use]
    pub const fn work_in_progress(self) -> FiberId {
        self.render.work_in_progress()
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render.render_lanes()
    }

    #[must_use]
    pub const fn output(self) -> FunctionComponentOutputHandle {
        self.render.output()
    }

    #[must_use]
    pub const fn context_read_count(self) -> usize {
        self.render.context_read_count()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderBeginWorkRequest {
    provider: FiberId,
    render_lanes: Lanes,
    context: ContextHandle,
    value: ContextValueHandle,
}

impl ContextProviderBeginWorkRequest {
    #[must_use]
    pub const fn new(
        provider: FiberId,
        render_lanes: Lanes,
        context: ContextHandle,
        value: ContextValueHandle,
    ) -> Self {
        Self {
            provider,
            render_lanes,
            context,
            value,
        }
    }

    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn value(self) -> ContextValueHandle {
        self.value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderBeginWorkRecord {
    provider: FiberId,
    child: FiberId,
    context: ContextHandle,
    value: ContextValueHandle,
    provider_snapshot: ContextStackSnapshot,
    pushed_stack_depth: usize,
    restored_stack_depth: usize,
    child_begin_work: FunctionComponentBeginWorkRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUseContextBeginWorkRecord {
    provider: FiberId,
    child: FiberId,
    context: ContextHandle,
    value: ContextValueHandle,
    provider_snapshot: ContextStackSnapshot,
    pushed_stack_depth: usize,
    restored_stack_depth: usize,
    child_begin_work: FunctionComponentUseContextBeginWorkRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUseContextSingleChildBeginWorkRecord {
    begin_work: ContextProviderUseContextBeginWorkRecord,
    single_child: FunctionComponentSingleChildReconciliationRecord,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUseContextOpenScopeBeginWorkRecord {
    provider: FiberId,
    child: FiberId,
    context: ContextHandle,
    value: ContextValueHandle,
    provider_snapshot: ContextStackSnapshot,
    provider_token: ContextFrameId,
    pushed_stack_depth: usize,
    child_begin_work: FunctionComponentUseContextBeginWorkRecord,
}

#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord {
    begin_work: ContextProviderUseContextOpenScopeBeginWorkRecord,
    single_child: FunctionComponentSingleChildReconciliationRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderSubtreeVisitedFiberRecord {
    traversal_index: usize,
    fiber: FiberId,
    tag: FiberTag,
    depth: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct ContextProviderSubtreeUseContextConsumerBeginWorkRecord {
    traversal_index: usize,
    depth: usize,
    fiber: FiberId,
    child_begin_work: FunctionComponentUseContextBeginWorkRecord,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ContextProviderSubtreeUseContextBeginWorkRecord {
    provider: FiberId,
    context: ContextHandle,
    value: ContextValueHandle,
    provider_snapshot: ContextStackSnapshot,
    provider_token: ContextFrameId,
    pushed_stack_depth: usize,
    restored_stack_depth: usize,
    visited_fibers: Vec<ContextProviderSubtreeVisitedFiberRecord>,
    consumers: Vec<ContextProviderSubtreeUseContextConsumerBeginWorkRecord>,
}

impl ContextProviderSubtreeVisitedFiberRecord {
    #[must_use]
    pub const fn new(traversal_index: usize, fiber: FiberId, tag: FiberTag, depth: usize) -> Self {
        Self {
            traversal_index,
            fiber,
            tag,
            depth,
        }
    }

    #[must_use]
    pub const fn traversal_index(self) -> usize {
        self.traversal_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub const fn depth(self) -> usize {
        self.depth
    }
}

impl ContextProviderSubtreeUseContextConsumerBeginWorkRecord {
    #[must_use]
    pub const fn traversal_index(self) -> usize {
        self.traversal_index
    }

    #[must_use]
    pub const fn depth(self) -> usize {
        self.depth
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.child_begin_work
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.child_begin_work.render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.child_begin_work.output()
    }

    #[must_use]
    pub const fn child_context_read(self) -> FunctionComponentContextReadRecord {
        self.child_begin_work.context_read()
    }

    #[must_use]
    pub const fn child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.child_begin_work.context_dependency()
    }
}

impl ContextProviderSubtreeUseContextBeginWorkRecord {
    #[must_use]
    pub const fn provider(&self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn context(&self) -> ContextHandle {
        self.context
    }

    #[must_use]
    pub const fn value(&self) -> ContextValueHandle {
        self.value
    }

    #[must_use]
    pub const fn provider_snapshot(&self) -> ContextStackSnapshot {
        self.provider_snapshot
    }

    #[must_use]
    pub const fn provider_token(&self) -> ContextFrameId {
        self.provider_token
    }

    #[must_use]
    pub const fn pushed_stack_depth(&self) -> usize {
        self.pushed_stack_depth
    }

    #[must_use]
    pub const fn restored_stack_depth(&self) -> usize {
        self.restored_stack_depth
    }

    #[must_use]
    pub fn visited_fibers(&self) -> &[ContextProviderSubtreeVisitedFiberRecord] {
        &self.visited_fibers
    }

    #[must_use]
    pub fn consumers(&self) -> &[ContextProviderSubtreeUseContextConsumerBeginWorkRecord] {
        &self.consumers
    }

    #[must_use]
    pub fn consumer_count(&self) -> usize {
        self.consumers.len()
    }
}

impl ContextProviderBeginWorkRecord {
    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
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
    pub const fn pushed_stack_depth(self) -> usize {
        self.pushed_stack_depth
    }

    #[must_use]
    pub const fn restored_stack_depth(self) -> usize {
        self.restored_stack_depth
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentBeginWorkRecord {
        self.child_begin_work
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.child_begin_work.render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.child_begin_work.output()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.child_begin_work.context_read_count()
    }
}

impl ContextProviderUseContextBeginWorkRecord {
    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
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
    pub const fn pushed_stack_depth(self) -> usize {
        self.pushed_stack_depth
    }

    #[must_use]
    pub const fn restored_stack_depth(self) -> usize {
        self.restored_stack_depth
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.child_begin_work
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.child_begin_work.render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.child_begin_work.output()
    }

    #[must_use]
    pub const fn child_context_read(self) -> FunctionComponentContextReadRecord {
        self.child_begin_work.context_read()
    }

    #[must_use]
    pub const fn child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.child_begin_work.context_dependency()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.child_begin_work.context_read_count()
    }
}

impl ContextProviderUseContextSingleChildBeginWorkRecord {
    #[must_use]
    pub const fn begin_work(self) -> ContextProviderUseContextBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub const fn single_child(self) -> FunctionComponentSingleChildReconciliationRecord {
        self.single_child
    }

    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.begin_work.provider()
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.begin_work.child()
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.begin_work.context()
    }

    #[must_use]
    pub const fn value(self) -> ContextValueHandle {
        self.begin_work.value()
    }

    #[must_use]
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.begin_work.provider_snapshot()
    }

    #[must_use]
    pub const fn pushed_stack_depth(self) -> usize {
        self.begin_work.pushed_stack_depth()
    }

    #[must_use]
    pub const fn restored_stack_depth(self) -> usize {
        self.begin_work.restored_stack_depth()
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.begin_work.child_begin_work()
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.begin_work.child_render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.begin_work.child_output()
    }

    #[must_use]
    pub const fn child_context_read(self) -> FunctionComponentContextReadRecord {
        self.begin_work.child_context_read()
    }

    #[must_use]
    pub const fn child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.begin_work.child_context_dependency()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.begin_work.child_context_read_count()
    }

    #[must_use]
    pub const fn child_element(self) -> RootElementHandle {
        self.single_child.child_element()
    }

    #[must_use]
    pub const fn child_tag(self) -> FiberTag {
        self.single_child.child_tag()
    }
}

#[cfg(test)]
impl ContextProviderUseContextOpenScopeBeginWorkRecord {
    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.provider
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
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
    pub const fn provider_token(self) -> ContextFrameId {
        self.provider_token
    }

    #[must_use]
    pub const fn pushed_stack_depth(self) -> usize {
        self.pushed_stack_depth
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.child_begin_work
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.child_begin_work.render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.child_begin_work.output()
    }

    #[must_use]
    pub const fn child_context_read(self) -> FunctionComponentContextReadRecord {
        self.child_begin_work.context_read()
    }

    #[must_use]
    pub const fn child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.child_begin_work.context_dependency()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.child_begin_work.context_read_count()
    }
}

#[cfg(test)]
impl ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord {
    #[must_use]
    pub const fn begin_work(self) -> ContextProviderUseContextOpenScopeBeginWorkRecord {
        self.begin_work
    }

    #[must_use]
    pub const fn single_child(self) -> FunctionComponentSingleChildReconciliationRecord {
        self.single_child
    }

    #[must_use]
    pub const fn provider(self) -> FiberId {
        self.begin_work.provider()
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.begin_work.child()
    }

    #[must_use]
    pub const fn context(self) -> ContextHandle {
        self.begin_work.context()
    }

    #[must_use]
    pub const fn value(self) -> ContextValueHandle {
        self.begin_work.value()
    }

    #[must_use]
    pub const fn provider_snapshot(self) -> ContextStackSnapshot {
        self.begin_work.provider_snapshot()
    }

    #[must_use]
    pub const fn provider_token(self) -> ContextFrameId {
        self.begin_work.provider_token()
    }

    #[must_use]
    pub const fn pushed_stack_depth(self) -> usize {
        self.begin_work.pushed_stack_depth()
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.begin_work.child_begin_work()
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.begin_work.child_render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.begin_work.child_output()
    }

    #[must_use]
    pub const fn child_context_read(self) -> FunctionComponentContextReadRecord {
        self.begin_work.child_context_read()
    }

    #[must_use]
    pub const fn child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.begin_work.child_context_dependency()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.begin_work.child_context_read_count()
    }

    #[must_use]
    pub const fn child_element(self) -> RootElementHandle {
        self.single_child.child_element()
    }

    #[must_use]
    pub const fn child_tag(self) -> FiberTag {
        self.single_child.child_tag()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct NestedContextProviderBeginWorkRequest {
    outer_provider: FiberId,
    render_lanes: Lanes,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
}

impl NestedContextProviderBeginWorkRequest {
    #[must_use]
    pub const fn new(
        outer_provider: FiberId,
        render_lanes: Lanes,
        outer_context: ContextHandle,
        outer_value: ContextValueHandle,
        inner_context: ContextHandle,
        inner_value: ContextValueHandle,
    ) -> Self {
        Self {
            outer_provider,
            render_lanes,
            outer_context,
            outer_value,
            inner_context,
            inner_value,
        }
    }

    #[must_use]
    pub const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    pub const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    pub const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SiblingContextProviderBeginWorkRequest {
    first_provider: FiberId,
    render_lanes: Lanes,
    first_context: ContextHandle,
    first_value: ContextValueHandle,
    second_context: ContextHandle,
    second_value: ContextValueHandle,
}

impl SiblingContextProviderBeginWorkRequest {
    #[must_use]
    pub const fn new(
        first_provider: FiberId,
        render_lanes: Lanes,
        first_context: ContextHandle,
        first_value: ContextValueHandle,
        second_context: ContextHandle,
        second_value: ContextValueHandle,
    ) -> Self {
        Self {
            first_provider,
            render_lanes,
            first_context,
            first_value,
            second_context,
            second_value,
        }
    }

    #[must_use]
    pub const fn first_provider(self) -> FiberId {
        self.first_provider
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn first_context(self) -> ContextHandle {
        self.first_context
    }

    #[must_use]
    pub const fn first_value(self) -> ContextValueHandle {
        self.first_value
    }

    #[must_use]
    pub const fn second_context(self) -> ContextHandle {
        self.second_context
    }

    #[must_use]
    pub const fn second_value(self) -> ContextValueHandle {
        self.second_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct NestedContextProviderBeginWorkRecord {
    outer_provider: FiberId,
    inner_provider: FiberId,
    child: FiberId,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
    outer_provider_snapshot: ContextStackSnapshot,
    inner_provider_snapshot: ContextStackSnapshot,
    outer_pushed_stack_depth: usize,
    inner_pushed_stack_depth: usize,
    inner_restored_stack_depth: usize,
    outer_restored_stack_depth: usize,
    child_begin_work: FunctionComponentBeginWorkRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct NestedContextProviderUseContextBeginWorkRecord {
    outer_provider: FiberId,
    inner_provider: FiberId,
    child: FiberId,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
    outer_provider_snapshot: ContextStackSnapshot,
    inner_provider_snapshot: ContextStackSnapshot,
    outer_pushed_stack_depth: usize,
    inner_pushed_stack_depth: usize,
    inner_restored_stack_depth: usize,
    outer_restored_stack_depth: usize,
    child_begin_work: FunctionComponentUseContextBeginWorkRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct NestedContextProviderTwoConsumerUseContextBeginWorkRecord {
    outer_provider: FiberId,
    inner_provider: FiberId,
    first_child: FiberId,
    second_child: FiberId,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
    outer_provider_snapshot: ContextStackSnapshot,
    inner_provider_snapshot: ContextStackSnapshot,
    outer_provider_token: ContextFrameId,
    inner_provider_token: ContextFrameId,
    outer_pushed_stack_depth: usize,
    inner_pushed_stack_depth: usize,
    inner_restored_stack_depth: usize,
    outer_restored_stack_depth: usize,
    first_child_begin_work: FunctionComponentUseContextBeginWorkRecord,
    second_child_begin_work: FunctionComponentUseContextBeginWorkRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct NestedContextProviderOuterInnerConsumerUseContextBeginWorkRecord {
    outer_provider: FiberId,
    inner_provider: FiberId,
    outer_child: FiberId,
    inner_child: FiberId,
    outer_context: ContextHandle,
    outer_value: ContextValueHandle,
    inner_context: ContextHandle,
    inner_value: ContextValueHandle,
    outer_provider_snapshot: ContextStackSnapshot,
    inner_provider_snapshot: ContextStackSnapshot,
    outer_provider_token: ContextFrameId,
    inner_provider_token: ContextFrameId,
    outer_pushed_stack_depth: usize,
    inner_pushed_stack_depth: usize,
    inner_restored_stack_depth: usize,
    outer_restored_stack_depth: usize,
    outer_child_begin_work: FunctionComponentUseContextBeginWorkRecord,
    inner_child_begin_work: FunctionComponentUseContextBeginWorkRecord,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SiblingContextProviderTwoConsumerUseContextBeginWorkRecord {
    first_provider: FiberId,
    second_provider: FiberId,
    first_child: FiberId,
    second_child: FiberId,
    first_context: ContextHandle,
    first_value: ContextValueHandle,
    second_context: ContextHandle,
    second_value: ContextValueHandle,
    first_provider_snapshot: ContextStackSnapshot,
    second_provider_snapshot: ContextStackSnapshot,
    first_provider_token: ContextFrameId,
    second_provider_token: ContextFrameId,
    first_pushed_stack_depth: usize,
    first_restored_stack_depth: usize,
    second_pushed_stack_depth: usize,
    second_restored_stack_depth: usize,
    first_child_begin_work: FunctionComponentUseContextBeginWorkRecord,
    second_child_begin_work: FunctionComponentUseContextBeginWorkRecord,
}

impl NestedContextProviderBeginWorkRecord {
    #[must_use]
    pub const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
    }

    #[must_use]
    pub const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    pub const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    pub const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }

    #[must_use]
    pub const fn outer_provider_snapshot(self) -> ContextStackSnapshot {
        self.outer_provider_snapshot
    }

    #[must_use]
    pub const fn inner_provider_snapshot(self) -> ContextStackSnapshot {
        self.inner_provider_snapshot
    }

    #[must_use]
    pub const fn outer_pushed_stack_depth(self) -> usize {
        self.outer_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_pushed_stack_depth(self) -> usize {
        self.inner_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_restored_stack_depth(self) -> usize {
        self.inner_restored_stack_depth
    }

    #[must_use]
    pub const fn outer_restored_stack_depth(self) -> usize {
        self.outer_restored_stack_depth
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentBeginWorkRecord {
        self.child_begin_work
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.child_begin_work.render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.child_begin_work.output()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.child_begin_work.context_read_count()
    }
}

impl NestedContextProviderUseContextBeginWorkRecord {
    #[must_use]
    pub const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub const fn child(self) -> FiberId {
        self.child
    }

    #[must_use]
    pub const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    pub const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    pub const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }

    #[must_use]
    pub const fn outer_provider_snapshot(self) -> ContextStackSnapshot {
        self.outer_provider_snapshot
    }

    #[must_use]
    pub const fn inner_provider_snapshot(self) -> ContextStackSnapshot {
        self.inner_provider_snapshot
    }

    #[must_use]
    pub const fn outer_pushed_stack_depth(self) -> usize {
        self.outer_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_pushed_stack_depth(self) -> usize {
        self.inner_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_restored_stack_depth(self) -> usize {
        self.inner_restored_stack_depth
    }

    #[must_use]
    pub const fn outer_restored_stack_depth(self) -> usize {
        self.outer_restored_stack_depth
    }

    #[must_use]
    pub const fn child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.child_begin_work
    }

    #[must_use]
    pub const fn child_render(self) -> FunctionComponentRenderRecord {
        self.child_begin_work.render()
    }

    #[must_use]
    pub const fn child_output(self) -> FunctionComponentOutputHandle {
        self.child_begin_work.output()
    }

    #[must_use]
    pub const fn child_context_read(self) -> FunctionComponentContextReadRecord {
        self.child_begin_work.context_read()
    }

    #[must_use]
    pub const fn child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.child_begin_work.context_dependency()
    }

    #[must_use]
    pub const fn child_context_read_count(self) -> usize {
        self.child_begin_work.context_read_count()
    }
}

impl NestedContextProviderTwoConsumerUseContextBeginWorkRecord {
    #[must_use]
    pub const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub const fn first_child(self) -> FiberId {
        self.first_child
    }

    #[must_use]
    pub const fn second_child(self) -> FiberId {
        self.second_child
    }

    #[must_use]
    pub const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    pub const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    pub const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }

    #[must_use]
    pub const fn outer_provider_snapshot(self) -> ContextStackSnapshot {
        self.outer_provider_snapshot
    }

    #[must_use]
    pub const fn inner_provider_snapshot(self) -> ContextStackSnapshot {
        self.inner_provider_snapshot
    }

    #[must_use]
    pub const fn outer_provider_token(self) -> ContextFrameId {
        self.outer_provider_token
    }

    #[must_use]
    pub const fn inner_provider_token(self) -> ContextFrameId {
        self.inner_provider_token
    }

    #[must_use]
    pub const fn outer_pushed_stack_depth(self) -> usize {
        self.outer_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_pushed_stack_depth(self) -> usize {
        self.inner_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_restored_stack_depth(self) -> usize {
        self.inner_restored_stack_depth
    }

    #[must_use]
    pub const fn outer_restored_stack_depth(self) -> usize {
        self.outer_restored_stack_depth
    }

    #[must_use]
    pub const fn first_child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.first_child_begin_work
    }

    #[must_use]
    pub const fn second_child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.second_child_begin_work
    }

    #[must_use]
    pub const fn first_child_render(self) -> FunctionComponentRenderRecord {
        self.first_child_begin_work.render()
    }

    #[must_use]
    pub const fn second_child_render(self) -> FunctionComponentRenderRecord {
        self.second_child_begin_work.render()
    }

    #[must_use]
    pub const fn first_child_output(self) -> FunctionComponentOutputHandle {
        self.first_child_begin_work.output()
    }

    #[must_use]
    pub const fn second_child_output(self) -> FunctionComponentOutputHandle {
        self.second_child_begin_work.output()
    }

    #[must_use]
    pub const fn first_child_context_read(self) -> FunctionComponentContextReadRecord {
        self.first_child_begin_work.context_read()
    }

    #[must_use]
    pub const fn second_child_context_read(self) -> FunctionComponentContextReadRecord {
        self.second_child_begin_work.context_read()
    }

    #[must_use]
    pub const fn first_child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.first_child_begin_work.context_dependency()
    }

    #[must_use]
    pub const fn second_child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.second_child_begin_work.context_dependency()
    }

    #[must_use]
    pub const fn first_child_context_read_count(self) -> usize {
        self.first_child_begin_work.context_read_count()
    }

    #[must_use]
    pub const fn second_child_context_read_count(self) -> usize {
        self.second_child_begin_work.context_read_count()
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.first_child_begin_work.render().render_lanes()
    }
}

impl NestedContextProviderOuterInnerConsumerUseContextBeginWorkRecord {
    #[must_use]
    pub const fn outer_provider(self) -> FiberId {
        self.outer_provider
    }

    #[must_use]
    pub const fn inner_provider(self) -> FiberId {
        self.inner_provider
    }

    #[must_use]
    pub const fn outer_child(self) -> FiberId {
        self.outer_child
    }

    #[must_use]
    pub const fn inner_child(self) -> FiberId {
        self.inner_child
    }

    #[must_use]
    pub const fn outer_context(self) -> ContextHandle {
        self.outer_context
    }

    #[must_use]
    pub const fn outer_value(self) -> ContextValueHandle {
        self.outer_value
    }

    #[must_use]
    pub const fn inner_context(self) -> ContextHandle {
        self.inner_context
    }

    #[must_use]
    pub const fn inner_value(self) -> ContextValueHandle {
        self.inner_value
    }

    #[must_use]
    pub const fn outer_provider_snapshot(self) -> ContextStackSnapshot {
        self.outer_provider_snapshot
    }

    #[must_use]
    pub const fn inner_provider_snapshot(self) -> ContextStackSnapshot {
        self.inner_provider_snapshot
    }

    #[must_use]
    pub const fn outer_provider_token(self) -> ContextFrameId {
        self.outer_provider_token
    }

    #[must_use]
    pub const fn inner_provider_token(self) -> ContextFrameId {
        self.inner_provider_token
    }

    #[must_use]
    pub const fn outer_pushed_stack_depth(self) -> usize {
        self.outer_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_pushed_stack_depth(self) -> usize {
        self.inner_pushed_stack_depth
    }

    #[must_use]
    pub const fn inner_restored_stack_depth(self) -> usize {
        self.inner_restored_stack_depth
    }

    #[must_use]
    pub const fn outer_restored_stack_depth(self) -> usize {
        self.outer_restored_stack_depth
    }

    #[must_use]
    pub const fn outer_child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.outer_child_begin_work
    }

    #[must_use]
    pub const fn inner_child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.inner_child_begin_work
    }

    #[must_use]
    pub const fn outer_child_render(self) -> FunctionComponentRenderRecord {
        self.outer_child_begin_work.render()
    }

    #[must_use]
    pub const fn inner_child_render(self) -> FunctionComponentRenderRecord {
        self.inner_child_begin_work.render()
    }

    #[must_use]
    pub const fn outer_child_output(self) -> FunctionComponentOutputHandle {
        self.outer_child_begin_work.output()
    }

    #[must_use]
    pub const fn inner_child_output(self) -> FunctionComponentOutputHandle {
        self.inner_child_begin_work.output()
    }

    #[must_use]
    pub const fn outer_child_context_read(self) -> FunctionComponentContextReadRecord {
        self.outer_child_begin_work.context_read()
    }

    #[must_use]
    pub const fn inner_child_context_read(self) -> FunctionComponentContextReadRecord {
        self.inner_child_begin_work.context_read()
    }

    #[must_use]
    pub const fn outer_child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.outer_child_begin_work.context_dependency()
    }

    #[must_use]
    pub const fn inner_child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.inner_child_begin_work.context_dependency()
    }

    #[must_use]
    pub const fn outer_child_context_read_count(self) -> usize {
        self.outer_child_begin_work.context_read_count()
    }

    #[must_use]
    pub const fn inner_child_context_read_count(self) -> usize {
        self.inner_child_begin_work.context_read_count()
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.outer_child_begin_work.render().render_lanes()
    }
}

impl SiblingContextProviderTwoConsumerUseContextBeginWorkRecord {
    #[must_use]
    pub const fn first_provider(self) -> FiberId {
        self.first_provider
    }

    #[must_use]
    pub const fn second_provider(self) -> FiberId {
        self.second_provider
    }

    #[must_use]
    pub const fn first_child(self) -> FiberId {
        self.first_child
    }

    #[must_use]
    pub const fn second_child(self) -> FiberId {
        self.second_child
    }

    #[must_use]
    pub const fn first_context(self) -> ContextHandle {
        self.first_context
    }

    #[must_use]
    pub const fn first_value(self) -> ContextValueHandle {
        self.first_value
    }

    #[must_use]
    pub const fn second_context(self) -> ContextHandle {
        self.second_context
    }

    #[must_use]
    pub const fn second_value(self) -> ContextValueHandle {
        self.second_value
    }

    #[must_use]
    pub const fn first_provider_snapshot(self) -> ContextStackSnapshot {
        self.first_provider_snapshot
    }

    #[must_use]
    pub const fn second_provider_snapshot(self) -> ContextStackSnapshot {
        self.second_provider_snapshot
    }

    #[must_use]
    pub const fn first_provider_token(self) -> ContextFrameId {
        self.first_provider_token
    }

    #[must_use]
    pub const fn second_provider_token(self) -> ContextFrameId {
        self.second_provider_token
    }

    #[must_use]
    pub const fn first_pushed_stack_depth(self) -> usize {
        self.first_pushed_stack_depth
    }

    #[must_use]
    pub const fn first_restored_stack_depth(self) -> usize {
        self.first_restored_stack_depth
    }

    #[must_use]
    pub const fn second_pushed_stack_depth(self) -> usize {
        self.second_pushed_stack_depth
    }

    #[must_use]
    pub const fn second_restored_stack_depth(self) -> usize {
        self.second_restored_stack_depth
    }

    #[must_use]
    pub const fn first_child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.first_child_begin_work
    }

    #[must_use]
    pub const fn second_child_begin_work(self) -> FunctionComponentUseContextBeginWorkRecord {
        self.second_child_begin_work
    }

    #[must_use]
    pub const fn first_child_render(self) -> FunctionComponentRenderRecord {
        self.first_child_begin_work.render()
    }

    #[must_use]
    pub const fn second_child_render(self) -> FunctionComponentRenderRecord {
        self.second_child_begin_work.render()
    }

    #[must_use]
    pub const fn first_child_output(self) -> FunctionComponentOutputHandle {
        self.first_child_begin_work.output()
    }

    #[must_use]
    pub const fn second_child_output(self) -> FunctionComponentOutputHandle {
        self.second_child_begin_work.output()
    }

    #[must_use]
    pub const fn first_child_context_read(self) -> FunctionComponentContextReadRecord {
        self.first_child_begin_work.context_read()
    }

    #[must_use]
    pub const fn second_child_context_read(self) -> FunctionComponentContextReadRecord {
        self.second_child_begin_work.context_read()
    }

    #[must_use]
    pub const fn first_child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.first_child_begin_work.context_dependency()
    }

    #[must_use]
    pub const fn second_child_context_dependency(self) -> FunctionComponentContextDependencyHandle {
        self.second_child_begin_work.context_dependency()
    }

    #[must_use]
    pub const fn first_child_context_read_count(self) -> usize {
        self.first_child_begin_work.context_read_count()
    }

    #[must_use]
    pub const fn second_child_context_read_count(self) -> usize {
        self.second_child_begin_work.context_read_count()
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.first_child_begin_work.render().render_lanes()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum ContextProviderBeginWorkError {
    FiberTopology(FiberTopologyError),
    ContextStack {
        provider: FiberId,
        context: ContextHandle,
        error: Box<ContextStackError>,
    },
    ContextRestore {
        provider: FiberId,
        context: ContextHandle,
        snapshot: ContextStackSnapshot,
        error: Box<ContextStackError>,
    },
    ContextRestoreAfterChildError {
        provider: FiberId,
        child: FiberId,
        context: ContextHandle,
        child_error: Box<BeginWorkError>,
        restore_error: Box<ContextStackError>,
    },
    ChildBeginWork {
        provider: FiberId,
        child: FiberId,
        error: Box<BeginWorkError>,
    },
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingChild {
        provider: FiberId,
    },
    ProviderSiblingUnsupported {
        provider: FiberId,
        sibling: FiberId,
    },
    MultipleChildren {
        provider: FiberId,
        first_child: FiberId,
        sibling: FiberId,
    },
    UnsupportedChildTag {
        provider: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    MissingSubtreeConsumer {
        provider: FiberId,
    },
    SubtreeTraversalLimitExceeded {
        provider: FiberId,
        max_fibers: usize,
        next_fiber: FiberId,
    },
    UnsupportedSubtreeFiberTag {
        provider: FiberId,
        fiber: FiberId,
        tag: FiberTag,
    },
}

impl Display for ContextProviderBeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ContextStack {
                provider,
                context,
                error,
            } => write!(
                formatter,
                "ContextProvider fiber {} could not push context {}: {error}",
                provider.slot().get(),
                context.raw()
            ),
            Self::ContextRestore {
                provider,
                context,
                snapshot,
                error,
            } => write!(
                formatter,
                "ContextProvider fiber {} could not restore context {} snapshot at depth {}: {error}",
                provider.slot().get(),
                context.raw(),
                snapshot.depth()
            ),
            Self::ContextRestoreAfterChildError {
                provider,
                child,
                context,
                child_error,
                restore_error,
            } => write!(
                formatter,
                "ContextProvider fiber {} child {} failed begin-work ({child_error}) and context {} restore also failed: {restore_error}",
                provider.slot().get(),
                child.slot().get(),
                context.raw()
            ),
            Self::ChildBeginWork {
                provider,
                child,
                error,
            } => write!(
                formatter,
                "ContextProvider fiber {} child {} failed private begin-work handoff: {error}",
                provider.slot().get(),
                child.slot().get()
            ),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be ContextProvider for private provider begin-work handoff, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::MissingChild { provider } => write!(
                formatter,
                "ContextProvider fiber {} has no child; this private handoff requires exactly one FunctionComponent child",
                provider.slot().get()
            ),
            Self::ProviderSiblingUnsupported { provider, sibling } => write!(
                formatter,
                "ContextProvider fiber {} has sibling {}; this private handoff does not traverse provider siblings",
                provider.slot().get(),
                sibling.slot().get()
            ),
            Self::MultipleChildren {
                provider,
                first_child,
                sibling,
            } => write!(
                formatter,
                "ContextProvider fiber {} has multiple children (first {}, sibling {}); this private handoff admits exactly one FunctionComponent child",
                provider.slot().get(),
                first_child.slot().get(),
                sibling.slot().get()
            ),
            Self::UnsupportedChildTag {
                provider,
                child,
                tag,
            } => write!(
                formatter,
                "ContextProvider fiber {} child {} has unsupported tag {:?}; this private handoff admits only one FunctionComponent child",
                provider.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::MissingSubtreeConsumer { provider } => write!(
                formatter,
                "ContextProvider fiber {} subtree traversal found no FunctionComponent consumers",
                provider.slot().get()
            ),
            Self::SubtreeTraversalLimitExceeded {
                provider,
                max_fibers,
                next_fiber,
            } => write!(
                formatter,
                "ContextProvider fiber {} subtree traversal exceeded {} fibers before visiting {}",
                provider.slot().get(),
                max_fibers,
                next_fiber.slot().get()
            ),
            Self::UnsupportedSubtreeFiberTag {
                provider,
                fiber,
                tag,
            } => write!(
                formatter,
                "ContextProvider fiber {} subtree traversal reached unsupported fiber {} with tag {:?}",
                provider.slot().get(),
                fiber.slot().get(),
                tag
            ),
        }
    }
}

impl Error for ContextProviderBeginWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ContextStack { error, .. } | Self::ContextRestore { error, .. } => Some(error),
            Self::ContextRestoreAfterChildError { child_error, .. }
            | Self::ChildBeginWork {
                error: child_error, ..
            } => Some(child_error),
            Self::UnexpectedFiberTag { .. }
            | Self::MissingChild { .. }
            | Self::ProviderSiblingUnsupported { .. }
            | Self::MultipleChildren { .. }
            | Self::UnsupportedChildTag { .. }
            | Self::MissingSubtreeConsumer { .. }
            | Self::SubtreeTraversalLimitExceeded { .. }
            | Self::UnsupportedSubtreeFiberTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for ContextProviderBeginWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum NestedContextProviderBeginWorkError {
    FiberTopology(FiberTopologyError),
    ContextStack {
        provider: FiberId,
        context: ContextHandle,
        error: Box<ContextStackError>,
    },
    ContextRestore {
        provider: FiberId,
        context: ContextHandle,
        snapshot: ContextStackSnapshot,
        error: Box<ContextStackError>,
    },
    ContextRestoreAfterChildError {
        outer_provider: FiberId,
        inner_provider: FiberId,
        child: FiberId,
        child_error: Box<BeginWorkError>,
        inner_restore_error: Option<Box<ContextStackError>>,
        outer_restore_error: Option<Box<ContextStackError>>,
    },
    ChildBeginWork {
        outer_provider: FiberId,
        inner_provider: FiberId,
        child: FiberId,
        error: Box<BeginWorkError>,
    },
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingChild {
        provider: FiberId,
    },
    ProviderSiblingUnsupported {
        provider: FiberId,
        sibling: FiberId,
    },
    MultipleChildren {
        provider: FiberId,
        first_child: FiberId,
        sibling: FiberId,
    },
    MissingSecondConsumer {
        inner_provider: FiberId,
        first_child: FiberId,
    },
    MissingInnerProvider {
        outer_provider: FiberId,
        outer_child: FiberId,
    },
    TooManyConsumers {
        inner_provider: FiberId,
        first_child: FiberId,
        second_child: FiberId,
        sibling: FiberId,
    },
    TooManyOuterChildren {
        outer_provider: FiberId,
        outer_child: FiberId,
        inner_provider: FiberId,
        sibling: FiberId,
    },
    UnsupportedOuterConsumerTag {
        outer_provider: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    UnsupportedOuterChildTag {
        outer_provider: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    UnsupportedInnerChildTag {
        inner_provider: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

impl Display for NestedContextProviderBeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ContextStack {
                provider,
                context,
                error,
            } => write!(
                formatter,
                "nested ContextProvider fiber {} could not push context {}: {error}",
                provider.slot().get(),
                context.raw()
            ),
            Self::ContextRestore {
                provider,
                context,
                snapshot,
                error,
            } => write!(
                formatter,
                "nested ContextProvider fiber {} could not restore context {} snapshot at depth {}: {error}",
                provider.slot().get(),
                context.raw(),
                snapshot.depth()
            ),
            Self::ContextRestoreAfterChildError {
                outer_provider,
                inner_provider,
                child,
                child_error,
                inner_restore_error,
                outer_restore_error,
            } => write!(
                formatter,
                "nested ContextProvider fibers {} -> {} child {} failed begin-work ({child_error}) and restore errors were inner {:?}, outer {:?}",
                outer_provider.slot().get(),
                inner_provider.slot().get(),
                child.slot().get(),
                inner_restore_error,
                outer_restore_error
            ),
            Self::ChildBeginWork {
                outer_provider,
                inner_provider,
                child,
                error,
            } => write!(
                formatter,
                "nested ContextProvider fibers {} -> {} child {} failed private begin-work handoff: {error}",
                outer_provider.slot().get(),
                inner_provider.slot().get(),
                child.slot().get()
            ),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be outer ContextProvider for private nested provider begin-work handoff, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::MissingChild { provider } => write!(
                formatter,
                "ContextProvider fiber {} has no child; this private nested handoff requires ContextProvider -> FunctionComponent",
                provider.slot().get()
            ),
            Self::ProviderSiblingUnsupported { provider, sibling } => write!(
                formatter,
                "ContextProvider fiber {} has sibling {}; this private nested handoff does not traverse provider siblings",
                provider.slot().get(),
                sibling.slot().get()
            ),
            Self::MultipleChildren {
                provider,
                first_child,
                sibling,
            } => write!(
                formatter,
                "ContextProvider fiber {} has multiple children (first {}, sibling {}); this private nested handoff admits exactly one provider/function child at each level",
                provider.slot().get(),
                first_child.slot().get(),
                sibling.slot().get()
            ),
            Self::MissingSecondConsumer {
                inner_provider,
                first_child,
            } => write!(
                formatter,
                "inner ContextProvider fiber {} has only one FunctionComponent consumer {}; this private nested multi-consumer handoff requires exactly two FunctionComponent children",
                inner_provider.slot().get(),
                first_child.slot().get()
            ),
            Self::MissingInnerProvider {
                outer_provider,
                outer_child,
            } => write!(
                formatter,
                "outer ContextProvider fiber {} has outer FunctionComponent consumer {} but no inner ContextProvider sibling; this private nested outer/inner consumer handoff requires both",
                outer_provider.slot().get(),
                outer_child.slot().get()
            ),
            Self::TooManyConsumers {
                inner_provider,
                first_child,
                second_child,
                sibling,
            } => write!(
                formatter,
                "inner ContextProvider fiber {} has more than two FunctionComponent consumers (first {}, second {}, sibling {}); this private nested multi-consumer handoff admits exactly two FunctionComponent children",
                inner_provider.slot().get(),
                first_child.slot().get(),
                second_child.slot().get(),
                sibling.slot().get()
            ),
            Self::TooManyOuterChildren {
                outer_provider,
                outer_child,
                inner_provider,
                sibling,
            } => write!(
                formatter,
                "outer ContextProvider fiber {} has more than the admitted outer consumer {} plus inner ContextProvider {} children; unsupported sibling {} was present",
                outer_provider.slot().get(),
                outer_child.slot().get(),
                inner_provider.slot().get(),
                sibling.slot().get()
            ),
            Self::UnsupportedOuterConsumerTag {
                outer_provider,
                child,
                tag,
            } => write!(
                formatter,
                "outer ContextProvider fiber {} first child {} has unsupported tag {:?}; this private nested outer/inner consumer handoff admits a FunctionComponent outer consumer",
                outer_provider.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::UnsupportedOuterChildTag {
                outer_provider,
                child,
                tag,
            } => write!(
                formatter,
                "outer ContextProvider fiber {} child {} has unsupported tag {:?}; this private nested handoff admits exactly one inner ContextProvider child",
                outer_provider.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::UnsupportedInnerChildTag {
                inner_provider,
                child,
                tag,
            } => write!(
                formatter,
                "inner ContextProvider fiber {} child {} has unsupported tag {:?}; this private nested handoff admits exactly one FunctionComponent child",
                inner_provider.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

impl Error for NestedContextProviderBeginWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ContextStack { error, .. } | Self::ContextRestore { error, .. } => Some(error),
            Self::ContextRestoreAfterChildError { child_error, .. }
            | Self::ChildBeginWork {
                error: child_error, ..
            } => Some(child_error),
            Self::UnexpectedFiberTag { .. }
            | Self::MissingChild { .. }
            | Self::ProviderSiblingUnsupported { .. }
            | Self::MultipleChildren { .. }
            | Self::MissingSecondConsumer { .. }
            | Self::MissingInnerProvider { .. }
            | Self::TooManyConsumers { .. }
            | Self::TooManyOuterChildren { .. }
            | Self::UnsupportedOuterConsumerTag { .. }
            | Self::UnsupportedOuterChildTag { .. }
            | Self::UnsupportedInnerChildTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for NestedContextProviderBeginWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum SiblingContextProviderBeginWorkError {
    FiberTopology(FiberTopologyError),
    ContextStack {
        provider: FiberId,
        context: ContextHandle,
        error: Box<ContextStackError>,
    },
    ContextRestore {
        provider: FiberId,
        context: ContextHandle,
        snapshot: ContextStackSnapshot,
        error: Box<ContextStackError>,
    },
    ContextRestoreAfterChildError {
        provider: FiberId,
        child: FiberId,
        child_error: Box<BeginWorkError>,
        restore_error: Option<Box<ContextStackError>>,
    },
    ChildBeginWork {
        provider: FiberId,
        child: FiberId,
        error: Box<BeginWorkError>,
    },
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingSecondProvider {
        first_provider: FiberId,
    },
    TooManyProviders {
        first_provider: FiberId,
        second_provider: FiberId,
        sibling: FiberId,
    },
    MissingChild {
        provider: FiberId,
    },
    MultipleChildren {
        provider: FiberId,
        first_child: FiberId,
        sibling: FiberId,
    },
    UnsupportedSecondProviderTag {
        first_provider: FiberId,
        second_provider: FiberId,
        tag: FiberTag,
    },
    UnsupportedChildTag {
        provider: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

impl Display for SiblingContextProviderBeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ContextStack {
                provider,
                context,
                error,
            } => write!(
                formatter,
                "sibling ContextProvider fiber {} could not push context {}: {error}",
                provider.slot().get(),
                context.raw()
            ),
            Self::ContextRestore {
                provider,
                context,
                snapshot,
                error,
            } => write!(
                formatter,
                "sibling ContextProvider fiber {} could not restore context {} snapshot at depth {}: {error}",
                provider.slot().get(),
                context.raw(),
                snapshot.depth()
            ),
            Self::ContextRestoreAfterChildError {
                provider,
                child,
                child_error,
                restore_error,
            } => write!(
                formatter,
                "sibling ContextProvider fiber {} child {} failed begin-work ({child_error}) and restore error was {:?}",
                provider.slot().get(),
                child.slot().get(),
                restore_error
            ),
            Self::ChildBeginWork {
                provider,
                child,
                error,
            } => write!(
                formatter,
                "sibling ContextProvider fiber {} child {} failed private begin-work handoff: {error}",
                provider.slot().get(),
                child.slot().get()
            ),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be first ContextProvider for private sibling provider begin-work handoff, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::MissingSecondProvider { first_provider } => write!(
                formatter,
                "ContextProvider fiber {} has no provider sibling; this private sibling handoff requires exactly two sibling ContextProvider fibers",
                first_provider.slot().get()
            ),
            Self::TooManyProviders {
                first_provider,
                second_provider,
                sibling,
            } => write!(
                formatter,
                "ContextProvider siblings {} and {} have extra sibling {}; this private sibling handoff admits exactly two providers",
                first_provider.slot().get(),
                second_provider.slot().get(),
                sibling.slot().get()
            ),
            Self::MissingChild { provider } => write!(
                formatter,
                "ContextProvider fiber {} has no child; this private sibling handoff requires one FunctionComponent child per provider",
                provider.slot().get()
            ),
            Self::MultipleChildren {
                provider,
                first_child,
                sibling,
            } => write!(
                formatter,
                "ContextProvider fiber {} has multiple children (first {}, sibling {}); this private sibling handoff admits exactly one FunctionComponent child per provider",
                provider.slot().get(),
                first_child.slot().get(),
                sibling.slot().get()
            ),
            Self::UnsupportedSecondProviderTag {
                first_provider,
                second_provider,
                tag,
            } => write!(
                formatter,
                "first ContextProvider fiber {} sibling {} has unsupported tag {:?}; this private sibling handoff requires a second ContextProvider",
                first_provider.slot().get(),
                second_provider.slot().get(),
                tag
            ),
            Self::UnsupportedChildTag {
                provider,
                child,
                tag,
            } => write!(
                formatter,
                "ContextProvider fiber {} child {} has unsupported tag {:?}; this private sibling handoff admits FunctionComponent children only",
                provider.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

impl Error for SiblingContextProviderBeginWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ContextStack { error, .. } | Self::ContextRestore { error, .. } => Some(error),
            Self::ContextRestoreAfterChildError { child_error, .. }
            | Self::ChildBeginWork {
                error: child_error, ..
            } => Some(child_error),
            Self::UnexpectedFiberTag { .. }
            | Self::MissingSecondProvider { .. }
            | Self::TooManyProviders { .. }
            | Self::MissingChild { .. }
            | Self::MultipleChildren { .. }
            | Self::UnsupportedSecondProviderTag { .. }
            | Self::UnsupportedChildTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for SiblingContextProviderBeginWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum FunctionComponentBeginWorkBailoutBlockerError {
    FiberTopology(FiberTopologyError),
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    MissingCurrent {
        work_in_progress: FiberId,
    },
    PropsChanged {
        current: FiberId,
        work_in_progress: FiberId,
        memoized_props: PropsHandle,
        pending_props: PropsHandle,
    },
    ScheduledUpdate {
        current: FiberId,
        render_lanes: Lanes,
        current_lanes: Lanes,
    },
    ContextChanged {
        current: FiberId,
        work_in_progress: FiberId,
        render_lanes: Lanes,
        context_dependency_count: usize,
        context_dependency_lanes: Lanes,
    },
    ChildLanesIntersectRenderLanes {
        work_in_progress: FiberId,
        render_lanes: Lanes,
        child_lanes: Lanes,
        child: Option<FiberId>,
    },
}

impl Display for FunctionComponentBeginWorkBailoutBlockerError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} has tag {:?}; function component bailout blocker admits FunctionComponent only",
                fiber.slot().get(),
                tag
            ),
            Self::MissingCurrent { work_in_progress } => write!(
                formatter,
                "function component fiber {} has no current alternate; mount path cannot bail out",
                work_in_progress.slot().get()
            ),
            Self::PropsChanged {
                current,
                work_in_progress,
                memoized_props,
                pending_props,
            } => write!(
                formatter,
                "function component bailout blocked because current {} memoized props {:?} differ from work-in-progress {} pending props {:?}",
                current.slot().get(),
                memoized_props,
                work_in_progress.slot().get(),
                pending_props
            ),
            Self::ScheduledUpdate {
                current,
                render_lanes,
                current_lanes,
            } => write!(
                formatter,
                "function component bailout blocked because current {} lanes {:?} intersect render lanes {:?}",
                current.slot().get(),
                current_lanes,
                render_lanes
            ),
            Self::ContextChanged {
                current,
                work_in_progress,
                render_lanes,
                context_dependency_count,
                context_dependency_lanes,
            } => write!(
                formatter,
                "function component bailout blocked because {} private context dependencies for current {} / work-in-progress {} carry lanes {:?} intersecting render lanes {:?}",
                context_dependency_count,
                current.slot().get(),
                work_in_progress.slot().get(),
                context_dependency_lanes,
                render_lanes
            ),
            Self::ChildLanesIntersectRenderLanes {
                work_in_progress,
                render_lanes,
                child_lanes,
                child,
            } => write!(
                formatter,
                "function component bailout cannot block child traversal for {} because child lanes {:?} intersect render lanes {:?}; child {:?} must remain reachable",
                work_in_progress.slot().get(),
                child_lanes,
                render_lanes,
                child.map(|fiber| fiber.slot().get())
            ),
        }
    }
}

impl Error for FunctionComponentBeginWorkBailoutBlockerError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::UnexpectedFiberTag { .. }
            | Self::MissingCurrent { .. }
            | Self::PropsChanged { .. }
            | Self::ScheduledUpdate { .. }
            | Self::ContextChanged { .. }
            | Self::ChildLanesIntersectRenderLanes { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for FunctionComponentBeginWorkBailoutBlockerError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum BeginWorkError {
    FiberTopology(FiberTopologyError),
    FunctionComponent(FunctionComponentRenderError),
    FunctionComponentSingleChild(FunctionComponentSingleChildReconciliationError),
    FragmentSingleHostChild(FragmentSingleHostChildBeginWorkError),
    UnsupportedPortal(Box<UnsupportedPortalBeginWorkRecord>),
    UnsupportedSuspenseChildShape(Box<UnsupportedSuspenseChildShapeRecord>),
    UnsupportedOffscreenChildShape(Box<UnsupportedOffscreenChildShapeRecord>),
    UnsupportedSuspenseListChildShape(Box<UnsupportedSuspenseListChildShapeRecord>),
    UnsupportedActivityChildShape(Box<UnsupportedActivityChildShapeRecord>),
    UnsupportedFiberTag { fiber: FiberId, tag: FiberTag },
}

impl Display for BeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::FunctionComponent(error) => Display::fmt(error, formatter),
            Self::FunctionComponentSingleChild(error) => Display::fmt(error, formatter),
            Self::FragmentSingleHostChild(error) => Display::fmt(error, formatter),
            Self::UnsupportedPortal(record) => write!(
                formatter,
                "portal fiber {} reached begin-work but {feature} is unsupported; key {:?}, child {:?}, pending props {:?}, state node {:?}",
                record.fiber().slot().get(),
                record.key().map(ReactKey::as_str),
                record.child().map(|fiber| fiber.slot().get()),
                record.pending_props(),
                record.state_node(),
                feature = record.feature()
            ),
            Self::UnsupportedSuspenseChildShape(record) => write!(
                formatter,
                "Suspense fiber {} reached begin-work with unsupported {} child shape {}; key {:?}, primary child {:?} ({:?}), fallback child {:?} ({:?}), pending props {:?}, memoized state {:?}, lanes {:?}, thenable {}, ping lane {:?}, retry queue {}, primary blocked {}, fallback blocked {}",
                record.fiber().slot().get(),
                record.feature(),
                record.shape().as_str(),
                record.key().map(ReactKey::as_str),
                record.child().map(|fiber| fiber.slot().get()),
                record.child_tag(),
                record.fallback_child().map(|fiber| fiber.slot().get()),
                record.fallback_child_tag(),
                record.pending_props(),
                record.memoized_state(),
                record.render_lanes(),
                record
                    .thenable_ping_blocker()
                    .thenable_identity_class()
                    .as_str(),
                record.thenable_ping_blocker().ping_lane(),
                record.thenable_ping_blocker().retry_queue_kind().as_str(),
                record
                    .thenable_ping_blocker()
                    .primary_child_rendering_blocked(),
                record
                    .thenable_ping_blocker()
                    .fallback_child_rendering_blocked()
            ),
            Self::UnsupportedOffscreenChildShape(record) => {
                write!(
                    formatter,
                    "Offscreen fiber {} reached begin-work with unsupported {} child shape {}; key {:?}, first child {:?} ({:?}), first child sibling {:?} ({:?}), pending props {:?}, memoized props {:?}, memoized state {:?}, state node {:?}, lanes {:?}, thenable {}, ping lane {:?}, retry queue {}, child rendering blocked {}",
                    record.fiber().slot().get(),
                    record.feature(),
                    record.shape().as_str(),
                    record.key().map(ReactKey::as_str),
                    record.child().map(|fiber| fiber.slot().get()),
                    record.child_tag(),
                    record.child_sibling().map(|fiber| fiber.slot().get()),
                    record.child_sibling_tag(),
                    record.pending_props(),
                    record.memoized_props(),
                    record.memoized_state(),
                    record.state_node(),
                    record.render_lanes(),
                    record
                        .thenable_ping_blocker()
                        .thenable_identity_class()
                        .as_str(),
                    record.thenable_ping_blocker().ping_lane(),
                    record.thenable_ping_blocker().retry_queue_kind().as_str(),
                    record
                        .thenable_ping_blocker()
                        .primary_child_rendering_blocked()
                )?;
                if let Some(transition) = record.visibility_transition() {
                    write!(
                        formatter,
                        "; visibility transition {} mode {} from {} to {} blocked by {}, render lanes {:?}, previous lanes {:?}/child {:?}, work-in-progress lanes {:?}/child {:?}, render includes Offscreen lane {}, work-in-progress includes Offscreen lane {}",
                        transition.transition().as_str(),
                        transition.mode().as_str(),
                        transition.previous_visibility().as_str(),
                        transition.current_visibility().as_str(),
                        transition.child_traversal_blocker().as_str(),
                        transition.render_lanes(),
                        transition.previous_lanes(),
                        transition.previous_child_lanes(),
                        transition.work_in_progress_lanes(),
                        transition.work_in_progress_child_lanes(),
                        transition.render_includes_offscreen_lane(),
                        transition.work_in_progress_includes_offscreen_lane()
                    )?;
                }
                Ok(())
            }
            Self::UnsupportedSuspenseListChildShape(record) => write!(
                formatter,
                "SuspenseList fiber {} reached begin-work with unsupported {} child shape {}; key {:?}, first child {:?} ({:?}), first child sibling {:?} ({:?}), pending props {:?}, memoized props {:?}, memoized state {:?}, lanes {:?}",
                record.fiber().slot().get(),
                record.feature(),
                record.shape().as_str(),
                record.key().map(ReactKey::as_str),
                record.child().map(|fiber| fiber.slot().get()),
                record.child_tag(),
                record.child_sibling().map(|fiber| fiber.slot().get()),
                record.child_sibling_tag(),
                record.pending_props(),
                record.memoized_props(),
                record.memoized_state(),
                record.render_lanes()
            ),
            Self::UnsupportedActivityChildShape(record) => write!(
                formatter,
                "Activity fiber {} reached begin-work with unsupported {} child shape {}; key {:?}, primary child {:?} ({:?}), primary child sibling {:?} ({:?}), pending props {:?}, memoized props {:?}, memoized state {:?}, state node {:?}, lanes {:?}",
                record.fiber().slot().get(),
                record.feature(),
                record.shape().as_str(),
                record.key().map(ReactKey::as_str),
                record.child().map(|fiber| fiber.slot().get()),
                record.child_tag(),
                record.child_sibling().map(|fiber| fiber.slot().get()),
                record.child_sibling_tag(),
                record.pending_props(),
                record.memoized_props(),
                record.memoized_state(),
                record.state_node(),
                record.render_lanes()
            ),
            Self::UnsupportedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} has unsupported begin-work tag {:?}; only FunctionComponent and an exact single-host-child Fragment are delegated by this private handoff",
                fiber.slot().get(),
                tag
            ),
        }
    }
}

impl Error for BeginWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::FunctionComponent(error) => Some(error),
            Self::FunctionComponentSingleChild(error) => Some(error),
            Self::FragmentSingleHostChild(error) => Some(error),
            Self::UnsupportedPortal(_)
            | Self::UnsupportedSuspenseChildShape(_)
            | Self::UnsupportedOffscreenChildShape(_)
            | Self::UnsupportedSuspenseListChildShape(_)
            | Self::UnsupportedActivityChildShape(_)
            | Self::UnsupportedFiberTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for BeginWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<FunctionComponentRenderError> for BeginWorkError {
    fn from(error: FunctionComponentRenderError) -> Self {
        Self::FunctionComponent(error)
    }
}

impl From<FunctionComponentSingleChildReconciliationError> for BeginWorkError {
    fn from(error: FunctionComponentSingleChildReconciliationError) -> Self {
        Self::FunctionComponentSingleChild(error)
    }
}

impl From<FragmentSingleHostChildBeginWorkError> for BeginWorkError {
    fn from(error: FragmentSingleHostChildBeginWorkError) -> Self {
        Self::FragmentSingleHostChild(error)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum FragmentSingleHostChildBeginWorkError {
    FiberTopology(FiberTopologyError),
    UnexpectedFiberTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    KeyedFragmentUnsupported {
        fragment: FiberId,
        key: ReactKey,
    },
    FragmentSiblingUnsupported {
        fragment: FiberId,
        sibling: FiberId,
    },
    MissingChild {
        fragment: FiberId,
    },
    MultipleChildren {
        fragment: FiberId,
        first_child: FiberId,
        sibling: FiberId,
    },
    UnsupportedChildTag {
        fragment: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    ExistingCurrentChild {
        fragment: FiberId,
        current: FiberId,
        child: FiberId,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootOneLevelChildSetBeginWorkError {
    RootElementMissing {
        kind: HostRootOneLevelChildSetKind,
    },
    KeyedFragmentUnsupported {
        root_element: RootElementHandle,
        key: ReactKey,
    },
    ExpectedMultipleHostChildren {
        root_element: RootElementHandle,
        kind: HostRootOneLevelChildSetKind,
        count: usize,
    },
    MissingHostChild {
        root_element: RootElementHandle,
        kind: HostRootOneLevelChildSetKind,
        child_index: usize,
    },
    KeyedHostChildUnsupported {
        root_element: RootElementHandle,
        kind: HostRootOneLevelChildSetKind,
        child_index: usize,
        element: RootElementHandle,
        key: ReactKey,
    },
    NestedChildSetUnsupported {
        root_element: RootElementHandle,
        kind: HostRootOneLevelChildSetKind,
        child_index: usize,
        nested_kind: HostRootOneLevelChildSetKind,
        first_child: Option<RootElementHandle>,
    },
}

impl Display for HostRootOneLevelChildSetBeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::RootElementMissing { kind } => write!(
                formatter,
                "private HostRoot {} child-set begin-work requires a root element handle",
                kind.as_str()
            ),
            Self::KeyedFragmentUnsupported { root_element, key } => write!(
                formatter,
                "private HostRoot fragment child-set {} has key {:?}; keyed Fragment reconciliation stays unsupported",
                root_element.raw(),
                key.as_str()
            ),
            Self::ExpectedMultipleHostChildren {
                root_element,
                kind,
                count,
            } => write!(
                formatter,
                "private HostRoot {} child-set {} requires at least two host children, found {count}",
                kind.as_str(),
                root_element.raw()
            ),
            Self::MissingHostChild {
                root_element,
                kind,
                child_index,
            } => write!(
                formatter,
                "private HostRoot {} child-set {} has missing/null host child at index {child_index}",
                kind.as_str(),
                root_element.raw()
            ),
            Self::KeyedHostChildUnsupported {
                root_element,
                kind,
                child_index,
                element,
                key,
            } => write!(
                formatter,
                "private HostRoot {} child-set {} child {} ({}) has key {:?}; keyed child reconciliation stays unsupported",
                kind.as_str(),
                root_element.raw(),
                child_index,
                element.raw(),
                key.as_str()
            ),
            Self::NestedChildSetUnsupported {
                root_element,
                kind,
                child_index,
                nested_kind,
                first_child,
            } => write!(
                formatter,
                "private HostRoot {} child-set {} child {} is a nested {} set starting at {:?}; nested child reconciliation stays unsupported",
                kind.as_str(),
                root_element.raw(),
                child_index,
                nested_kind.as_str(),
                first_child.map(RootElementHandle::raw)
            ),
        }
    }
}

impl Error for HostRootOneLevelChildSetBeginWorkError {}

impl Display for FragmentSingleHostChildBeginWorkError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UnexpectedFiberTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be Fragment for private single-host-child begin-work, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::KeyedFragmentUnsupported { fragment, key } => write!(
                formatter,
                "Fragment fiber {} has key {:?}; keyed Fragment reconciliation stays unsupported by this canary",
                fragment.slot().get(),
                key.as_str()
            ),
            Self::FragmentSiblingUnsupported { fragment, sibling } => write!(
                formatter,
                "Fragment fiber {} has sibling {}; this private canary does not traverse Fragment siblings",
                fragment.slot().get(),
                sibling.slot().get()
            ),
            Self::MissingChild { fragment } => write!(
                formatter,
                "Fragment fiber {} has no child; this private canary requires exactly one HostComponent or HostText child",
                fragment.slot().get()
            ),
            Self::MultipleChildren {
                fragment,
                first_child,
                sibling,
            } => write!(
                formatter,
                "Fragment fiber {} has multiple children (first {}, sibling {}); this private canary admits exactly one host child",
                fragment.slot().get(),
                first_child.slot().get(),
                sibling.slot().get()
            ),
            Self::UnsupportedChildTag {
                fragment,
                child,
                tag,
            } => write!(
                formatter,
                "Fragment fiber {} child {} has unsupported tag {:?}; this private canary admits only HostComponent and HostText",
                fragment.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::ExistingCurrentChild {
                fragment,
                current,
                child,
            } => write!(
                formatter,
                "Fragment fiber {} current alternate {} already has child {}; update/list reconciliation stays unsupported by this canary",
                fragment.slot().get(),
                current.slot().get(),
                child.slot().get()
            ),
        }
    }
}

impl Error for FragmentSingleHostChildBeginWorkError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::UnexpectedFiberTag { .. }
            | Self::KeyedFragmentUnsupported { .. }
            | Self::FragmentSiblingUnsupported { .. }
            | Self::MissingChild { .. }
            | Self::MultipleChildren { .. }
            | Self::UnsupportedChildTag { .. }
            | Self::ExistingCurrentChild { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for FragmentSingleHostChildBeginWorkError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub(crate) fn unsupported_portal_begin_work_record(
    arena: &FiberArena,
    request: BeginWorkRequest,
) -> Result<UnsupportedPortalBeginWorkRecord, BeginWorkError> {
    let fiber = request.work_in_progress();
    let node = arena.get(fiber)?;
    let tag = node.tag();

    if tag != FiberTag::Portal {
        return Err(BeginWorkError::UnsupportedFiberTag { fiber, tag });
    }

    Ok(UnsupportedPortalBeginWorkRecord {
        fiber,
        key: node.key().cloned(),
        pending_props: node.pending_props(),
        state_node: node.state_node(),
        child: node.child(),
        render_lanes: request.render_lanes(),
        feature: PORTAL_RECONCILER_UNSUPPORTED_FEATURE,
    })
}

fn unsupported_thenable_identity_class(
    has_retry_queue: bool,
    schedule_retry_flag: bool,
) -> UnsupportedThenableIdentityClass {
    match (has_retry_queue, schedule_retry_flag) {
        (false, false) => UnsupportedThenableIdentityClass::NoThenable,
        (true, false) => UnsupportedThenableIdentityClass::OpaqueWakeable,
        (false, true) => UnsupportedThenableIdentityClass::SuspenseyCommitResource,
        (true, true) => UnsupportedThenableIdentityClass::OpaqueWakeableAndSuspenseyCommitResource,
    }
}

fn unsupported_suspense_retry_queue_kind(
    boundary_retry_queue: UpdateQueueHandle,
    primary_offscreen_retry_queue: Option<UpdateQueueHandle>,
) -> UnsupportedThenableRetryQueueKind {
    match (
        boundary_retry_queue.is_some(),
        primary_offscreen_retry_queue.is_some(),
    ) {
        (false, false) => UnsupportedThenableRetryQueueKind::None,
        (true, false) => UnsupportedThenableRetryQueueKind::SuspenseBoundary,
        (false, true) => UnsupportedThenableRetryQueueKind::PrimaryOffscreen,
        (true, true) => UnsupportedThenableRetryQueueKind::SuspenseBoundaryAndPrimaryOffscreen,
    }
}

fn unsupported_suspense_thenable_ping_blocker_record(
    arena: &FiberArena,
    boundary_update_queue: UpdateQueueHandle,
    boundary_flags: FiberFlags,
    child: Option<FiberId>,
    fallback_child: Option<FiberId>,
    render_lanes: Lanes,
) -> Result<UnsupportedThenablePingBlockerRecord, BeginWorkError> {
    let primary_offscreen_retry_queue = match child {
        Some(primary) if arena.get(primary)?.tag() == FiberTag::Offscreen => {
            let retry_queue = arena.get(primary)?.update_queue();
            retry_queue.is_some().then_some(retry_queue)
        }
        Some(_) | None => None,
    };
    let retry_queue_kind =
        unsupported_suspense_retry_queue_kind(boundary_update_queue, primary_offscreen_retry_queue);
    let has_retry_queue = retry_queue_kind != UnsupportedThenableRetryQueueKind::None;
    let schedule_retry_flag = boundary_flags.contains_all(FiberFlags::SCHEDULE_RETRY);

    Ok(UnsupportedThenablePingBlockerRecord {
        thenable_identity_class: unsupported_thenable_identity_class(
            has_retry_queue,
            schedule_retry_flag,
        ),
        ping_lane: render_lanes.highest_priority_lane(),
        ping_lanes: render_lanes,
        retry_queue_kind,
        retry_queue: boundary_update_queue,
        primary_offscreen_retry_queue,
        schedule_retry_flag,
        primary_child_rendering_blocked: child.is_some(),
        fallback_child_rendering_blocked: fallback_child.is_some(),
    })
}

fn unsupported_offscreen_thenable_ping_blocker_record(
    update_queue: UpdateQueueHandle,
    flags: FiberFlags,
    child: Option<FiberId>,
    render_lanes: Lanes,
) -> UnsupportedThenablePingBlockerRecord {
    let has_retry_queue = update_queue.is_some();
    let schedule_retry_flag = flags.contains_all(FiberFlags::SCHEDULE_RETRY);

    UnsupportedThenablePingBlockerRecord {
        thenable_identity_class: unsupported_thenable_identity_class(
            has_retry_queue,
            schedule_retry_flag,
        ),
        ping_lane: render_lanes.highest_priority_lane(),
        ping_lanes: render_lanes,
        retry_queue_kind: if has_retry_queue {
            UnsupportedThenableRetryQueueKind::Offscreen
        } else {
            UnsupportedThenableRetryQueueKind::None
        },
        retry_queue: update_queue,
        primary_offscreen_retry_queue: None,
        schedule_retry_flag,
        primary_child_rendering_blocked: child.is_some(),
        fallback_child_rendering_blocked: false,
    }
}

pub(crate) fn unsupported_suspense_begin_work_record(
    arena: &FiberArena,
    request: BeginWorkRequest,
) -> Result<UnsupportedSuspenseChildShapeRecord, BeginWorkError> {
    let fiber = request.work_in_progress();
    let node = arena.get(fiber)?;
    let tag = node.tag();

    if tag != FiberTag::Suspense {
        return Err(BeginWorkError::UnsupportedFiberTag { fiber, tag });
    }

    let child = node.child();
    let (child_tag, fallback_child, fallback_child_tag) = match child {
        Some(child) => {
            let child_node = arena.get(child)?;
            let fallback_child = child_node.sibling();
            let fallback_child_tag = match fallback_child {
                Some(fallback_child) => Some(arena.get(fallback_child)?.tag()),
                None => None,
            };
            (Some(child_node.tag()), fallback_child, fallback_child_tag)
        }
        None => (None, None, None),
    };
    let shape = match child_tag {
        None => UnsupportedSuspenseChildShapeKind::Empty,
        Some(FiberTag::Offscreen) if fallback_child.is_some() => {
            UnsupportedSuspenseChildShapeKind::PrimaryOffscreenWithFallback
        }
        Some(FiberTag::Offscreen) => UnsupportedSuspenseChildShapeKind::PrimaryOffscreen,
        Some(FiberTag::DehydratedFragment) => UnsupportedSuspenseChildShapeKind::Dehydrated,
        Some(_) => UnsupportedSuspenseChildShapeKind::UnsupportedPrimary,
    };

    Ok(UnsupportedSuspenseChildShapeRecord {
        fiber,
        key: node.key().cloned(),
        pending_props: node.pending_props(),
        memoized_state: node.memoized_state(),
        child,
        child_tag,
        fallback_child,
        fallback_child_tag,
        render_lanes: request.render_lanes(),
        thenable_ping_blocker: unsupported_suspense_thenable_ping_blocker_record(
            arena,
            node.update_queue(),
            node.flags(),
            child,
            fallback_child,
            request.render_lanes(),
        )?,
        shape,
        feature: SUSPENSE_UNSUPPORTED_FEATURE,
    })
}

#[must_use]
pub(crate) fn unsupported_offscreen_visibility_from_memoized_state(
    memoized_state: StateHandle,
) -> UnsupportedOffscreenVisibility {
    if memoized_state == StateHandle::NONE {
        UnsupportedOffscreenVisibility::Visible
    } else {
        UnsupportedOffscreenVisibility::Hidden
    }
}

#[must_use]
pub(crate) fn unsupported_offscreen_visibility_mode(
    visibility: UnsupportedOffscreenVisibility,
) -> UnsupportedOffscreenVisibilityMode {
    match visibility {
        UnsupportedOffscreenVisibility::Visible => UnsupportedOffscreenVisibilityMode::Visible,
        UnsupportedOffscreenVisibility::Hidden => UnsupportedOffscreenVisibilityMode::Hidden,
    }
}

#[must_use]
pub(crate) fn unsupported_offscreen_visibility_transition_kind(
    previous_visibility: UnsupportedOffscreenVisibility,
    current_visibility: UnsupportedOffscreenVisibility,
) -> Option<UnsupportedOffscreenVisibilityTransitionKind> {
    match (previous_visibility, current_visibility) {
        (UnsupportedOffscreenVisibility::Hidden, UnsupportedOffscreenVisibility::Visible) => {
            Some(UnsupportedOffscreenVisibilityTransitionKind::HiddenToVisible)
        }
        (UnsupportedOffscreenVisibility::Visible, UnsupportedOffscreenVisibility::Hidden) => {
            Some(UnsupportedOffscreenVisibilityTransitionKind::VisibleToHidden)
        }
        _ => None,
    }
}

pub(crate) fn unsupported_offscreen_visibility_transition_record(
    arena: &FiberArena,
    work_in_progress: FiberId,
    render_lanes: Lanes,
    child_traversal_blocker: UnsupportedOffscreenVisibilityChildTraversalBlocker,
) -> Result<Option<UnsupportedOffscreenVisibilityTransitionRecord>, FiberTopologyError> {
    let node = arena.get(work_in_progress)?;
    let Some(previous) = node.alternate() else {
        return Ok(None);
    };
    let previous_node = arena.get(previous)?;

    if node.tag() != FiberTag::Offscreen || previous_node.tag() != FiberTag::Offscreen {
        return Ok(None);
    }

    let previous_visibility =
        unsupported_offscreen_visibility_from_memoized_state(previous_node.memoized_state());
    let current_visibility =
        unsupported_offscreen_visibility_from_memoized_state(node.memoized_state());
    let Some(transition) =
        unsupported_offscreen_visibility_transition_kind(previous_visibility, current_visibility)
    else {
        return Ok(None);
    };

    Ok(Some(UnsupportedOffscreenVisibilityTransitionRecord {
        work_in_progress,
        previous,
        key: node.key().cloned(),
        mode: unsupported_offscreen_visibility_mode(current_visibility),
        previous_visibility,
        current_visibility,
        transition,
        child_traversal_blocker,
        render_lanes,
        work_in_progress_lanes: node.lanes(),
        work_in_progress_child_lanes: node.child_lanes(),
        previous_lanes: previous_node.lanes(),
        previous_child_lanes: previous_node.child_lanes(),
        render_includes_offscreen_lane: render_lanes.contains_lane(Lane::OFFSCREEN),
        work_in_progress_includes_offscreen_lane: node.lanes().contains_lane(Lane::OFFSCREEN),
    }))
}

pub(crate) fn unsupported_offscreen_begin_work_record(
    arena: &FiberArena,
    request: BeginWorkRequest,
) -> Result<UnsupportedOffscreenChildShapeRecord, BeginWorkError> {
    let fiber = request.work_in_progress();
    let node = arena.get(fiber)?;
    let tag = node.tag();

    if tag != FiberTag::Offscreen {
        return Err(BeginWorkError::UnsupportedFiberTag { fiber, tag });
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
    let shape = match (child, child_sibling) {
        (None, _) => UnsupportedOffscreenChildShapeKind::Empty,
        (Some(_), None) => UnsupportedOffscreenChildShapeKind::SingleChild,
        (Some(_), Some(_)) => UnsupportedOffscreenChildShapeKind::MultipleChildren,
    };

    Ok(UnsupportedOffscreenChildShapeRecord {
        fiber,
        key: node.key().cloned(),
        pending_props: node.pending_props(),
        memoized_props: node.memoized_props(),
        memoized_state: node.memoized_state(),
        state_node: node.state_node(),
        child,
        child_tag,
        child_sibling,
        child_sibling_tag,
        render_lanes: request.render_lanes(),
        thenable_ping_blocker: unsupported_offscreen_thenable_ping_blocker_record(
            node.update_queue(),
            node.flags(),
            child,
            request.render_lanes(),
        ),
        shape,
        visibility_transition: unsupported_offscreen_visibility_transition_record(
            arena,
            fiber,
            request.render_lanes(),
            UnsupportedOffscreenVisibilityChildTraversalBlocker::BeginWorkDoesNotTraverseOffscreenChildren,
        )?,
        feature: OFFSCREEN_UNSUPPORTED_FEATURE,
    })
}

pub(crate) fn unsupported_suspense_list_begin_work_record(
    arena: &FiberArena,
    request: BeginWorkRequest,
) -> Result<UnsupportedSuspenseListChildShapeRecord, BeginWorkError> {
    let fiber = request.work_in_progress();
    let node = arena.get(fiber)?;
    let tag = node.tag();

    if tag != FiberTag::SuspenseList {
        return Err(BeginWorkError::UnsupportedFiberTag { fiber, tag });
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
    let shape = match (child, child_sibling) {
        (None, _) => UnsupportedSuspenseListChildShapeKind::Empty,
        (Some(_), None) => UnsupportedSuspenseListChildShapeKind::SingleChild,
        (Some(_), Some(_)) => UnsupportedSuspenseListChildShapeKind::MultipleChildren,
    };

    Ok(UnsupportedSuspenseListChildShapeRecord {
        fiber,
        key: node.key().cloned(),
        pending_props: node.pending_props(),
        memoized_props: node.memoized_props(),
        memoized_state: node.memoized_state(),
        child,
        child_tag,
        child_sibling,
        child_sibling_tag,
        render_lanes: request.render_lanes(),
        shape,
        feature: SUSPENSE_LIST_UNSUPPORTED_FEATURE,
    })
}

pub(crate) fn unsupported_activity_begin_work_record(
    arena: &FiberArena,
    request: BeginWorkRequest,
) -> Result<UnsupportedActivityChildShapeRecord, BeginWorkError> {
    let fiber = request.work_in_progress();
    let node = arena.get(fiber)?;
    let tag = node.tag();

    if tag != FiberTag::Activity {
        return Err(BeginWorkError::UnsupportedFiberTag { fiber, tag });
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
    let shape = if node.memoized_state() != StateHandle::NONE {
        UnsupportedActivityChildShapeKind::Dehydrated
    } else {
        match child_tag {
            None => UnsupportedActivityChildShapeKind::Empty,
            Some(FiberTag::Offscreen) if child_sibling.is_some() => {
                UnsupportedActivityChildShapeKind::PrimaryOffscreenWithSibling
            }
            Some(FiberTag::Offscreen) => UnsupportedActivityChildShapeKind::PrimaryOffscreen,
            Some(_) => UnsupportedActivityChildShapeKind::UnsupportedPrimary,
        }
    };

    Ok(UnsupportedActivityChildShapeRecord {
        fiber,
        key: node.key().cloned(),
        pending_props: node.pending_props(),
        memoized_props: node.memoized_props(),
        memoized_state: node.memoized_state(),
        state_node: node.state_node(),
        child,
        child_tag,
        child_sibling,
        child_sibling_tag,
        render_lanes: request.render_lanes(),
        shape,
        feature: ACTIVITY_UNSUPPORTED_FEATURE,
    })
}

fn unsupported_begin_work_error(
    arena: &FiberArena,
    request: BeginWorkRequest,
) -> Result<BeginWorkError, BeginWorkError> {
    let fiber = request.work_in_progress();
    let tag = arena.get(fiber)?.tag();

    match tag {
        FiberTag::Portal => Ok(BeginWorkError::UnsupportedPortal(Box::new(
            unsupported_portal_begin_work_record(arena, request)?,
        ))),
        FiberTag::Suspense => Ok(BeginWorkError::UnsupportedSuspenseChildShape(Box::new(
            unsupported_suspense_begin_work_record(arena, request)?,
        ))),
        FiberTag::Offscreen => Ok(BeginWorkError::UnsupportedOffscreenChildShape(Box::new(
            unsupported_offscreen_begin_work_record(arena, request)?,
        ))),
        FiberTag::SuspenseList => Ok(BeginWorkError::UnsupportedSuspenseListChildShape(Box::new(
            unsupported_suspense_list_begin_work_record(arena, request)?,
        ))),
        FiberTag::Activity => Ok(BeginWorkError::UnsupportedActivityChildShape(Box::new(
            unsupported_activity_begin_work_record(arena, request)?,
        ))),
        _ => Ok(BeginWorkError::UnsupportedFiberTag { fiber, tag }),
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FunctionComponentBailoutContextDependencySummary {
    dependency_count: usize,
    dependency_lanes: Lanes,
}

fn function_component_bailout_context_dependency_summary(
    dependencies: &[FunctionComponentContextDependencyRecord],
    current: FiberId,
    work_in_progress: FiberId,
) -> FunctionComponentBailoutContextDependencySummary {
    dependencies
        .iter()
        .filter(|dependency| {
            let fiber = dependency.fiber();
            fiber == current || fiber == work_in_progress
        })
        .fold(
            FunctionComponentBailoutContextDependencySummary {
                dependency_count: 0,
                dependency_lanes: Lanes::NO,
            },
            |summary, dependency| FunctionComponentBailoutContextDependencySummary {
                dependency_count: summary.dependency_count + 1,
                dependency_lanes: summary
                    .dependency_lanes
                    .merge(dependency.dependency_lanes()),
            },
        )
}

fn function_component_bailout_hook_effect_flags(mode: FiberMode) -> FiberFlags {
    let mut flags = FiberFlags::PASSIVE | FiberFlags::UPDATE;
    if mode.contains_any(FiberMode::STRICT_EFFECTS) {
        flags |= FiberFlags::MOUNT_PASSIVE_DEV | FiberFlags::MOUNT_LAYOUT_DEV;
    }
    flags
}

fn begin_work_function_component_bailout_blocker(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    context_dependencies: &[FunctionComponentContextDependencyRecord],
) -> Result<
    FunctionComponentBeginWorkBailoutBlockerRecord,
    FunctionComponentBeginWorkBailoutBlockerError,
> {
    let work_in_progress = request.work_in_progress();
    let render_lanes = request.render_lanes();
    let (
        tag,
        current,
        pending_props,
        work_in_progress_lanes,
        child,
        child_lanes,
        work_in_progress_update_queue_before,
        work_in_progress_dependencies_before,
        work_in_progress_flags_before,
        mode,
    ) = {
        let node = arena.get(work_in_progress)?;
        (
            node.tag(),
            node.alternate(),
            node.pending_props(),
            node.lanes(),
            node.child(),
            node.child_lanes(),
            node.update_queue(),
            node.dependencies(),
            node.flags(),
            node.mode(),
        )
    };

    if tag != FiberTag::FunctionComponent {
        return Err(
            FunctionComponentBeginWorkBailoutBlockerError::UnexpectedFiberTag {
                fiber: work_in_progress,
                tag,
            },
        );
    }

    let Some(current) = current else {
        return Err(
            FunctionComponentBeginWorkBailoutBlockerError::MissingCurrent { work_in_progress },
        );
    };

    let (memoized_props, current_lanes_before, reused_update_queue, reused_dependencies) = {
        let current_node = arena.get(current)?;
        (
            current_node.memoized_props(),
            current_node.lanes(),
            current_node.update_queue(),
            current_node.dependencies(),
        )
    };

    if memoized_props != pending_props {
        return Err(
            FunctionComponentBeginWorkBailoutBlockerError::PropsChanged {
                current,
                work_in_progress,
                memoized_props,
                pending_props,
            },
        );
    }

    let context_summary = function_component_bailout_context_dependency_summary(
        context_dependencies,
        current,
        work_in_progress,
    );
    if context_summary.dependency_lanes.contains_any(render_lanes) {
        return Err(
            FunctionComponentBeginWorkBailoutBlockerError::ContextChanged {
                current,
                work_in_progress,
                render_lanes,
                context_dependency_count: context_summary.dependency_count,
                context_dependency_lanes: context_summary.dependency_lanes,
            },
        );
    }

    if current_lanes_before.contains_any(render_lanes) {
        return Err(
            FunctionComponentBeginWorkBailoutBlockerError::ScheduledUpdate {
                current,
                render_lanes,
                current_lanes: current_lanes_before,
            },
        );
    }

    if child_lanes.contains_any(render_lanes) {
        return Err(
            FunctionComponentBeginWorkBailoutBlockerError::ChildLanesIntersectRenderLanes {
                work_in_progress,
                render_lanes,
                child_lanes,
                child,
            },
        );
    }

    let current_lanes_after = current_lanes_before.remove(render_lanes);
    let hook_effect_flags = function_component_bailout_hook_effect_flags(mode);
    let work_in_progress_flags_after = work_in_progress_flags_before.remove(hook_effect_flags);
    let removed_hook_effect_flags = work_in_progress_flags_before.intersect(hook_effect_flags);

    arena.get_mut(current)?.set_lanes(current_lanes_after);
    {
        let node = arena.get_mut(work_in_progress)?;
        node.set_update_queue(reused_update_queue);
        node.set_dependencies(reused_dependencies);
        node.set_flags(work_in_progress_flags_after);
    }

    Ok(FunctionComponentBeginWorkBailoutBlockerRecord {
        current,
        work_in_progress,
        render_lanes,
        pending_props,
        memoized_props,
        current_lanes_before,
        current_lanes_after,
        skipped_lanes: work_in_progress_lanes,
        child,
        child_lanes,
        child_to_visit: None,
        context_dependency_count: context_summary.dependency_count,
        context_dependency_lanes: context_summary.dependency_lanes,
        work_in_progress_update_queue_before,
        work_in_progress_update_queue_after: reused_update_queue,
        work_in_progress_dependencies_before,
        work_in_progress_dependencies_after: reused_dependencies,
        reused_update_queue,
        reused_dependencies,
        work_in_progress_flags_before,
        work_in_progress_flags_after,
        removed_hook_effect_flags,
        child_traversal_blocked: true,
    })
}

#[cfg(test)]
pub(crate) fn begin_work_function_component_bailout_blocker_for_test(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    context_dependencies: &[FunctionComponentContextDependencyRecord],
) -> Result<
    FunctionComponentBeginWorkBailoutBlockerRecord,
    FunctionComponentBeginWorkBailoutBlockerError,
> {
    begin_work_function_component_bailout_blocker(arena, request, context_dependencies)
}

pub(crate) fn begin_work(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<BeginWorkResult, BeginWorkError> {
    let work_in_progress = request.work_in_progress();
    let tag = arena.get(work_in_progress)?.tag();

    match tag {
        FiberTag::FunctionComponent => {
            let render = render_function_component(
                arena,
                work_in_progress,
                request.render_lanes(),
                invoker,
            )?;

            Ok(BeginWorkResult::FunctionComponent(
                FunctionComponentBeginWorkRecord { render },
            ))
        }
        FiberTag::Fragment => Ok(BeginWorkResult::Fragment(
            begin_work_fragment_single_host_child(arena, request)?,
        )),
        _ => Err(unsupported_begin_work_error(arena, request)?),
    }
}

pub(crate) fn begin_work_with_use_state(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    hook_store: &mut FunctionComponentHookRenderStore,
    state_request: FunctionComponentUseStateRenderRequest,
    invoker: &mut impl FunctionComponentInvoker,
    reducer: impl FnMut(StateHandle, &FunctionComponentStateActionHandle) -> StateHandle,
) -> Result<FunctionComponentUseStateBeginWorkRecord, BeginWorkError> {
    let work_in_progress = request.work_in_progress();
    let tag = arena.get(work_in_progress)?.tag();

    match tag {
        FiberTag::FunctionComponent => {
            let state_render = render_function_component_with_use_state(
                arena,
                hook_store,
                work_in_progress,
                request.render_lanes(),
                state_request,
                invoker,
                reducer,
            )?;
            Ok(function_component_use_state_begin_work_record(state_render))
        }
        _ => Err(unsupported_begin_work_error(arena, request)?),
    }
}

fn function_component_use_state_begin_work_record(
    state_render: FunctionComponentUseStateRenderRecord,
) -> FunctionComponentUseStateBeginWorkRecord {
    FunctionComponentUseStateBeginWorkRecord {
        begin_work: FunctionComponentBeginWorkRecord {
            render: state_render.render(),
        },
        hook_result: state_render.hook_result(),
        state_hook: state_render.state_hook(),
    }
}

pub(crate) fn begin_work_fragment_single_host_child(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
) -> Result<FragmentSingleHostChildBeginWorkRecord, FragmentSingleHostChildBeginWorkError> {
    let fragment = request.work_in_progress();
    let node = arena.get(fragment)?;
    let tag = node.tag();
    if tag != FiberTag::Fragment {
        return Err(FragmentSingleHostChildBeginWorkError::UnexpectedFiberTag {
            fiber: fragment,
            tag,
        });
    }
    if let Some(key) = node.key().cloned() {
        return Err(
            FragmentSingleHostChildBeginWorkError::KeyedFragmentUnsupported { fragment, key },
        );
    }
    if let Some(sibling) = node.sibling() {
        return Err(
            FragmentSingleHostChildBeginWorkError::FragmentSiblingUnsupported { fragment, sibling },
        );
    }
    let current = node.alternate();
    let pending_props = node.pending_props();
    let child = node
        .child()
        .ok_or(FragmentSingleHostChildBeginWorkError::MissingChild { fragment })?;

    if let Some(current) = current
        && let Some(child) = arena.get(current)?.child()
    {
        return Err(
            FragmentSingleHostChildBeginWorkError::ExistingCurrentChild {
                fragment,
                current,
                child,
            },
        );
    }

    let child_node = arena.get(child)?;
    if let Some(sibling) = child_node.sibling() {
        return Err(FragmentSingleHostChildBeginWorkError::MultipleChildren {
            fragment,
            first_child: child,
            sibling,
        });
    }
    let child_tag = child_node.tag();
    if !matches!(child_tag, FiberTag::HostComponent | FiberTag::HostText) {
        return Err(FragmentSingleHostChildBeginWorkError::UnsupportedChildTag {
            fragment,
            child,
            tag: child_tag,
        });
    }
    let child_pending_props = child_node.pending_props();

    arena.get_mut(fragment)?.set_memoized_props(pending_props);

    Ok(FragmentSingleHostChildBeginWorkRecord {
        fragment,
        current,
        child,
        child_tag,
        pending_props,
        child_pending_props,
        render_lanes: request.render_lanes(),
    })
}

pub(crate) fn begin_work_host_root_one_level_child_set(
    child_set: &HostRootOneLevelChildSet,
) -> Result<HostRootOneLevelChildSetBeginWorkRecord, HostRootOneLevelChildSetBeginWorkError> {
    let root_element = child_set.root_element();
    let kind = child_set.kind();
    if root_element.is_none() {
        return Err(HostRootOneLevelChildSetBeginWorkError::RootElementMissing { kind });
    }
    if kind == HostRootOneLevelChildSetKind::Fragment
        && let Some(key) = child_set.key().cloned()
    {
        return Err(
            HostRootOneLevelChildSetBeginWorkError::KeyedFragmentUnsupported { root_element, key },
        );
    }

    let mut children = Vec::with_capacity(child_set.entries().len());
    for (child_index, entry) in child_set.entries().iter().enumerate() {
        match entry {
            HostRootOneLevelChildSetEntry::Host { element } if element.is_some() => {
                children.push(*element);
            }
            HostRootOneLevelChildSetEntry::Host { .. } => {
                return Err(HostRootOneLevelChildSetBeginWorkError::MissingHostChild {
                    root_element,
                    kind,
                    child_index,
                });
            }
            HostRootOneLevelChildSetEntry::KeyedHost { element, key } => {
                return Err(
                    HostRootOneLevelChildSetBeginWorkError::KeyedHostChildUnsupported {
                        root_element,
                        kind,
                        child_index,
                        element: *element,
                        key: key.clone(),
                    },
                );
            }
            HostRootOneLevelChildSetEntry::NestedArray { first_child } => {
                return Err(
                    HostRootOneLevelChildSetBeginWorkError::NestedChildSetUnsupported {
                        root_element,
                        kind,
                        child_index,
                        nested_kind: HostRootOneLevelChildSetKind::Array,
                        first_child: *first_child,
                    },
                );
            }
            HostRootOneLevelChildSetEntry::NestedFragment { first_child, .. } => {
                return Err(
                    HostRootOneLevelChildSetBeginWorkError::NestedChildSetUnsupported {
                        root_element,
                        kind,
                        child_index,
                        nested_kind: HostRootOneLevelChildSetKind::Fragment,
                        first_child: *first_child,
                    },
                );
            }
        }
    }

    if children.len() < 2 {
        return Err(
            HostRootOneLevelChildSetBeginWorkError::ExpectedMultipleHostChildren {
                root_element,
                kind,
                count: children.len(),
            },
        );
    }

    let first_child = children[0];
    let last_child = *children
        .last()
        .expect("child count was validated to contain at least two entries");

    Ok(HostRootOneLevelChildSetBeginWorkRecord {
        root_element,
        kind,
        child_count: children.len(),
        first_child,
        last_child,
        children,
    })
}

pub(crate) fn begin_work_with_context_reads(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    contexts: &[ContextHandle],
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<BeginWorkResult, BeginWorkError> {
    let work_in_progress = request.work_in_progress();
    let tag = arena.get(work_in_progress)?.tag();

    if tag != FiberTag::FunctionComponent {
        return Err(unsupported_begin_work_error(arena, request)?);
    }

    let render = render_function_component_with_context_reads(
        arena,
        context_store,
        work_in_progress,
        request.render_lanes(),
        contexts,
        invoker,
    )?;

    Ok(BeginWorkResult::FunctionComponent(
        FunctionComponentBeginWorkRecord { render },
    ))
}

pub(crate) fn begin_work_function_component_use_context(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<FunctionComponentUseContextBeginWorkRecord, BeginWorkError> {
    begin_work_function_component_use_context_impl(arena, request, context_store, None, invoker)
}

fn begin_work_function_component_required_use_context(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    expected_context: ContextHandle,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<FunctionComponentUseContextBeginWorkRecord, BeginWorkError> {
    begin_work_function_component_use_context_impl(
        arena,
        request,
        context_store,
        Some(expected_context),
        invoker,
    )
}

fn begin_work_function_component_use_context_impl(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    expected_context: Option<ContextHandle>,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<FunctionComponentUseContextBeginWorkRecord, BeginWorkError> {
    let work_in_progress = request.work_in_progress();
    let tag = arena.get(work_in_progress)?.tag();

    if tag != FiberTag::FunctionComponent {
        return Err(unsupported_begin_work_error(arena, request)?);
    }

    let render = match expected_context {
        Some(context) => render_function_component_with_required_use_context(
            arena,
            context_store,
            work_in_progress,
            request.render_lanes(),
            context,
            invoker,
        )?,
        None => render_function_component_with_use_context(
            arena,
            context_store,
            work_in_progress,
            request.render_lanes(),
            invoker,
        )?,
    };

    Ok(FunctionComponentUseContextBeginWorkRecord { render })
}

pub(crate) fn begin_work_context_provider_child(
    arena: &mut FiberArena,
    request: ContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<ContextProviderBeginWorkRecord, ContextProviderBeginWorkError> {
    let child = validate_context_provider_handoff_shape(arena, request.provider())?;
    let provider_snapshot = context_store
        .push_provider(request.context(), request.value())
        .map_err(|error| ContextProviderBeginWorkError::ContextStack {
            provider: request.provider(),
            context: request.context(),
            error: Box::new(error),
        })?;
    let pushed_stack_depth = context_store.stack_depth();

    let child_result = begin_work_with_context_reads(
        arena,
        BeginWorkRequest::new(child, request.render_lanes()),
        context_store,
        &[request.context()],
        invoker,
    )
    .map(BeginWorkResult::function_component);
    let restore_result = context_store.restore_snapshot(provider_snapshot);
    let restored_stack_depth = context_store.stack_depth();

    match (child_result, restore_result) {
        (Ok(child_begin_work), Ok(())) => Ok(ContextProviderBeginWorkRecord {
            provider: request.provider(),
            child,
            context: request.context(),
            value: request.value(),
            provider_snapshot,
            pushed_stack_depth,
            restored_stack_depth,
            child_begin_work,
        }),
        (Err(error), Ok(())) => Err(ContextProviderBeginWorkError::ChildBeginWork {
            provider: request.provider(),
            child,
            error: Box::new(error),
        }),
        (Ok(_), Err(error)) => Err(ContextProviderBeginWorkError::ContextRestore {
            provider: request.provider(),
            context: request.context(),
            snapshot: provider_snapshot,
            error: Box::new(error),
        }),
        (Err(child_error), Err(restore_error)) => Err(
            ContextProviderBeginWorkError::ContextRestoreAfterChildError {
                provider: request.provider(),
                child,
                context: request.context(),
                child_error: Box::new(child_error),
                restore_error: Box::new(restore_error),
            },
        ),
    }
}

pub(crate) fn begin_work_context_provider_use_context_child(
    arena: &mut FiberArena,
    request: ContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<ContextProviderUseContextBeginWorkRecord, ContextProviderBeginWorkError> {
    let child = validate_context_provider_handoff_shape(arena, request.provider())?;
    let provider_snapshot = context_store
        .push_provider(request.context(), request.value())
        .map_err(|error| ContextProviderBeginWorkError::ContextStack {
            provider: request.provider(),
            context: request.context(),
            error: Box::new(error),
        })?;
    let pushed_stack_depth = context_store.stack_depth();

    let child_result = begin_work_function_component_required_use_context(
        arena,
        BeginWorkRequest::new(child, request.render_lanes()),
        context_store,
        request.context(),
        invoker,
    );
    let restore_result = context_store.restore_snapshot(provider_snapshot);
    let restored_stack_depth = context_store.stack_depth();

    match (child_result, restore_result) {
        (Ok(child_begin_work), Ok(())) => Ok(ContextProviderUseContextBeginWorkRecord {
            provider: request.provider(),
            child,
            context: request.context(),
            value: request.value(),
            provider_snapshot,
            pushed_stack_depth,
            restored_stack_depth,
            child_begin_work,
        }),
        (Err(error), Ok(())) => Err(ContextProviderBeginWorkError::ChildBeginWork {
            provider: request.provider(),
            child,
            error: Box::new(error),
        }),
        (Ok(_), Err(error)) => Err(ContextProviderBeginWorkError::ContextRestore {
            provider: request.provider(),
            context: request.context(),
            snapshot: provider_snapshot,
            error: Box::new(error),
        }),
        (Err(child_error), Err(restore_error)) => Err(
            ContextProviderBeginWorkError::ContextRestoreAfterChildError {
                provider: request.provider(),
                child,
                context: request.context(),
                child_error: Box::new(child_error),
                restore_error: Box::new(restore_error),
            },
        ),
    }
}

pub(crate) fn begin_work_context_provider_use_context_single_child(
    arena: &mut FiberArena,
    request: ContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
) -> Result<ContextProviderUseContextSingleChildBeginWorkRecord, ContextProviderBeginWorkError> {
    let begin_work =
        begin_work_context_provider_use_context_child(arena, request, context_store, invoker)?;
    let single_child = reconcile_function_component_single_child_output(
        arena,
        begin_work.child_render(),
        resolver,
    )
    .map_err(|error| ContextProviderBeginWorkError::ChildBeginWork {
        provider: begin_work.provider(),
        child: begin_work.child(),
        error: Box::new(BeginWorkError::FunctionComponentSingleChild(error)),
    })?;

    Ok(ContextProviderUseContextSingleChildBeginWorkRecord {
        begin_work,
        single_child,
    })
}

#[cfg(test)]
pub(crate) fn begin_work_context_provider_use_context_child_for_complete_traversal(
    arena: &mut FiberArena,
    request: ContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<ContextProviderUseContextOpenScopeBeginWorkRecord, ContextProviderBeginWorkError> {
    let child = validate_context_provider_handoff_shape(arena, request.provider())?;
    let provider_snapshot = context_store
        .push_provider(request.context(), request.value())
        .map_err(|error| ContextProviderBeginWorkError::ContextStack {
            provider: request.provider(),
            context: request.context(),
            error: Box::new(error),
        })?;
    let provider_token = context_store.context_stack().snapshot().top_frame();
    let pushed_stack_depth = context_store.stack_depth();

    let child_result = begin_work_function_component_required_use_context(
        arena,
        BeginWorkRequest::new(child, request.render_lanes()),
        context_store,
        request.context(),
        invoker,
    );

    match child_result {
        Ok(child_begin_work) => Ok(ContextProviderUseContextOpenScopeBeginWorkRecord {
            provider: request.provider(),
            child,
            context: request.context(),
            value: request.value(),
            provider_snapshot,
            provider_token,
            pushed_stack_depth,
            child_begin_work,
        }),
        Err(error) => match context_store.restore_snapshot(provider_snapshot) {
            Ok(()) => Err(ContextProviderBeginWorkError::ChildBeginWork {
                provider: request.provider(),
                child,
                error: Box::new(error),
            }),
            Err(restore_error) => Err(
                ContextProviderBeginWorkError::ContextRestoreAfterChildError {
                    provider: request.provider(),
                    child,
                    context: request.context(),
                    child_error: Box::new(error),
                    restore_error: Box::new(restore_error),
                },
            ),
        },
    }
}

#[cfg(test)]
pub(crate) fn begin_work_context_provider_use_context_single_child_for_complete_traversal(
    arena: &mut FiberArena,
    request: ContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
) -> Result<
    ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord,
    ContextProviderBeginWorkError,
> {
    let begin_work = begin_work_context_provider_use_context_child_for_complete_traversal(
        arena,
        request,
        context_store,
        invoker,
    )?;
    let single_child = reconcile_function_component_single_child_output(
        arena,
        begin_work.child_render(),
        resolver,
    );

    match single_child {
        Ok(single_child) => Ok(
            ContextProviderUseContextOpenScopeSingleChildBeginWorkRecord {
                begin_work,
                single_child,
            },
        ),
        Err(error) => match context_store.restore_snapshot(begin_work.provider_snapshot()) {
            Ok(()) => Err(ContextProviderBeginWorkError::ChildBeginWork {
                provider: begin_work.provider(),
                child: begin_work.child(),
                error: Box::new(BeginWorkError::FunctionComponentSingleChild(error)),
            }),
            Err(restore_error) => Err(
                ContextProviderBeginWorkError::ContextRestoreAfterChildError {
                    provider: begin_work.provider(),
                    child: begin_work.child(),
                    context: begin_work.context(),
                    child_error: Box::new(BeginWorkError::FunctionComponentSingleChild(error)),
                    restore_error: Box::new(restore_error),
                },
            ),
        },
    }
}

pub(crate) fn begin_work_context_provider_use_context_subtree(
    arena: &mut FiberArena,
    request: ContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<ContextProviderSubtreeUseContextBeginWorkRecord, ContextProviderBeginWorkError> {
    let provider_node = arena.get(request.provider())?;
    let provider_tag = provider_node.tag();
    if provider_tag != FiberTag::ContextProvider {
        return Err(ContextProviderBeginWorkError::UnexpectedFiberTag {
            fiber: request.provider(),
            tag: provider_tag,
        });
    }

    let provider_snapshot = context_store
        .push_provider(request.context(), request.value())
        .map_err(|error| ContextProviderBeginWorkError::ContextStack {
            provider: request.provider(),
            context: request.context(),
            error: Box::new(error),
        })?;
    let provider_token = context_store.context_stack().snapshot().top_frame();
    let pushed_stack_depth = context_store.stack_depth();

    let traversal_result = begin_work_context_provider_use_context_subtree_children(
        arena,
        request,
        context_store,
        invoker,
    );
    let restore_result = context_store.restore_snapshot(provider_snapshot);
    let restored_stack_depth = context_store.stack_depth();

    match (traversal_result, restore_result) {
        (Ok((visited_fibers, consumers)), Ok(())) => {
            Ok(ContextProviderSubtreeUseContextBeginWorkRecord {
                provider: request.provider(),
                context: request.context(),
                value: request.value(),
                provider_snapshot,
                provider_token,
                pushed_stack_depth,
                restored_stack_depth,
                visited_fibers,
                consumers,
            })
        }
        (Ok(_), Err(error)) | (Err(_), Err(error)) => {
            Err(ContextProviderBeginWorkError::ContextRestore {
                provider: request.provider(),
                context: request.context(),
                snapshot: provider_snapshot,
                error: Box::new(error),
            })
        }
        (Err(error), Ok(())) => Err(error),
    }
}

fn begin_work_context_provider_use_context_subtree_children(
    arena: &mut FiberArena,
    request: ContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    (
        Vec<ContextProviderSubtreeVisitedFiberRecord>,
        Vec<ContextProviderSubtreeUseContextConsumerBeginWorkRecord>,
    ),
    ContextProviderBeginWorkError,
> {
    let mut visited_fibers = Vec::new();
    let mut consumers = Vec::new();
    let mut pending = arena
        .child_ids(request.provider())?
        .into_iter()
        .rev()
        .map(|fiber| (fiber, 1))
        .collect::<Vec<_>>();

    while let Some((fiber, depth)) = pending.pop() {
        let traversal_index = visited_fibers.len();
        if traversal_index >= CONTEXT_PROVIDER_SUBTREE_TRAVERSAL_MAX_FIBERS {
            return Err(
                ContextProviderBeginWorkError::SubtreeTraversalLimitExceeded {
                    provider: request.provider(),
                    max_fibers: CONTEXT_PROVIDER_SUBTREE_TRAVERSAL_MAX_FIBERS,
                    next_fiber: fiber,
                },
            );
        }

        let tag = arena.get(fiber)?.tag();
        visited_fibers.push(ContextProviderSubtreeVisitedFiberRecord::new(
            traversal_index,
            fiber,
            tag,
            depth,
        ));

        match tag {
            FiberTag::FunctionComponent => {
                let child_begin_work = begin_work_function_component_required_use_context(
                    arena,
                    BeginWorkRequest::new(fiber, request.render_lanes()),
                    context_store,
                    request.context(),
                    invoker,
                )
                .map_err(|error| {
                    ContextProviderBeginWorkError::ChildBeginWork {
                        provider: request.provider(),
                        child: fiber,
                        error: Box::new(error),
                    }
                })?;
                consumers.push(ContextProviderSubtreeUseContextConsumerBeginWorkRecord {
                    traversal_index,
                    depth,
                    fiber,
                    child_begin_work,
                });
            }
            FiberTag::Fragment | FiberTag::Mode | FiberTag::HostComponent => {
                for child in arena.child_ids(fiber)?.into_iter().rev() {
                    pending.push((child, depth + 1));
                }
            }
            FiberTag::HostText => {}
            _ => {
                return Err(ContextProviderBeginWorkError::UnsupportedSubtreeFiberTag {
                    provider: request.provider(),
                    fiber,
                    tag,
                });
            }
        }
    }

    if consumers.is_empty() {
        return Err(ContextProviderBeginWorkError::MissingSubtreeConsumer {
            provider: request.provider(),
        });
    }

    Ok((visited_fibers, consumers))
}

pub(crate) fn begin_work_nested_context_provider_child(
    arena: &mut FiberArena,
    request: NestedContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<NestedContextProviderBeginWorkRecord, NestedContextProviderBeginWorkError> {
    let shape = validate_nested_context_provider_handoff_shape(arena, request.outer_provider())?;
    let outer_snapshot = context_store
        .push_provider(request.outer_context(), request.outer_value())
        .map_err(|error| NestedContextProviderBeginWorkError::ContextStack {
            provider: request.outer_provider(),
            context: request.outer_context(),
            error: Box::new(error),
        })?;
    let outer_pushed_stack_depth = context_store.stack_depth();

    let inner_snapshot =
        match context_store.push_provider(request.inner_context(), request.inner_value()) {
            Ok(snapshot) => snapshot,
            Err(error) => {
                if let Err(restore_error) = context_store.restore_snapshot(outer_snapshot) {
                    return Err(NestedContextProviderBeginWorkError::ContextRestore {
                        provider: request.outer_provider(),
                        context: request.outer_context(),
                        snapshot: outer_snapshot,
                        error: Box::new(restore_error),
                    });
                }

                return Err(NestedContextProviderBeginWorkError::ContextStack {
                    provider: shape.inner_provider,
                    context: request.inner_context(),
                    error: Box::new(error),
                });
            }
        };
    let inner_pushed_stack_depth = context_store.stack_depth();
    let contexts = [request.outer_context(), request.inner_context()];

    let child_result = begin_work_with_context_reads(
        arena,
        BeginWorkRequest::new(shape.child, request.render_lanes()),
        context_store,
        &contexts,
        invoker,
    )
    .map(BeginWorkResult::function_component);
    let inner_restore_result = context_store.restore_snapshot(inner_snapshot);
    let inner_restored_stack_depth = context_store.stack_depth();
    let outer_restore_result = context_store.restore_snapshot(outer_snapshot);
    let outer_restored_stack_depth = context_store.stack_depth();

    match (child_result, inner_restore_result, outer_restore_result) {
        (Ok(child_begin_work), Ok(()), Ok(())) => Ok(NestedContextProviderBeginWorkRecord {
            outer_provider: request.outer_provider(),
            inner_provider: shape.inner_provider,
            child: shape.child,
            outer_context: request.outer_context(),
            outer_value: request.outer_value(),
            inner_context: request.inner_context(),
            inner_value: request.inner_value(),
            outer_provider_snapshot: outer_snapshot,
            inner_provider_snapshot: inner_snapshot,
            outer_pushed_stack_depth,
            inner_pushed_stack_depth,
            inner_restored_stack_depth,
            outer_restored_stack_depth,
            child_begin_work,
        }),
        (Ok(_), Err(error), _) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: shape.inner_provider,
            context: request.inner_context(),
            snapshot: inner_snapshot,
            error: Box::new(error),
        }),
        (Ok(_), Ok(()), Err(error)) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: request.outer_provider(),
            context: request.outer_context(),
            snapshot: outer_snapshot,
            error: Box::new(error),
        }),
        (Err(error), Ok(()), Ok(())) => Err(NestedContextProviderBeginWorkError::ChildBeginWork {
            outer_provider: request.outer_provider(),
            inner_provider: shape.inner_provider,
            child: shape.child,
            error: Box::new(error),
        }),
        (Err(child_error), inner_restore_error, outer_restore_error) => Err(
            NestedContextProviderBeginWorkError::ContextRestoreAfterChildError {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                child: shape.child,
                child_error: Box::new(child_error),
                inner_restore_error: inner_restore_error.err().map(Box::new),
                outer_restore_error: outer_restore_error.err().map(Box::new),
            },
        ),
    }
}

pub(crate) fn begin_work_nested_context_provider_use_context_child(
    arena: &mut FiberArena,
    request: NestedContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<NestedContextProviderUseContextBeginWorkRecord, NestedContextProviderBeginWorkError> {
    let shape = validate_nested_context_provider_handoff_shape(arena, request.outer_provider())?;
    let outer_snapshot = context_store
        .push_provider(request.outer_context(), request.outer_value())
        .map_err(|error| NestedContextProviderBeginWorkError::ContextStack {
            provider: request.outer_provider(),
            context: request.outer_context(),
            error: Box::new(error),
        })?;
    let outer_pushed_stack_depth = context_store.stack_depth();

    let inner_snapshot =
        match context_store.push_provider(request.inner_context(), request.inner_value()) {
            Ok(snapshot) => snapshot,
            Err(error) => {
                if let Err(restore_error) = context_store.restore_snapshot(outer_snapshot) {
                    return Err(NestedContextProviderBeginWorkError::ContextRestore {
                        provider: request.outer_provider(),
                        context: request.outer_context(),
                        snapshot: outer_snapshot,
                        error: Box::new(restore_error),
                    });
                }

                return Err(NestedContextProviderBeginWorkError::ContextStack {
                    provider: shape.inner_provider,
                    context: request.inner_context(),
                    error: Box::new(error),
                });
            }
        };
    let inner_pushed_stack_depth = context_store.stack_depth();

    let child_result = begin_work_function_component_use_context(
        arena,
        BeginWorkRequest::new(shape.child, request.render_lanes()),
        context_store,
        invoker,
    );
    let inner_restore_result = context_store.restore_snapshot(inner_snapshot);
    let inner_restored_stack_depth = context_store.stack_depth();
    let outer_restore_result = context_store.restore_snapshot(outer_snapshot);
    let outer_restored_stack_depth = context_store.stack_depth();

    match (child_result, inner_restore_result, outer_restore_result) {
        (Ok(child_begin_work), Ok(()), Ok(())) => {
            Ok(NestedContextProviderUseContextBeginWorkRecord {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                child: shape.child,
                outer_context: request.outer_context(),
                outer_value: request.outer_value(),
                inner_context: request.inner_context(),
                inner_value: request.inner_value(),
                outer_provider_snapshot: outer_snapshot,
                inner_provider_snapshot: inner_snapshot,
                outer_pushed_stack_depth,
                inner_pushed_stack_depth,
                inner_restored_stack_depth,
                outer_restored_stack_depth,
                child_begin_work,
            })
        }
        (Ok(_), Err(error), _) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: shape.inner_provider,
            context: request.inner_context(),
            snapshot: inner_snapshot,
            error: Box::new(error),
        }),
        (Ok(_), Ok(()), Err(error)) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: request.outer_provider(),
            context: request.outer_context(),
            snapshot: outer_snapshot,
            error: Box::new(error),
        }),
        (Err(error), Ok(()), Ok(())) => Err(NestedContextProviderBeginWorkError::ChildBeginWork {
            outer_provider: request.outer_provider(),
            inner_provider: shape.inner_provider,
            child: shape.child,
            error: Box::new(error),
        }),
        (Err(child_error), inner_restore_error, outer_restore_error) => Err(
            NestedContextProviderBeginWorkError::ContextRestoreAfterChildError {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                child: shape.child,
                child_error: Box::new(child_error),
                inner_restore_error: inner_restore_error.err().map(Box::new),
                outer_restore_error: outer_restore_error.err().map(Box::new),
            },
        ),
    }
}

pub(crate) fn begin_work_nested_context_provider_two_consumer_use_context_children(
    arena: &mut FiberArena,
    request: NestedContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    NestedContextProviderBeginWorkError,
> {
    begin_work_nested_context_provider_two_consumer_use_context_children_with_required_contexts(
        arena,
        request,
        request.inner_context(),
        request.inner_context(),
        context_store,
        invoker,
    )
}

pub(crate) fn begin_work_nested_context_provider_two_provider_use_context_children(
    arena: &mut FiberArena,
    request: NestedContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    NestedContextProviderBeginWorkError,
> {
    begin_work_nested_context_provider_two_consumer_use_context_children_with_required_contexts(
        arena,
        request,
        request.outer_context(),
        request.inner_context(),
        context_store,
        invoker,
    )
}

pub(crate) fn begin_work_nested_context_provider_outer_inner_consumer_use_context_children(
    arena: &mut FiberArena,
    request: NestedContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    NestedContextProviderOuterInnerConsumerUseContextBeginWorkRecord,
    NestedContextProviderBeginWorkError,
> {
    let shape = validate_nested_context_provider_outer_inner_consumer_handoff_shape(
        arena,
        request.outer_provider(),
    )?;
    let outer_snapshot = context_store
        .push_provider(request.outer_context(), request.outer_value())
        .map_err(|error| NestedContextProviderBeginWorkError::ContextStack {
            provider: request.outer_provider(),
            context: request.outer_context(),
            error: Box::new(error),
        })?;
    let outer_provider_token = context_store.context_stack().snapshot().top_frame();
    let outer_pushed_stack_depth = context_store.stack_depth();

    let outer_child_begin_work = match begin_work_function_component_required_use_context(
        arena,
        BeginWorkRequest::new(shape.outer_child, request.render_lanes()),
        context_store,
        request.outer_context(),
        invoker,
    ) {
        Ok(outer_child_begin_work) => outer_child_begin_work,
        Err(error) => {
            return match context_store.restore_snapshot(outer_snapshot) {
                Ok(()) => Err(NestedContextProviderBeginWorkError::ChildBeginWork {
                    outer_provider: request.outer_provider(),
                    inner_provider: shape.inner_provider,
                    child: shape.outer_child,
                    error: Box::new(error),
                }),
                Err(restore_error) => Err(
                    NestedContextProviderBeginWorkError::ContextRestoreAfterChildError {
                        outer_provider: request.outer_provider(),
                        inner_provider: shape.inner_provider,
                        child: shape.outer_child,
                        child_error: Box::new(error),
                        inner_restore_error: None,
                        outer_restore_error: Some(Box::new(restore_error)),
                    },
                ),
            };
        }
    };

    let inner_snapshot =
        match context_store.push_provider(request.inner_context(), request.inner_value()) {
            Ok(snapshot) => snapshot,
            Err(error) => {
                if let Err(restore_error) = context_store.restore_snapshot(outer_snapshot) {
                    return Err(NestedContextProviderBeginWorkError::ContextRestore {
                        provider: request.outer_provider(),
                        context: request.outer_context(),
                        snapshot: outer_snapshot,
                        error: Box::new(restore_error),
                    });
                }

                return Err(NestedContextProviderBeginWorkError::ContextStack {
                    provider: shape.inner_provider,
                    context: request.inner_context(),
                    error: Box::new(error),
                });
            }
        };
    let inner_provider_token = context_store.context_stack().snapshot().top_frame();
    let inner_pushed_stack_depth = context_store.stack_depth();

    let inner_child_result = begin_work_function_component_required_use_context(
        arena,
        BeginWorkRequest::new(shape.inner_child, request.render_lanes()),
        context_store,
        request.inner_context(),
        invoker,
    );
    let inner_restore_result = context_store.restore_snapshot(inner_snapshot);
    let inner_restored_stack_depth = context_store.stack_depth();
    let outer_restore_result = context_store.restore_snapshot(outer_snapshot);
    let outer_restored_stack_depth = context_store.stack_depth();

    match (
        inner_child_result,
        inner_restore_result,
        outer_restore_result,
    ) {
        (Ok(inner_child_begin_work), Ok(()), Ok(())) => Ok(
            NestedContextProviderOuterInnerConsumerUseContextBeginWorkRecord {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                outer_child: shape.outer_child,
                inner_child: shape.inner_child,
                outer_context: request.outer_context(),
                outer_value: request.outer_value(),
                inner_context: request.inner_context(),
                inner_value: request.inner_value(),
                outer_provider_snapshot: outer_snapshot,
                inner_provider_snapshot: inner_snapshot,
                outer_provider_token,
                inner_provider_token,
                outer_pushed_stack_depth,
                inner_pushed_stack_depth,
                inner_restored_stack_depth,
                outer_restored_stack_depth,
                outer_child_begin_work,
                inner_child_begin_work,
            },
        ),
        (Ok(_), Err(error), _) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: shape.inner_provider,
            context: request.inner_context(),
            snapshot: inner_snapshot,
            error: Box::new(error),
        }),
        (Ok(_), Ok(()), Err(error)) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: request.outer_provider(),
            context: request.outer_context(),
            snapshot: outer_snapshot,
            error: Box::new(error),
        }),
        (Err(error), Ok(()), Ok(())) => Err(NestedContextProviderBeginWorkError::ChildBeginWork {
            outer_provider: request.outer_provider(),
            inner_provider: shape.inner_provider,
            child: shape.inner_child,
            error: Box::new(error),
        }),
        (Err(child_error), inner_restore_error, outer_restore_error) => Err(
            NestedContextProviderBeginWorkError::ContextRestoreAfterChildError {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                child: shape.inner_child,
                child_error: Box::new(child_error),
                inner_restore_error: inner_restore_error.err().map(Box::new),
                outer_restore_error: outer_restore_error.err().map(Box::new),
            },
        ),
    }
}

fn begin_work_nested_context_provider_two_consumer_use_context_children_with_required_contexts(
    arena: &mut FiberArena,
    request: NestedContextProviderBeginWorkRequest,
    first_required_context: ContextHandle,
    second_required_context: ContextHandle,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    NestedContextProviderTwoConsumerUseContextBeginWorkRecord,
    NestedContextProviderBeginWorkError,
> {
    let shape = validate_nested_context_provider_two_consumer_handoff_shape(
        arena,
        request.outer_provider(),
    )?;
    let outer_snapshot = context_store
        .push_provider(request.outer_context(), request.outer_value())
        .map_err(|error| NestedContextProviderBeginWorkError::ContextStack {
            provider: request.outer_provider(),
            context: request.outer_context(),
            error: Box::new(error),
        })?;
    let outer_provider_token = context_store.context_stack().snapshot().top_frame();
    let outer_pushed_stack_depth = context_store.stack_depth();

    let inner_snapshot =
        match context_store.push_provider(request.inner_context(), request.inner_value()) {
            Ok(snapshot) => snapshot,
            Err(error) => {
                if let Err(restore_error) = context_store.restore_snapshot(outer_snapshot) {
                    return Err(NestedContextProviderBeginWorkError::ContextRestore {
                        provider: request.outer_provider(),
                        context: request.outer_context(),
                        snapshot: outer_snapshot,
                        error: Box::new(restore_error),
                    });
                }

                return Err(NestedContextProviderBeginWorkError::ContextStack {
                    provider: shape.inner_provider,
                    context: request.inner_context(),
                    error: Box::new(error),
                });
            }
        };
    let inner_provider_token = context_store.context_stack().snapshot().top_frame();
    let inner_pushed_stack_depth = context_store.stack_depth();

    let first_child_result = begin_work_function_component_required_use_context(
        arena,
        BeginWorkRequest::new(shape.first_child, request.render_lanes()),
        context_store,
        first_required_context,
        invoker,
    );
    let child_result = match first_child_result {
        Ok(first_child_begin_work) => {
            let second_child_result = begin_work_function_component_required_use_context(
                arena,
                BeginWorkRequest::new(shape.second_child, request.render_lanes()),
                context_store,
                second_required_context,
                invoker,
            );

            match second_child_result {
                Ok(second_child_begin_work) => {
                    Ok((first_child_begin_work, second_child_begin_work))
                }
                Err(error) => Err((shape.second_child, error)),
            }
        }
        Err(error) => Err((shape.first_child, error)),
    };
    let inner_restore_result = context_store.restore_snapshot(inner_snapshot);
    let inner_restored_stack_depth = context_store.stack_depth();
    let outer_restore_result = context_store.restore_snapshot(outer_snapshot);
    let outer_restored_stack_depth = context_store.stack_depth();

    match (child_result, inner_restore_result, outer_restore_result) {
        (Ok((first_child_begin_work, second_child_begin_work)), Ok(()), Ok(())) => {
            Ok(NestedContextProviderTwoConsumerUseContextBeginWorkRecord {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                first_child: shape.first_child,
                second_child: shape.second_child,
                outer_context: request.outer_context(),
                outer_value: request.outer_value(),
                inner_context: request.inner_context(),
                inner_value: request.inner_value(),
                outer_provider_snapshot: outer_snapshot,
                inner_provider_snapshot: inner_snapshot,
                outer_provider_token,
                inner_provider_token,
                outer_pushed_stack_depth,
                inner_pushed_stack_depth,
                inner_restored_stack_depth,
                outer_restored_stack_depth,
                first_child_begin_work,
                second_child_begin_work,
            })
        }
        (Ok(_), Err(error), _) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: shape.inner_provider,
            context: request.inner_context(),
            snapshot: inner_snapshot,
            error: Box::new(error),
        }),
        (Ok(_), Ok(()), Err(error)) => Err(NestedContextProviderBeginWorkError::ContextRestore {
            provider: request.outer_provider(),
            context: request.outer_context(),
            snapshot: outer_snapshot,
            error: Box::new(error),
        }),
        (Err((child, error)), Ok(()), Ok(())) => {
            Err(NestedContextProviderBeginWorkError::ChildBeginWork {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                child,
                error: Box::new(error),
            })
        }
        (Err((child, child_error)), inner_restore_error, outer_restore_error) => Err(
            NestedContextProviderBeginWorkError::ContextRestoreAfterChildError {
                outer_provider: request.outer_provider(),
                inner_provider: shape.inner_provider,
                child,
                child_error: Box::new(child_error),
                inner_restore_error: inner_restore_error.err().map(Box::new),
                outer_restore_error: outer_restore_error.err().map(Box::new),
            },
        ),
    }
}

pub(crate) fn begin_work_sibling_context_provider_two_consumer_use_context_children(
    arena: &mut FiberArena,
    request: SiblingContextProviderBeginWorkRequest,
    context_store: &mut FunctionComponentContextRenderStore,
    invoker: &mut impl FunctionComponentContextConsumerInvoker,
) -> Result<
    SiblingContextProviderTwoConsumerUseContextBeginWorkRecord,
    SiblingContextProviderBeginWorkError,
> {
    let shape = validate_sibling_context_provider_two_consumer_handoff_shape(
        arena,
        request.first_provider(),
    )?;

    let first_snapshot = context_store
        .push_provider(request.first_context(), request.first_value())
        .map_err(|error| SiblingContextProviderBeginWorkError::ContextStack {
            provider: request.first_provider(),
            context: request.first_context(),
            error: Box::new(error),
        })?;
    let first_provider_token = context_store.context_stack().snapshot().top_frame();
    let first_pushed_stack_depth = context_store.stack_depth();
    let first_child_result = begin_work_function_component_required_use_context(
        arena,
        BeginWorkRequest::new(shape.first_child, request.render_lanes()),
        context_store,
        request.first_context(),
        invoker,
    );
    let first_restore_result = context_store.restore_snapshot(first_snapshot);
    let first_restored_stack_depth = context_store.stack_depth();
    let first_child_begin_work = match (first_child_result, first_restore_result) {
        (Ok(first_child_begin_work), Ok(())) => first_child_begin_work,
        (Ok(_), Err(error)) => {
            return Err(SiblingContextProviderBeginWorkError::ContextRestore {
                provider: request.first_provider(),
                context: request.first_context(),
                snapshot: first_snapshot,
                error: Box::new(error),
            });
        }
        (Err(error), Ok(())) => {
            return Err(SiblingContextProviderBeginWorkError::ChildBeginWork {
                provider: request.first_provider(),
                child: shape.first_child,
                error: Box::new(error),
            });
        }
        (Err(child_error), restore_error) => {
            return Err(
                SiblingContextProviderBeginWorkError::ContextRestoreAfterChildError {
                    provider: request.first_provider(),
                    child: shape.first_child,
                    child_error: Box::new(child_error),
                    restore_error: restore_error.err().map(Box::new),
                },
            );
        }
    };

    let second_snapshot = context_store
        .push_provider(request.second_context(), request.second_value())
        .map_err(|error| SiblingContextProviderBeginWorkError::ContextStack {
            provider: shape.second_provider,
            context: request.second_context(),
            error: Box::new(error),
        })?;
    let second_provider_token = context_store.context_stack().snapshot().top_frame();
    let second_pushed_stack_depth = context_store.stack_depth();
    let second_child_result = begin_work_function_component_required_use_context(
        arena,
        BeginWorkRequest::new(shape.second_child, request.render_lanes()),
        context_store,
        request.second_context(),
        invoker,
    );
    let second_restore_result = context_store.restore_snapshot(second_snapshot);
    let second_restored_stack_depth = context_store.stack_depth();
    let second_child_begin_work = match (second_child_result, second_restore_result) {
        (Ok(second_child_begin_work), Ok(())) => second_child_begin_work,
        (Ok(_), Err(error)) => {
            return Err(SiblingContextProviderBeginWorkError::ContextRestore {
                provider: shape.second_provider,
                context: request.second_context(),
                snapshot: second_snapshot,
                error: Box::new(error),
            });
        }
        (Err(error), Ok(())) => {
            return Err(SiblingContextProviderBeginWorkError::ChildBeginWork {
                provider: shape.second_provider,
                child: shape.second_child,
                error: Box::new(error),
            });
        }
        (Err(child_error), restore_error) => {
            return Err(
                SiblingContextProviderBeginWorkError::ContextRestoreAfterChildError {
                    provider: shape.second_provider,
                    child: shape.second_child,
                    child_error: Box::new(child_error),
                    restore_error: restore_error.err().map(Box::new),
                },
            );
        }
    };

    Ok(SiblingContextProviderTwoConsumerUseContextBeginWorkRecord {
        first_provider: request.first_provider(),
        second_provider: shape.second_provider,
        first_child: shape.first_child,
        second_child: shape.second_child,
        first_context: request.first_context(),
        first_value: request.first_value(),
        second_context: request.second_context(),
        second_value: request.second_value(),
        first_provider_snapshot: first_snapshot,
        second_provider_snapshot: second_snapshot,
        first_provider_token,
        second_provider_token,
        first_pushed_stack_depth,
        first_restored_stack_depth,
        second_pushed_stack_depth,
        second_restored_stack_depth,
        first_child_begin_work,
        second_child_begin_work,
    })
}

fn validate_context_provider_handoff_shape(
    arena: &FiberArena,
    provider: FiberId,
) -> Result<FiberId, ContextProviderBeginWorkError> {
    let provider_node = arena.get(provider)?;
    let provider_tag = provider_node.tag();
    if provider_tag != FiberTag::ContextProvider {
        return Err(ContextProviderBeginWorkError::UnexpectedFiberTag {
            fiber: provider,
            tag: provider_tag,
        });
    }
    if let Some(sibling) = provider_node.sibling() {
        return Err(ContextProviderBeginWorkError::ProviderSiblingUnsupported {
            provider,
            sibling,
        });
    }
    let child = provider_node
        .child()
        .ok_or(ContextProviderBeginWorkError::MissingChild { provider })?;
    let child_node = arena.get(child)?;
    if let Some(sibling) = child_node.sibling() {
        return Err(ContextProviderBeginWorkError::MultipleChildren {
            provider,
            first_child: child,
            sibling,
        });
    }
    let child_tag = child_node.tag();
    if child_tag != FiberTag::FunctionComponent {
        return Err(ContextProviderBeginWorkError::UnsupportedChildTag {
            provider,
            child,
            tag: child_tag,
        });
    }

    Ok(child)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct NestedContextProviderHandoffShape {
    inner_provider: FiberId,
    child: FiberId,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct NestedContextProviderTwoConsumerHandoffShape {
    inner_provider: FiberId,
    first_child: FiberId,
    second_child: FiberId,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct NestedContextProviderOuterInnerConsumerHandoffShape {
    inner_provider: FiberId,
    outer_child: FiberId,
    inner_child: FiberId,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct SiblingContextProviderTwoConsumerHandoffShape {
    second_provider: FiberId,
    first_child: FiberId,
    second_child: FiberId,
}

fn validate_nested_context_provider_handoff_shape(
    arena: &FiberArena,
    outer_provider: FiberId,
) -> Result<NestedContextProviderHandoffShape, NestedContextProviderBeginWorkError> {
    let outer_node = arena.get(outer_provider)?;
    let outer_tag = outer_node.tag();
    if outer_tag != FiberTag::ContextProvider {
        return Err(NestedContextProviderBeginWorkError::UnexpectedFiberTag {
            fiber: outer_provider,
            tag: outer_tag,
        });
    }
    if let Some(sibling) = outer_node.sibling() {
        return Err(
            NestedContextProviderBeginWorkError::ProviderSiblingUnsupported {
                provider: outer_provider,
                sibling,
            },
        );
    }

    let inner_provider =
        outer_node
            .child()
            .ok_or(NestedContextProviderBeginWorkError::MissingChild {
                provider: outer_provider,
            })?;
    let inner_node = arena.get(inner_provider)?;
    if let Some(sibling) = inner_node.sibling() {
        return Err(NestedContextProviderBeginWorkError::MultipleChildren {
            provider: outer_provider,
            first_child: inner_provider,
            sibling,
        });
    }
    let inner_tag = inner_node.tag();
    if inner_tag != FiberTag::ContextProvider {
        return Err(
            NestedContextProviderBeginWorkError::UnsupportedOuterChildTag {
                outer_provider,
                child: inner_provider,
                tag: inner_tag,
            },
        );
    }

    let child = inner_node
        .child()
        .ok_or(NestedContextProviderBeginWorkError::MissingChild {
            provider: inner_provider,
        })?;
    let child_node = arena.get(child)?;
    if let Some(sibling) = child_node.sibling() {
        return Err(NestedContextProviderBeginWorkError::MultipleChildren {
            provider: inner_provider,
            first_child: child,
            sibling,
        });
    }
    let child_tag = child_node.tag();
    if child_tag != FiberTag::FunctionComponent {
        return Err(
            NestedContextProviderBeginWorkError::UnsupportedInnerChildTag {
                inner_provider,
                child,
                tag: child_tag,
            },
        );
    }

    Ok(NestedContextProviderHandoffShape {
        inner_provider,
        child,
    })
}

fn validate_nested_context_provider_two_consumer_handoff_shape(
    arena: &FiberArena,
    outer_provider: FiberId,
) -> Result<NestedContextProviderTwoConsumerHandoffShape, NestedContextProviderBeginWorkError> {
    let outer_node = arena.get(outer_provider)?;
    let outer_tag = outer_node.tag();
    if outer_tag != FiberTag::ContextProvider {
        return Err(NestedContextProviderBeginWorkError::UnexpectedFiberTag {
            fiber: outer_provider,
            tag: outer_tag,
        });
    }
    if let Some(sibling) = outer_node.sibling() {
        return Err(
            NestedContextProviderBeginWorkError::ProviderSiblingUnsupported {
                provider: outer_provider,
                sibling,
            },
        );
    }

    let inner_provider =
        outer_node
            .child()
            .ok_or(NestedContextProviderBeginWorkError::MissingChild {
                provider: outer_provider,
            })?;
    let inner_node = arena.get(inner_provider)?;
    if let Some(sibling) = inner_node.sibling() {
        return Err(NestedContextProviderBeginWorkError::MultipleChildren {
            provider: outer_provider,
            first_child: inner_provider,
            sibling,
        });
    }
    let inner_tag = inner_node.tag();
    if inner_tag != FiberTag::ContextProvider {
        return Err(
            NestedContextProviderBeginWorkError::UnsupportedOuterChildTag {
                outer_provider,
                child: inner_provider,
                tag: inner_tag,
            },
        );
    }

    let first_child =
        inner_node
            .child()
            .ok_or(NestedContextProviderBeginWorkError::MissingChild {
                provider: inner_provider,
            })?;
    let first_child_node = arena.get(first_child)?;
    let first_child_tag = first_child_node.tag();
    if first_child_tag != FiberTag::FunctionComponent {
        return Err(
            NestedContextProviderBeginWorkError::UnsupportedInnerChildTag {
                inner_provider,
                child: first_child,
                tag: first_child_tag,
            },
        );
    }

    let second_child = first_child_node.sibling().ok_or(
        NestedContextProviderBeginWorkError::MissingSecondConsumer {
            inner_provider,
            first_child,
        },
    )?;
    let second_child_node = arena.get(second_child)?;
    let second_child_tag = second_child_node.tag();
    if second_child_tag != FiberTag::FunctionComponent {
        return Err(
            NestedContextProviderBeginWorkError::UnsupportedInnerChildTag {
                inner_provider,
                child: second_child,
                tag: second_child_tag,
            },
        );
    }
    if let Some(sibling) = second_child_node.sibling() {
        return Err(NestedContextProviderBeginWorkError::TooManyConsumers {
            inner_provider,
            first_child,
            second_child,
            sibling,
        });
    }

    Ok(NestedContextProviderTwoConsumerHandoffShape {
        inner_provider,
        first_child,
        second_child,
    })
}

fn validate_nested_context_provider_outer_inner_consumer_handoff_shape(
    arena: &FiberArena,
    outer_provider: FiberId,
) -> Result<NestedContextProviderOuterInnerConsumerHandoffShape, NestedContextProviderBeginWorkError>
{
    let outer_node = arena.get(outer_provider)?;
    let outer_tag = outer_node.tag();
    if outer_tag != FiberTag::ContextProvider {
        return Err(NestedContextProviderBeginWorkError::UnexpectedFiberTag {
            fiber: outer_provider,
            tag: outer_tag,
        });
    }
    if let Some(sibling) = outer_node.sibling() {
        return Err(
            NestedContextProviderBeginWorkError::ProviderSiblingUnsupported {
                provider: outer_provider,
                sibling,
            },
        );
    }

    let outer_child =
        outer_node
            .child()
            .ok_or(NestedContextProviderBeginWorkError::MissingChild {
                provider: outer_provider,
            })?;
    let outer_child_node = arena.get(outer_child)?;
    let outer_child_tag = outer_child_node.tag();
    if outer_child_tag != FiberTag::FunctionComponent {
        return Err(
            NestedContextProviderBeginWorkError::UnsupportedOuterConsumerTag {
                outer_provider,
                child: outer_child,
                tag: outer_child_tag,
            },
        );
    }

    let inner_provider = outer_child_node.sibling().ok_or(
        NestedContextProviderBeginWorkError::MissingInnerProvider {
            outer_provider,
            outer_child,
        },
    )?;
    let inner_node = arena.get(inner_provider)?;
    let inner_tag = inner_node.tag();
    if inner_tag != FiberTag::ContextProvider {
        return Err(
            NestedContextProviderBeginWorkError::UnsupportedOuterChildTag {
                outer_provider,
                child: inner_provider,
                tag: inner_tag,
            },
        );
    }
    if let Some(sibling) = inner_node.sibling() {
        return Err(NestedContextProviderBeginWorkError::TooManyOuterChildren {
            outer_provider,
            outer_child,
            inner_provider,
            sibling,
        });
    }

    let inner_child =
        inner_node
            .child()
            .ok_or(NestedContextProviderBeginWorkError::MissingChild {
                provider: inner_provider,
            })?;
    let inner_child_node = arena.get(inner_child)?;
    if let Some(sibling) = inner_child_node.sibling() {
        return Err(NestedContextProviderBeginWorkError::MultipleChildren {
            provider: inner_provider,
            first_child: inner_child,
            sibling,
        });
    }
    let inner_child_tag = inner_child_node.tag();
    if inner_child_tag != FiberTag::FunctionComponent {
        return Err(
            NestedContextProviderBeginWorkError::UnsupportedInnerChildTag {
                inner_provider,
                child: inner_child,
                tag: inner_child_tag,
            },
        );
    }

    Ok(NestedContextProviderOuterInnerConsumerHandoffShape {
        inner_provider,
        outer_child,
        inner_child,
    })
}

fn validate_sibling_context_provider_two_consumer_handoff_shape(
    arena: &FiberArena,
    first_provider: FiberId,
) -> Result<SiblingContextProviderTwoConsumerHandoffShape, SiblingContextProviderBeginWorkError> {
    let first_node = arena.get(first_provider)?;
    let first_tag = first_node.tag();
    if first_tag != FiberTag::ContextProvider {
        return Err(SiblingContextProviderBeginWorkError::UnexpectedFiberTag {
            fiber: first_provider,
            tag: first_tag,
        });
    }

    let second_provider = first_node
        .sibling()
        .ok_or(SiblingContextProviderBeginWorkError::MissingSecondProvider { first_provider })?;
    let second_node = arena.get(second_provider)?;
    let second_tag = second_node.tag();
    if second_tag != FiberTag::ContextProvider {
        return Err(
            SiblingContextProviderBeginWorkError::UnsupportedSecondProviderTag {
                first_provider,
                second_provider,
                tag: second_tag,
            },
        );
    }
    if let Some(sibling) = second_node.sibling() {
        return Err(SiblingContextProviderBeginWorkError::TooManyProviders {
            first_provider,
            second_provider,
            sibling,
        });
    }

    let first_child =
        first_node
            .child()
            .ok_or(SiblingContextProviderBeginWorkError::MissingChild {
                provider: first_provider,
            })?;
    let first_child_node = arena.get(first_child)?;
    if let Some(sibling) = first_child_node.sibling() {
        return Err(SiblingContextProviderBeginWorkError::MultipleChildren {
            provider: first_provider,
            first_child,
            sibling,
        });
    }
    let first_child_tag = first_child_node.tag();
    if first_child_tag != FiberTag::FunctionComponent {
        return Err(SiblingContextProviderBeginWorkError::UnsupportedChildTag {
            provider: first_provider,
            child: first_child,
            tag: first_child_tag,
        });
    }

    let second_child =
        second_node
            .child()
            .ok_or(SiblingContextProviderBeginWorkError::MissingChild {
                provider: second_provider,
            })?;
    let second_child_node = arena.get(second_child)?;
    if let Some(sibling) = second_child_node.sibling() {
        return Err(SiblingContextProviderBeginWorkError::MultipleChildren {
            provider: second_provider,
            first_child: second_child,
            sibling,
        });
    }
    let second_child_tag = second_child_node.tag();
    if second_child_tag != FiberTag::FunctionComponent {
        return Err(SiblingContextProviderBeginWorkError::UnsupportedChildTag {
            provider: second_provider,
            child: second_child,
            tag: second_child_tag,
        });
    }

    Ok(SiblingContextProviderTwoConsumerHandoffShape {
        second_provider,
        first_child,
        second_child,
    })
}

pub(crate) fn begin_work_reconcile_function_component_single_child(
    arena: &mut FiberArena,
    request: BeginWorkRequest,
    invoker: &mut impl FunctionComponentInvoker,
    resolver: &impl FunctionComponentSingleChildOutputResolver,
) -> Result<FunctionComponentSingleChildBeginWorkRecord, BeginWorkError> {
    let begin_work = begin_work(arena, request, invoker)?.function_component();
    let single_child =
        reconcile_function_component_single_child_output(arena, begin_work.render(), resolver)?;

    Ok(FunctionComponentSingleChildBeginWorkRecord {
        begin_work,
        single_child,
    })
}

#[cfg(test)]
mod tests;
