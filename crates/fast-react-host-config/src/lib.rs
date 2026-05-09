//! Renderer host-config boundary placeholders.
//!
//! The host-config crate owns renderer-facing traits only. Concrete DOM,
//! native, Node, and test renderer behavior must live outside this crate.

use fast_react_core::{UnimplementedReactBehavior, unimplemented_behavior};

pub trait HostConfig {
    type Instance;
    type TextInstance;

    fn renderer_name(&self) -> &'static str;

    fn supports_mutation(&self) -> bool {
        false
    }
}

pub fn create_instance_placeholder<H: HostConfig>(
    host: &H,
) -> Result<(), UnimplementedReactBehavior> {
    let _renderer_name = host.renderer_name();
    Err(unimplemented_behavior("HostConfig.createInstance"))
}

#[cfg(test)]
mod tests {
    use super::*;

    struct PlaceholderHost;

    impl HostConfig for PlaceholderHost {
        type Instance = ();
        type TextInstance = ();

        fn renderer_name(&self) -> &'static str {
            "placeholder"
        }
    }

    #[test]
    fn host_boundary_has_no_default_mutation_support() {
        let host = PlaceholderHost;
        assert!(!host.supports_mutation());
    }

    #[test]
    fn instance_creation_is_explicitly_unimplemented() {
        let host = PlaceholderHost;
        let error = create_instance_placeholder(&host).unwrap_err();
        assert_eq!(error.feature(), "HostConfig.createInstance");
    }
}
