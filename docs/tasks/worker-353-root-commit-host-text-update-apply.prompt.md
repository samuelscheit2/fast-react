# Worker 353: Root Commit Host Text Update Apply

Objective: add a private Rust canary for applying committed HostText updates
through the root commit path, preserving the existing placement/deletion
boundaries and avoiding public renderer claims.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 234, 263, 293, 323, 324, 325, and 352
if present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_work.rs`,
`crates/fast-react-test-renderer/src/lib.rs`, focused Rust tests, and
`worker-progress/worker-353-root-commit-host-text-update-apply.md`.

Do not add public React DOM or react-test-renderer compatibility claims.

Verification: run `cargo fmt --all --check`, focused root-commit/host-work/test
renderer host-output tests, `cargo test -p fast-react-reconciler --all-features`,
`cargo test -p fast-react-test-renderer --all-features`, and `git diff --check`.
