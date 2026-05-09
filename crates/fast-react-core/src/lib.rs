//! Renderer-agnostic Fast React core placeholders.
//!
//! This crate is intentionally small in the initial scaffold. It may define
//! shared compatibility targets and explicit "not implemented" errors, but it
//! must not grow renderer, Node, DOM, timer, or native binding dependencies.

use std::error::Error;
use std::fmt::{self, Display, Formatter};

pub const REACT_COMPATIBILITY_TARGET: &str = "react@19.2.6";
pub const REACT_DOM_COMPATIBILITY_TARGET: &str = "react-dom@19.2.6";
pub const TYPES_REACT_COMPATIBILITY_TARGET: &str = "@types/react@19.2.14";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnimplementedReactBehavior {
    feature: &'static str,
    reason: &'static str,
}

impl UnimplementedReactBehavior {
    #[must_use]
    pub const fn new(feature: &'static str) -> Self {
        Self {
            feature,
            reason: "Fast React scaffold only: React behavior is not implemented yet",
        }
    }

    #[must_use]
    pub const fn feature(&self) -> &'static str {
        self.feature
    }

    #[must_use]
    pub const fn reason(&self) -> &'static str {
        self.reason
    }
}

impl Display for UnimplementedReactBehavior {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}: {}", self.feature, self.reason)
    }
}

impl Error for UnimplementedReactBehavior {}

#[must_use]
pub const fn unimplemented_behavior(feature: &'static str) -> UnimplementedReactBehavior {
    UnimplementedReactBehavior::new(feature)
}

pub fn create_element_placeholder() -> Result<(), UnimplementedReactBehavior> {
    Err(unimplemented_behavior("React.createElement"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn records_current_compatibility_targets() {
        assert_eq!(REACT_COMPATIBILITY_TARGET, "react@19.2.6");
        assert_eq!(REACT_DOM_COMPATIBILITY_TARGET, "react-dom@19.2.6");
        assert_eq!(TYPES_REACT_COMPATIBILITY_TARGET, "@types/react@19.2.14");
    }

    #[test]
    fn placeholder_errors_fail_loudly() {
        let error = create_element_placeholder().unwrap_err();
        assert_eq!(error.feature(), "React.createElement");
        assert!(error.to_string().contains("not implemented yet"));
    }
}
