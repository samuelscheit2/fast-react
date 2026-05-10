//! Internal fail-closed markers for React fiber tags whose real begin/complete
//! semantics are not implemented by this reconciler scaffold yet.
#![cfg_attr(
    not(test),
    allow(
        dead_code,
        reason = "reserved fail-closed markers until generic reconciler work loops dispatch on fiber tags"
    )
)]

use fast_react_core::FiberTag;

use crate::{ReconcilerError, ReconcilerResult};

pub(crate) const SUSPENSE_UNSUPPORTED_FEATURE: &str = "Reconciler.fiber.Suspense";
pub(crate) const OFFSCREEN_UNSUPPORTED_FEATURE: &str = "Reconciler.fiber.Offscreen";
pub(crate) const ACTIVITY_UNSUPPORTED_FEATURE: &str = "Reconciler.fiber.Activity";
pub(crate) const VIEW_TRANSITION_UNSUPPORTED_FEATURE: &str = "Reconciler.fiber.ViewTransition";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct UnsupportedReconcilerFiberFeature {
    tag: FiberTag,
    feature: &'static str,
}

impl UnsupportedReconcilerFiberFeature {
    const SUSPENSE: Self = Self {
        tag: FiberTag::Suspense,
        feature: SUSPENSE_UNSUPPORTED_FEATURE,
    };
    const OFFSCREEN: Self = Self {
        tag: FiberTag::Offscreen,
        feature: OFFSCREEN_UNSUPPORTED_FEATURE,
    };
    const ACTIVITY: Self = Self {
        tag: FiberTag::Activity,
        feature: ACTIVITY_UNSUPPORTED_FEATURE,
    };
    const VIEW_TRANSITION: Self = Self {
        tag: FiberTag::ViewTransition,
        feature: VIEW_TRANSITION_UNSUPPORTED_FEATURE,
    };

    #[must_use]
    pub(crate) const fn tag(self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub(crate) const fn feature(self) -> &'static str {
        self.feature
    }
}

#[must_use]
pub(crate) const fn unsupported_reconciler_feature_for_fiber_tag(
    tag: FiberTag,
) -> Option<UnsupportedReconcilerFiberFeature> {
    match tag {
        FiberTag::Suspense => Some(UnsupportedReconcilerFiberFeature::SUSPENSE),
        FiberTag::Offscreen => Some(UnsupportedReconcilerFiberFeature::OFFSCREEN),
        FiberTag::Activity => Some(UnsupportedReconcilerFiberFeature::ACTIVITY),
        FiberTag::ViewTransition => Some(UnsupportedReconcilerFiberFeature::VIEW_TRANSITION),
        _ => None,
    }
}

pub(crate) fn require_supported_reconciler_fiber_tag(tag: FiberTag) -> ReconcilerResult<()> {
    match unsupported_reconciler_feature_for_fiber_tag(tag) {
        Some(feature) => Err(ReconcilerError::unimplemented(feature.feature())),
        None => Ok(()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unsupported_feature_tags_have_explicit_fail_closed_markers() {
        let cases = [
            (
                FiberTag::Suspense,
                SUSPENSE_UNSUPPORTED_FEATURE,
                FiberTag::Suspense.react_tag(),
            ),
            (
                FiberTag::Offscreen,
                OFFSCREEN_UNSUPPORTED_FEATURE,
                FiberTag::Offscreen.react_tag(),
            ),
            (
                FiberTag::Activity,
                ACTIVITY_UNSUPPORTED_FEATURE,
                FiberTag::Activity.react_tag(),
            ),
            (
                FiberTag::ViewTransition,
                VIEW_TRANSITION_UNSUPPORTED_FEATURE,
                FiberTag::ViewTransition.react_tag(),
            ),
        ];

        for (tag, feature_name, raw_tag) in cases {
            let marker = unsupported_reconciler_feature_for_fiber_tag(tag).unwrap();
            assert_eq!(marker.tag(), tag);
            assert_eq!(marker.feature(), feature_name);
            assert_eq!(FiberTag::from_react_tag(raw_tag), tag);

            let error = require_supported_reconciler_fiber_tag(tag).unwrap_err();
            assert_eq!(error, ReconcilerError::unimplemented(feature_name));
        }
    }

    #[test]
    fn generic_supported_tags_are_not_marked_unsupported() {
        for tag in [
            FiberTag::HostRoot,
            FiberTag::HostComponent,
            FiberTag::HostText,
            FiberTag::FunctionComponent,
            FiberTag::Fragment,
        ] {
            assert_eq!(unsupported_reconciler_feature_for_fiber_tag(tag), None);
            require_supported_reconciler_fiber_tag(tag).unwrap();
        }
    }
}
