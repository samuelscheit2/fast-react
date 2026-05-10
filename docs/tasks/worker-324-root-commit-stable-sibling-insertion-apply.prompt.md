# Worker 324: Root Commit Stable Sibling Insertion Apply

Objective: advance the accepted stable-sibling insertion canary into a private
test-renderer commit path that can insert a placed host child before a stable
committed sibling while preserving fail-closed diagnostics for ambiguous
siblings.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 294, 233, 238, 263, 272, 292, and
323 if present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_work.rs`,
`crates/fast-react-test-renderer/src/lib.rs`, focused Rust tests, and
`worker-progress/worker-324-root-commit-stable-sibling-insertion-apply.md`.

Do not change DOM JS mutation helpers or public renderer package surfaces.

Verification: run `cargo fmt --all --check`, focused stable-sibling insertion
tests, `cargo test -p fast-react-reconciler --all-features`, `cargo test -p
fast-react-test-renderer --all-features`, and `git diff --check`.
