//! Node-API boundary placeholder.
//!
//! This crate is the reserved native binding boundary. The initial scaffold
//! avoids pulling N-API dependencies until the binding strategy is implemented,
//! but no other Rust crate should grow Node-specific dependencies.

use fast_react_core::{UnimplementedReactBehavior, unimplemented_behavior};

pub const NAPI_BOUNDARY_STATUS: &str = "fast-react-napi placeholder; native exports not built yet";

#[must_use]
pub fn binding_status() -> &'static str {
    NAPI_BOUNDARY_STATUS
}

pub fn native_export_placeholder(
    export_name: &'static str,
) -> Result<(), UnimplementedReactBehavior> {
    Err(unimplemented_behavior(export_name))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn native_boundary_is_a_placeholder() {
        assert!(binding_status().contains("placeholder"));
    }

    #[test]
    fn native_exports_fail_loudly() {
        let error = native_export_placeholder("native.createElement").unwrap_err();
        assert_eq!(error.feature(), "native.createElement");
    }
}
