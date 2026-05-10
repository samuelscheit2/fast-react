# Worker 567: HostRoot Update Queue Callback Order

## Objective

Refresh private HostRoot update-queue diagnostics so callback ordering is tied
to accepted lane/root scheduler records without invoking user callbacks.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
The project has private HostRoot queue and callback handoff canaries; the next
step is stronger ordering evidence across multiple queued updates.

## Write Scope

- `crates/fast-react-reconciler/src/root_update_queue.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- Focused Rust tests in those modules
- `worker-progress/worker-567-host-root-update-queue-callback-order.md`

Do not edit JS facades, React DOM, scheduler JS packages, or conformance files.

## Requirements

- Record deterministic order for at least two HostRoot queued updates with
  distinct lanes and callback handles.
- Preserve existing callback non-invocation and public compatibility blockers.
- Add rejection paths for mismatched root tokens, missing callback handles, and
  stale queue snapshots.
- Keep root rendering, commit execution, and callback invocation blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-reconciler --all-features root_update_queue -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_updates -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`
