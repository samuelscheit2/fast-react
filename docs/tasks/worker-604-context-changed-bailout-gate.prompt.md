# Worker 604: Context Changed Bailout Gate

## Objective

Add private diagnostics for context-changed bailout decisions so unchanged
providers can skip propagation while changed providers keep marking lanes.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Use accepted context dependency metadata and root work-loop context canaries.

## Write Scope

- `crates/fast-react-reconciler/src/context.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-604-context-changed-bailout-gate.md`

Do not edit `begin_work.rs` unless a narrow helper is unavoidable.

## Requirements

- Add a private gate that records unchanged-provider bailout evidence and
  changed-provider lane marking evidence through the same dependency records.
- Reject stale snapshots, mismatched provider paths, and empty lanes.
- Keep public context compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features context_provider_update_lane_gate -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_work_loop_context -- --nocapture`
- `git diff --check`
