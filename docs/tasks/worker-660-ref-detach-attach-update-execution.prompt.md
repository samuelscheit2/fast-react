# Worker 660: Ref Detach Attach Update Execution

Objective: implement private reconciler evidence for ref detach/attach ordering during a HostComponent update, consuming existing ref metadata and keeping public ref callback compatibility blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`, `crates/fast-react-reconciler/src/host_nodes.rs`, focused Rust tests, and `worker-progress/worker-660-ref-detach-attach-update-execution.md`.

Do not modify React DOM root option callbacks, test-renderer public refs, passive effects, or deletion subtree traversal.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler ref root_commit host_nodes -- --nocapture`, and `git diff --check`.
