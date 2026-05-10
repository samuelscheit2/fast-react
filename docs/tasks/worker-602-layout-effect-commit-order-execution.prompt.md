# Worker 602: Layout Effect Commit Order Execution

## Objective

Add a private layout-effect commit-order execution gate that records deterministic
layout callbacks after accepted mutation metadata but before passive metadata.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 537 and 569 established layout/effect ordering metadata; consume it for
one private execution canary.

## Write Scope

- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-602-layout-effect-commit-order-execution.md`

Do not edit passive effect files unless a tiny shared type is unavoidable.

## Requirements

- Add a private gate that invokes one deterministic layout test callback in
  commit order after matching mutation metadata.
- Reject passive-phase records, stale effect rings, and unsupported fiber tags.
- Keep public `useLayoutEffect` compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features layout_effect -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features effect_list -- --nocapture`
- `git diff --check`
