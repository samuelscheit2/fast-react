# Worker 566: Root Scheduler Transition Lane Routing

## Objective

Add private root-scheduler diagnostics for transition-lane scheduling after the
accepted lane-priority and context-provider lane canaries, without executing
public updates.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 535 and 538 accepted lane-priority and context-provider update-lane
metadata. This task should connect those records to root scheduler routing.

## Write Scope

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- Focused Rust tests in those modules
- `worker-progress/worker-566-root-scheduler-transition-lane-routing.md`

Avoid React DOM, test-renderer, native, benchmark, and package-surface edits.

## Requirements

- Record transition-lane routing from accepted update lane diagnostics into a
  private root scheduler request.
- Preserve discrete/default/offscreen lane behavior already covered by existing
  canaries.
- Keep callback execution, public update scheduling, and compatibility claims
  blocked.
- Reject unsupported lane sets, stale roots, and incompatible diagnostic inputs
  fail-closed.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-reconciler --all-features root_scheduler -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_updates -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`
