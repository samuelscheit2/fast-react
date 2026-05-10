# Worker 228: Scheduler Microtask Cancellation Regression

Objective: add a focused regression slice for internal root scheduler
microtask/callback cancellation and lane reselection using accepted
`get_next_lanes` helpers, preserving the no-render/no-commit scheduler boundary
and avoiding public Scheduler package changes unless a test harness requires
them.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 120, 125, 126, 127, 144, 155, 156, 164, and 191.
- Inspect `crates/fast-react-reconciler/src/root_scheduler.rs`,
  `scheduler_bridge.rs`, and core lane helpers.

## Write Scope

- Primary: `crates/fast-react-reconciler/src/root_scheduler.rs`.
- Secondary: focused scheduler bridge tests only.
- Report: `worker-progress/worker-228-scheduler-microtask-cancel-regression.md`.
- Do not edit root work-loop, root commit, sync flush, JS Scheduler package, or
  master docs unless a focused smoke fixture requires it.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo test -p fast-react-reconciler --all-features scheduler_bridge`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
