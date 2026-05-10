# Worker 569: Effect List Commit Phase Order

## Objective

Add private reconciler diagnostics that prove layout and passive effect list
ordering across commit phases without invoking effect callbacks publicly.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 537 and earlier effect workers record layout/passive metadata. This
task should connect those records in a commit-phase ordering gate.

## Write Scope

- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/function_component.rs` only for narrow
  effect-record accessors needed by the gate
- Focused Rust tests in touched modules
- `worker-progress/worker-569-effect-list-commit-phase-order.md`

Avoid JS packages, React DOM, native, and conformance edits.

## Requirements

- Record before-mutation, mutation, layout, and passive scheduling order for a
  minimal function-component effect list.
- Keep layout create/destroy, passive create/destroy, and public act execution
  blocked unless already explicitly accepted by existing private gates.
- Reject stale or cross-root effect list records.
- Preserve existing ref and deletion cleanup ordering tests.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-reconciler --all-features root_commit -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features function_component -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`
