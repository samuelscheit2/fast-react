# Worker 597: Sync Flush Root Commit Continuation

## Objective

Extend private sync-flush diagnostics so a flushed root can consume accepted
finished-work metadata and produce one inert commit record.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Use accepted root scheduler and finished-work handoff diagnostics from queues
534-594 as prerequisites.

## Write Scope

- `crates/fast-react-reconciler/src/sync_flush.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs` only if a narrow helper
  is required
- Existing focused Rust tests in those files
- `worker-progress/worker-597-sync-flush-root-commit-continuation.md`

Do not edit JS package surfaces.

## Requirements

- Add a deterministic private sync-flush continuation that records root order,
  selected lanes, finished-work handoff identity, and commit result identity.
- Fail closed for render/commit reentry, stale handoff, and non-sync lanes.
- Keep passive effect execution and public `flushSync` compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features sync_flush -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_sync -- --nocapture`
- `git diff --check`
