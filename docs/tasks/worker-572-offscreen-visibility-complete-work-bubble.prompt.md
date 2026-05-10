# Worker 572: Offscreen Visibility Complete-Work Bubble

## Objective

Add private Offscreen visibility diagnostics for complete-work bubbling and
subtree flag blockers after the accepted begin-work visibility gate.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 559 added Offscreen visibility transition blockers in begin-work. This
task should document the downstream complete-work/flag bubble boundary.

## Write Scope

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/complete_work.rs`
- `crates/fast-react-reconciler/src/root_commit.rs` only if a narrow flag
  accessor is needed
- Focused Rust tests in touched modules
- `worker-progress/worker-572-offscreen-visibility-complete-work-bubble.md`

Avoid JS packages and conformance files.

## Requirements

- Record Offscreen hidden/visible transition identity, subtree flag bubbling
  intent, and why visibility effects remain blocked.
- Keep child traversal, host mutation, visibility effect scheduling, and public
  Offscreen compatibility blocked.
- Reject unsupported Offscreen shapes and stale begin-work transition records.
- Preserve Suspense and Activity blocker tests.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-reconciler --all-features offscreen -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features complete_work -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`
