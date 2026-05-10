# Worker 571: Suspense Retry Root Scheduler Link

## Objective

Link accepted Suspense thenable ping blocker metadata to a private root
scheduler retry request without executing Suspense compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 558 refreshed Suspense thenable ping blockers. This task should create a
root-scheduler-facing retry diagnostic from those records.

## Write Scope

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- Focused Rust tests in those modules
- `worker-progress/worker-571-suspense-retry-root-scheduler-link.md`

Avoid React DOM, test-renderer JS, native, package-surface, and broad
conformance edits.

## Requirements

- Consume only accepted Suspense thenable ping blocker records.
- Record retry lane, pinged lane set, boundary identity, and scheduler callback
  blockers.
- Keep Suspense rendering, fallback traversal, wakeable subscription, and public
  compatibility blocked.
- Reject offscreen-only records, stale boundaries, and incompatible lane sets.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-reconciler --all-features begin_work -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_scheduler -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`
