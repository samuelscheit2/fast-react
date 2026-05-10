# Worker 689: Layout Effect Error Cleanup Order

Objective: add private Rust commit evidence for layout-effect destroy/create ordering when a layout callback throws, including fail-closed error metadata and no public effect compatibility claim.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`, `crates/fast-react-reconciler/src/function_component.rs` only for test fixtures, focused Rust tests, and `worker-progress/worker-689-layout-effect-error-cleanup-order.md`.

Constraints: avoid passive-effect queue changes and JS package changes. Keep any error surface private and diagnostic-only.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler --all-features layout root_commit -- --nocapture` split into valid Cargo filters if needed, conflict-marker scan, and `git diff --check`.
