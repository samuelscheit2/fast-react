# Worker 605: Suspense Retry Render Handoff Execution

## Objective

Extend private Suspense retry diagnostics so a pinged retry lane can reach an
accepted render handoff without committing unsupported Suspense behavior.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 571 and 558 added retry and thenable blocker evidence; consume those
records in one scheduler-to-render path.

## Write Scope

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-605-suspense-retry-render-handoff-execution.md`

Do not edit React DOM/test-renderer JS.

## Requirements

- Add a private canary where a pinged retry lane reselects work and reaches a
  HostRoot render handoff record.
- Reject non-retry selections, stale thenable blockers, and unsupported
  Suspense child shapes before commit.
- Keep public Suspense compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features suspense -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features pinged_retry -- --nocapture`
- `git diff --check`
