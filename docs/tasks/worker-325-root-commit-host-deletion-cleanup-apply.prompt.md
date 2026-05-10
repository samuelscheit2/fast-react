# Worker 325: Root Commit Host Deletion Cleanup Apply

Objective: convert accepted host deletion metadata into a private host-node
cleanup path for test-renderer roots, including parent-owned deletion order and
host-node store invalidation, without public unmount compatibility claims.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 206, 233, 263, 264, 292, 293, and
294.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_nodes.rs`,
`crates/fast-react-test-renderer/src/lib.rs`, focused Rust tests, and
`worker-progress/worker-325-root-commit-host-deletion-cleanup-apply.md`.

Keep DOM, React DOM public roots, and package-surface files out of scope.

Verification: run `cargo fmt --all --check`, focused deletion cleanup tests,
`cargo test -p fast-react-reconciler --all-features`, `cargo test -p
fast-react-test-renderer --all-features`, and `git diff --check`.
