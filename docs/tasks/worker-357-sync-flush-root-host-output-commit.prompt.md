# Worker 357: Sync Flush Root Host Output Commit

Objective: extend the private sync-flush path so an already-renderable
HostRoot host-output canary commits through the accepted commit handoff, with
diagnostics proving lanes/callback state are consumed safely.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 150, 179, 252, 285, 331, 350, and 356
if present.

Write scope: `crates/fast-react-reconciler/src/sync_flush.rs`,
`crates/fast-react-reconciler/src/root_scheduler.rs`,
`crates/fast-react-reconciler/src/root_commit.rs`, focused Rust tests, and
`worker-progress/worker-357-sync-flush-root-host-output-commit.md`.

Do not make public `flushSync` or act compatibility claims.

Verification: run `cargo fmt --all --check`, focused sync-flush/root-scheduler
tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
