//! Deterministic test renderer placeholder.
//!
//! This crate reserves the future in-memory renderer used by conformance
//! scenarios. It does not render React trees yet.

use fast_react_core::UnimplementedReactBehavior;
use fast_react_host_config::HostConfig;
use fast_react_reconciler::render_placeholder;

#[derive(Debug, Default, Clone, Copy)]
pub struct TestHostConfig;

impl HostConfig for TestHostConfig {
    type Instance = ();
    type TextInstance = ();

    fn renderer_name(&self) -> &'static str {
        "fast-react-test-renderer"
    }

    fn supports_mutation(&self) -> bool {
        true
    }
}

pub fn render_to_tree_placeholder() -> Result<(), UnimplementedReactBehavior> {
    render_placeholder(&TestHostConfig)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_renderer_has_a_host_identity() {
        let host = TestHostConfig;
        assert_eq!(host.renderer_name(), "fast-react-test-renderer");
        assert!(host.supports_mutation());
    }

    #[test]
    fn rendering_is_explicitly_unimplemented() {
        let error = render_to_tree_placeholder().unwrap_err();
        assert_eq!(error.feature(), "Reconciler.render");
    }
}
