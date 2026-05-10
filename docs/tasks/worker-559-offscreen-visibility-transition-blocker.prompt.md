# Worker 559: Offscreen Visibility Transition Blocker

## Objective

Add private Offscreen visibility transition blocker diagnostics for hidden to
visible and visible to hidden transitions without implementing Offscreen
rendering.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted Offscreen blocker and Suspense diagnostics.

## Write Scope

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/complete_work.rs`
- Focused Rust tests
- `worker-progress/worker-559-offscreen-visibility-transition-blocker.md`

## Requirements

- Record mode, previous/current visibility, child traversal blocker, and lane
  metadata.
- Keep actual Offscreen rendering, effects, and public compatibility blocked.

## Verification

- Focused Offscreen Rust tests
- `cargo fmt --all --check`
- `git diff --check`

