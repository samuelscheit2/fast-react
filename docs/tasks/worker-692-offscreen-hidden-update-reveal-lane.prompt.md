# Worker 692: Offscreen Hidden Update Reveal Lane

Objective: add private Rust evidence that updates queued while an Offscreen subtree is hidden are deferred and then revealed through the expected lane/commit metadata without opening public Offscreen compatibility.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `crates/fast-react-reconciler/src/begin_work.rs`, `crates/fast-react-reconciler/src/complete_work.rs`, `crates/fast-react-reconciler/src/root_commit.rs` only if reveal commit metadata needs it, focused Rust tests, and `worker-progress/worker-692-offscreen-hidden-update-reveal-lane.md`.

Constraints: do not edit Suspense ping code, passive-effect reveal queues, or JS packages unless a compile-only helper adjustment is unavoidable.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler --all-features offscreen complete_work root_commit -- --nocapture` split into valid Cargo filters if needed, conflict-marker scan, and `git diff --check`.
