# Worker 535: Lane Priority Root Scheduling Canary

## Objective

Add private lane/root scheduling diagnostics that prove a sync update and a
default-priority update are recorded with distinct lane metadata before any
public scheduling compatibility is claimed.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Use
accepted lane and root queue structures rather than adding a new scheduler
model.

## Write Scope

- `crates/fast-react-core/src/lanes.rs`
- `crates/fast-react-reconciler/src/root_update_queue.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- Focused Rust tests in those modules
- `worker-progress/worker-535-lane-priority-root-scheduling-canary.md`

## Requirements

- Record lane choice, event priority/source priority, pending lanes before and
  after enqueue, and selected next lanes.
- Keep callback scheduling/execution and public batching compatibility blocked.
- Fail closed for unknown priority, empty root, and stale queue evidence.

## Verification

- `cargo test -p fast-react-core --all-features lane -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features lane -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`

