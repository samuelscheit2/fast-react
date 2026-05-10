# Worker 227: Suspense/Offscreen Fail-Closed Lane Tests

Objective: add focused fail-closed tests for unsupported Suspense, Offscreen,
Activity, and SuspenseList paths around the minimal root render/lane-selection
surface, proving these features do not silently schedule or render with
incorrect lanes before their oracles exist.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 147, 156, 175, 191, and 199.
- Inspect `crates/fast-react-core/src/root_lanes.rs`,
  `crates/fast-react-reconciler/src/root_scheduler.rs`,
  `root_work_loop.rs`, and `unsupported_features.rs`.

## Write Scope

- Primary: focused tests in `crates/fast-react-core/src/root_lanes.rs` and/or
  `crates/fast-react-reconciler/src/unsupported_features.rs`.
- Secondary: `crates/fast-react-reconciler/src/root_work_loop.rs` tests only.
- Report: `worker-progress/worker-227-suspense-offscreen-failclosed-lane-tests.md`.
- Do not implement Suspense/Offscreen behavior; do not edit DOM/test-renderer
  or master docs.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features root_lanes`
- `cargo test -p fast-react-reconciler --all-features unsupported_features`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `git diff --check`
