//! Renderer-agnostic Fast React core data model primitives.
//!
//! This crate intentionally stops at normalized Rust records. JavaScript object
//! identity, property descriptors, string coercion, owner-stack capture, and
//! development freezing are binding/conformance concerns and fail loudly here.

mod compatibility;
mod element;
mod event_priority;
mod fiber;
mod fiber_alternate;
mod fiber_arena;
mod fiber_bubbling;
mod fiber_deletions;
mod fiber_flags;
mod fiber_handles;
mod fiber_id;
mod hook_effect_flags;
mod hook_effect_ring;
mod lane;
mod root_lanes;
mod symbols;

use std::error::Error;
use std::fmt::{self, Display, Formatter};

pub use compatibility::{
    COMPATIBILITY_TARGETS, PackageCompatibilityTarget, REACT_COMPATIBILITY_TARGET,
    REACT_DOM_COMPATIBILITY_TARGET, REACT_DOM_PACKAGE_TARGET, REACT_PACKAGE_TARGET,
    TYPES_REACT_COMPATIBILITY_TARGET, TYPES_REACT_PACKAGE_TARGET,
};
pub use element::{ReactElementRecord, ReactKey, ReactOwner, ReactOwnerSlot, ReactRefSlot};
pub use event_priority::{
    EventPriority, event_priority_to_lane, higher_event_priority, is_higher_event_priority,
    lanes_to_event_priority, lower_event_priority,
};
pub use fiber::{FiberMode, FiberNode, FiberTag, VALID_FIBER_MODE_BITS};
pub use fiber_arena::{FiberArena, FiberArenaValidation, FiberTopologyError};
pub use fiber_bubbling::{
    FiberBubbledProperties, bubble_child_lanes, bubble_properties, bubble_subtree_flags,
    preserve_static_subtree_flags,
};
pub use fiber_deletions::{DeletionList, DeletionListId};
pub use fiber_flags::{
    FiberFlags, REACT_19_2_6_ENABLE_CREATE_EVENT_HANDLE_API,
    REACT_19_2_6_ENABLE_USE_EFFECT_EVENT_HOOK, VALID_FIBER_FLAG_BITS,
};
pub use fiber_handles::{
    DependenciesHandle, ElementTypeHandle, FiberTypeHandle, PropsHandle, RefHandle, StateHandle,
    StateNodeHandle, UpdateQueueHandle,
};
pub use fiber_id::{FiberArenaId, FiberGeneration, FiberId, FiberIdError, FiberSlot};
pub use hook_effect_flags::{HookEffectFlags, VALID_HOOK_EFFECT_FLAG_BITS};
pub use hook_effect_ring::{
    HookEffectArena, HookEffectArenaError, HookEffectArenaId, HookEffectCallbackHandle,
    HookEffectDependencies, HookEffectFilteredIter, HookEffectGeneration, HookEffectId,
    HookEffectInstance, HookEffectInstanceGeneration, HookEffectInstanceId, HookEffectInstanceSlot,
    HookEffectIter, HookEffectNode, HookEffectRing, HookEffectSlot,
};
pub use lane::{Lane, LaneIndex, LaneMap, Lanes, TOTAL_LANES, VALID_LANE_BITS};
pub use root_lanes::{
    LaneClaimers, LaneTimestamp, NO_TIMESTAMP, RETRY_LANE_EXPIRATION_MS, RootFinishedLanes,
    RootLaneFeatureFlags, RootLaneState, SYNC_LANE_EXPIRATION_MS, TRANSITION_LANE_EXPIRATION_MS,
    check_if_root_is_prerendering, get_next_lanes, get_next_lanes_to_flush_sync,
    highest_priority_lanes,
};
pub use symbols::ReactSymbolTag;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum UnimplementedReactBehaviorKind {
    Placeholder,
    JsRuntimeConformance,
    PropertyDescriptors,
    DevelopmentObjectFreezing,
    OwnerStack,
    ChildrenTraversal,
}

impl UnimplementedReactBehaviorKind {
    #[must_use]
    pub const fn reason(self) -> &'static str {
        match self {
            Self::Placeholder => "Fast React scaffold only: React behavior is not implemented yet",
            Self::JsRuntimeConformance => {
                "requires JavaScript value, descriptor, owner, or runtime conformance"
            }
            Self::PropertyDescriptors => "requires JavaScript property descriptor conformance",
            Self::DevelopmentObjectFreezing => {
                "requires JavaScript development object freezing conformance"
            }
            Self::OwnerStack => "requires React owner stack and dispatcher conformance",
            Self::ChildrenTraversal => "requires React Children traversal conformance",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnimplementedReactBehavior {
    feature: &'static str,
    kind: UnimplementedReactBehaviorKind,
}

impl UnimplementedReactBehavior {
    pub const DEFAULT_REASON: &'static str = UnimplementedReactBehaviorKind::Placeholder.reason();

    pub const JS_CONFORMANCE_REASON: &'static str =
        UnimplementedReactBehaviorKind::JsRuntimeConformance.reason();

    #[must_use]
    pub const fn new(feature: &'static str) -> Self {
        Self::with_kind(feature, UnimplementedReactBehaviorKind::Placeholder)
    }

    #[must_use]
    pub const fn with_kind(feature: &'static str, kind: UnimplementedReactBehaviorKind) -> Self {
        Self { feature, kind }
    }

    #[must_use]
    pub const fn feature(&self) -> &'static str {
        self.feature
    }

    #[must_use]
    pub const fn kind(&self) -> UnimplementedReactBehaviorKind {
        self.kind
    }

    #[must_use]
    pub const fn reason(&self) -> &'static str {
        self.kind.reason()
    }
}

impl Display for UnimplementedReactBehavior {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}: {}", self.feature, self.reason())
    }
}

impl Error for UnimplementedReactBehavior {}

#[must_use]
pub const fn unimplemented_behavior(feature: &'static str) -> UnimplementedReactBehavior {
    UnimplementedReactBehavior::new(feature)
}

#[must_use]
pub const fn unimplemented_js_conformance(feature: &'static str) -> UnimplementedReactBehavior {
    UnimplementedReactBehavior::with_kind(
        feature,
        UnimplementedReactBehaviorKind::JsRuntimeConformance,
    )
}

#[must_use]
pub const fn unimplemented_property_descriptors(
    feature: &'static str,
) -> UnimplementedReactBehavior {
    UnimplementedReactBehavior::with_kind(
        feature,
        UnimplementedReactBehaviorKind::PropertyDescriptors,
    )
}

#[must_use]
pub const fn unimplemented_development_object_freezing(
    feature: &'static str,
) -> UnimplementedReactBehavior {
    UnimplementedReactBehavior::with_kind(
        feature,
        UnimplementedReactBehaviorKind::DevelopmentObjectFreezing,
    )
}

#[must_use]
pub const fn unimplemented_owner_stack(feature: &'static str) -> UnimplementedReactBehavior {
    UnimplementedReactBehavior::with_kind(feature, UnimplementedReactBehaviorKind::OwnerStack)
}

#[must_use]
pub const fn unimplemented_children_traversal(feature: &'static str) -> UnimplementedReactBehavior {
    UnimplementedReactBehavior::with_kind(
        feature,
        UnimplementedReactBehaviorKind::ChildrenTraversal,
    )
}

pub fn create_element_placeholder() -> Result<(), UnimplementedReactBehavior> {
    Err(unimplemented_js_conformance("React.createElement"))
}

pub fn clone_element_placeholder() -> Result<(), UnimplementedReactBehavior> {
    Err(unimplemented_js_conformance("React.cloneElement"))
}

pub fn jsx_runtime_placeholder() -> Result<(), UnimplementedReactBehavior> {
    Err(unimplemented_js_conformance("React.jsx-runtime"))
}

pub fn children_traversal_placeholder() -> Result<(), UnimplementedReactBehavior> {
    Err(unimplemented_children_traversal("React.Children traversal"))
}

pub fn dev_element_object_placeholder() -> Result<(), UnimplementedReactBehavior> {
    Err(unimplemented_development_object_freezing(
        "React development element object shape",
    ))
}

pub fn property_descriptor_placeholder() -> Result<(), UnimplementedReactBehavior> {
    Err(unimplemented_property_descriptors(
        "React element property descriptors",
    ))
}

pub fn owner_stack_placeholder() -> Result<(), UnimplementedReactBehavior> {
    Err(unimplemented_owner_stack("React owner stack capture"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn records_current_compatibility_targets() {
        assert_eq!(REACT_COMPATIBILITY_TARGET, "react@19.2.6");
        assert_eq!(REACT_DOM_COMPATIBILITY_TARGET, "react-dom@19.2.6");
        assert_eq!(TYPES_REACT_COMPATIBILITY_TARGET, "@types/react@19.2.14");
        assert_eq!(REACT_PACKAGE_TARGET.package(), "react");
        assert_eq!(REACT_PACKAGE_TARGET.version(), "19.2.6");
        assert_eq!(COMPATIBILITY_TARGETS.len(), 3);
    }

    #[test]
    fn placeholder_errors_fail_loudly() {
        let error = create_element_placeholder().unwrap_err();
        assert_eq!(error.feature(), "React.createElement");
        assert_eq!(
            error.kind(),
            UnimplementedReactBehaviorKind::JsRuntimeConformance
        );
        assert_eq!(
            error.reason(),
            UnimplementedReactBehavior::JS_CONFORMANCE_REASON
        );
        assert!(error.to_string().contains("React.createElement"));
    }

    #[test]
    fn existing_unimplemented_helper_keeps_scaffold_contract() {
        let error = unimplemented_behavior("HostConfig.createInstance");
        assert_eq!(error.feature(), "HostConfig.createInstance");
        assert_eq!(error.kind(), UnimplementedReactBehaviorKind::Placeholder);
        assert_eq!(error.reason(), UnimplementedReactBehavior::DEFAULT_REASON);
    }

    #[test]
    fn js_semantic_placeholders_have_machine_checkable_kinds() {
        assert_eq!(
            property_descriptor_placeholder().unwrap_err().kind(),
            UnimplementedReactBehaviorKind::PropertyDescriptors
        );
        assert_eq!(
            dev_element_object_placeholder().unwrap_err().kind(),
            UnimplementedReactBehaviorKind::DevelopmentObjectFreezing
        );
        assert_eq!(
            owner_stack_placeholder().unwrap_err().kind(),
            UnimplementedReactBehaviorKind::OwnerStack
        );
        assert_eq!(
            children_traversal_placeholder().unwrap_err().kind(),
            UnimplementedReactBehaviorKind::ChildrenTraversal
        );
    }
}
