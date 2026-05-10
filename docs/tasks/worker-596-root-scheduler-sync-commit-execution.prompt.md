# Worker 596: Root Scheduler Sync Commit Execution

## Objective

Teach one private sync scheduler continuation to execute an already accepted
render/commit handoff and record the committed result, while keeping broad
public scheduling blocked.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 566, 571, and 593 added scheduler and root handoff evidence; build on
that exact metadata.

## Write Scope

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-596-root-scheduler-sync-commit-execution.md`

Do not edit React DOM or test-renderer files.

## Requirements

- Add a private sync-lane execution gate that reselects lanes, consumes an
  accepted render handoff, and records commit execution evidence.
- Reject stale callback nodes, pending passive blockers, and mismatched lanes.
- Keep async callback execution and public root compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_scheduler -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_work_loop -- --nocapture`
- `git diff --check`
