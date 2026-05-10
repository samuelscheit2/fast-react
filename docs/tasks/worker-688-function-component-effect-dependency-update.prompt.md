# Worker 688: Function Component Effect Dependency Update

Objective: add private Rust evidence that effect dependency comparison schedules/skips destroy/create work correctly across function-component updates, without enabling public passive or layout effect behavior.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`, `crates/fast-react-reconciler/src/passive_effects.rs`, focused Rust tests in those modules, and `worker-progress/worker-688-function-component-effect-dependency-update.md`.

Constraints: do not change layout-effect ordering, root commit deletion cleanup, or JS package facades unless a compile-only import adjustment is required.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler --all-features function_component passive -- --nocapture` split into valid Cargo filters if needed, conflict-marker scan, and `git diff --check`.
