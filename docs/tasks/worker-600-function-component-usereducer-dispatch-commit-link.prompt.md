# Worker 600: Function Component useReducer Dispatch Commit Link

## Objective

Connect private `useReducer` dispatch diagnostics to root scheduling and a
single accepted function-component commit handoff.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 568 added reducer dispatch queue evidence; use that route without
generalizing public hooks.

## Write Scope

- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/concurrent_updates.rs`
- `crates/fast-react-reconciler/src/root_updates.rs` only if a narrow lane
  helper is required
- Existing focused Rust tests in those files
- `worker-progress/worker-600-function-component-usereducer-dispatch-commit-link.md`

Do not edit React package JS entrypoints.

## Requirements

- Add a private canary that dispatches a reducer action, records eager/rebased
  metadata, marks the root, and ties the render result to accepted commit
  handoff metadata.
- Reject stale reducer metadata, basic-state queues, and unsupported reducer
  outputs before commit.
- Keep public `useReducer` compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features use_reducer -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features function_component -- --nocapture`
- `git diff --check`
