# Worker 655: Root Commit Text Replacement Execution

Objective: implement a private reconciler execution path that commits a single HostText replacement/update through the root commit pipeline, proving the current/final tree and host text record update while keeping public rendering compatibility blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`, `crates/fast-react-reconciler/src/host_work.rs`, `crates/fast-react-reconciler/src/host_nodes.rs`, focused Rust tests, and `worker-progress/worker-655-root-commit-text-replacement-execution.md`.

Coordinate with adjacent workers by keeping this limited to HostText replacement/update, not HostComponent prop/style updates, deletion, passive effects, or JS package facades.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler text root_commit host_work -- --nocapture`, and `git diff --check`.
