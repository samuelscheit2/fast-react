# Worker 598: Root Callback Visible Invocation Gate

## Objective

Add a private root-callback invocation gate that can invoke accepted visible
callbacks in deterministic commit order without exposing public callback
compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Use existing callback snapshot/order metadata from root updates and commit
handoff diagnostics.

## Write Scope

- `crates/fast-react-reconciler/src/root_callbacks.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-598-root-callback-visible-invocation-gate.md`

Do not edit React DOM/test-renderer JS.

## Requirements

- Add a private canary that consumes accepted queued callback order snapshots
  and invokes deterministic test callbacks after a matching commit record.
- Reject stale queue snapshots, hidden/deferred callbacks, and wrong-root
  callback handles before invocation.
- Preserve public callback compatibility blockers.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_callbacks -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features callback_order -- --nocapture`
- `git diff --check`
