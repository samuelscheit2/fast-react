# Worker 355: Root Commit Deletion Subtree Cleanup Apply

Objective: harden private deletion cleanup so nested HostComponent/HostText
subtrees are cleaned in deterministic child-before-parent order with stale host
node metadata invalidated.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 234, 263, 293, 325, 338, and 352 if
present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_nodes.rs`,
`crates/fast-react-test-renderer/src/lib.rs`, focused Rust tests, and
`worker-progress/worker-355-root-commit-deletion-subtree-cleanup-apply.md`.

Do not reclaim arbitrary fibers, detach refs, or claim public unmount behavior.

Verification: run `cargo fmt --all --check`, focused deletion-cleanup tests,
`cargo test -p fast-react-reconciler --all-features`,
`cargo test -p fast-react-test-renderer --all-features`, and `git diff --check`.
