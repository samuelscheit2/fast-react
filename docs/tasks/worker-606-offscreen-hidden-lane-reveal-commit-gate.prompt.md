# Worker 606: Offscreen Hidden Lane Reveal Commit Gate

## Objective

Add private Offscreen diagnostics tying hidden update lanes, visibility bubbling,
and reveal commit metadata together without exposing public Offscreen behavior.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 572 and 559 established Offscreen visibility blockers and complete-work
bubbling evidence.

## Write Scope

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/complete_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-606-offscreen-hidden-lane-reveal-commit-gate.md`

Do not edit React DOM/test-renderer JS.

## Requirements

- Add a private gate that records hidden-lane retention, visibility transition
  bubbling, and accepted reveal commit metadata for one bounded shape.
- Reject stale begin/complete records and unsupported Offscreen children.
- Keep public Offscreen/Activity compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features offscreen -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features complete_work -- --nocapture`
- `git diff --check`
