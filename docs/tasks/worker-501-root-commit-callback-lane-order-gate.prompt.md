# Worker 501: Root Commit Callback Lane Order Gate

Objective: add private diagnostics proving visible and hidden root callbacks are
drained in deterministic lane/commit order across multiple scheduled roots.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 445, 450, 451, 476, and 499 if
present.

Write scope: `crates/fast-react-reconciler/src/sync_flush.rs`,
`crates/fast-react-reconciler/src/root_commit.rs`, focused sync-flush/root
commit tests, and
`worker-progress/worker-501-root-commit-callback-lane-order-gate.md`.

Do not invoke public callbacks or claim public root scheduling compatibility.

Verification: run focused sync-flush/root-commit tests,
`cargo test -p fast-react-reconciler --all-features`, `cargo fmt --all --check`,
and `git diff --check`.
