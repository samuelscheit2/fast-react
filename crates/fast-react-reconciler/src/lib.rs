//! Reconciler placeholders for fibers, lanes, hooks, context, and scheduling.
//!
//! Real reconciliation is intentionally absent from the scaffold. The module
//! layout reserves the boundary where lane/update/hook semantics will be built.

use fast_react_core::{UnimplementedReactBehavior, unimplemented_behavior};
use fast_react_host_config::HostConfig;

pub mod scheduler {
    use fast_react_core::{UnimplementedReactBehavior, unimplemented_behavior};

    pub const STATUS: &str = "scheduler placeholder; no React scheduling semantics yet";

    pub fn schedule_update_placeholder() -> Result<(), UnimplementedReactBehavior> {
        Err(unimplemented_behavior(
            "Reconciler.scheduler.scheduleUpdate",
        ))
    }
}

pub fn render_placeholder<H: HostConfig>(host: &H) -> Result<(), UnimplementedReactBehavior> {
    let _renderer_name = host.renderer_name();
    Err(unimplemented_behavior("Reconciler.render"))
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
    fn render_is_explicitly_unimplemented() {
        let host = PlaceholderHost;
        let error = render_placeholder(&host).unwrap_err();
        assert_eq!(error.feature(), "Reconciler.render");
    }

    #[test]
    fn scheduler_stays_internal_placeholder() {
        assert!(scheduler::STATUS.contains("placeholder"));
        let error = scheduler::schedule_update_placeholder().unwrap_err();
        assert_eq!(error.feature(), "Reconciler.scheduler.scheduleUpdate");
    }
}
