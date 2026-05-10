# Worker 599: Function Component useState Dispatch Commit Link

## Objective

Connect private `useState` dispatch diagnostics to a root render and commit
handoff for one function-component HostText update shape.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Build on accepted hook queue, concurrent update, root scheduler, and
finished-work diagnostics.

## Write Scope

- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/concurrent_updates.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs` only for a narrow test
  handoff helper
- Existing focused Rust tests in those files
- `worker-progress/worker-599-function-component-usestate-dispatch-commit-link.md`

Do not edit JS packages or public React hook surfaces.

## Requirements

- Add a private gate proving a `useState` dispatch marks lanes, schedules the
  root, renders the function component, and reaches accepted commit metadata.
- Reject stale dispatch handles, wrong hook queues, and unsupported output
  shapes before scheduling or commit.
- Keep public hooks and public renderer compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features use_state -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features function_component -- --nocapture`
- `git diff --check`
