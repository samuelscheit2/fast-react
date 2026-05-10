# Worker 323: Root Commit Host Parent Placement Apply

Objective: turn the accepted host-parent placement metadata canary into a
private, test-only commit application path for host children under an existing
host parent, without opening public DOM or test-renderer compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 293, 233, 238, 263, 271, 272, and
292.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_work.rs`,
`crates/fast-react-test-renderer/src/lib.rs`, focused Rust tests, and
`worker-progress/worker-323-root-commit-host-parent-placement-apply.md`.

Do not modify public JS package facades, benchmark manifests, or master docs.

Verification: run `cargo fmt --all --check`, focused reconciler/test-renderer
tests for the new placement path, `cargo test -p fast-react-reconciler
--all-features`, `cargo test -p fast-react-test-renderer --all-features`, and
`git diff --check`.
