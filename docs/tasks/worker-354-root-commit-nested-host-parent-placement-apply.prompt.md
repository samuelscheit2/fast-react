# Worker 354: Root Commit Nested Host Parent Placement Apply

Objective: extend private root commit placement canaries from direct HostRoot
children to a narrow nested HostComponent parent path, proving parent lookup and
insertion diagnostics without general reconciliation.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 151, 194, 199, 323, 324, 350, and 351
if present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_work.rs`,
`crates/fast-react-test-renderer/src/lib.rs`, focused Rust tests, and
`worker-progress/worker-354-root-commit-nested-host-parent-placement-apply.md`.

Preserve Fragment/Portal/Suspense blockers and keep the path private/test-only.

Verification: run `cargo fmt --all --check`, focused root-commit/host-work/test
renderer host-output tests, `cargo test -p fast-react-reconciler --all-features`,
and `git diff --check`.
