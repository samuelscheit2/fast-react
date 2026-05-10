# Worker 661: Context Provider Update Commit Propagation

Objective: advance context-provider changed-value propagation into a private render/commit handoff that proves marked consumer lanes survive to commit for one nested provider/consumer shape.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-reconciler/src/context.rs`, `crates/fast-react-reconciler/src/root_work_loop.rs`, `crates/fast-react-reconciler/src/root_commit.rs`, focused Rust tests, and `worker-progress/worker-661-context-provider-update-commit-propagation.md`.

Stay limited to context propagation and commit metadata. Do not broaden Suspense, Offscreen, hooks unrelated to context, or JS facades.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler context root_work_loop root_commit -- --nocapture`, and `git diff --check`.
