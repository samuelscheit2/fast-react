# Worker 663: Offscreen Passive Defer Reveal Execution

Objective: connect private Offscreen hidden-lane reveal metadata to passive-effect deferral/reveal evidence for one hidden subtree, while keeping public Offscreen and passive compatibility blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-reconciler/src/root_work_loop.rs`, `crates/fast-react-reconciler/src/passive_effects.rs`, `crates/fast-react-reconciler/src/root_commit.rs`, focused Rust tests, and `worker-progress/worker-663-offscreen-passive-defer-reveal-execution.md`.

Avoid Suspense retry, React DOM visibility styling, and public act flushing.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler offscreen passive reveal root_work_loop -- --nocapture`, and `git diff --check`.
