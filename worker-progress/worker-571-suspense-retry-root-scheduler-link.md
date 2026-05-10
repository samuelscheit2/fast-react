# Worker 571 - Suspense Retry Root Scheduler Link

## Goal

- Objective: Link accepted Suspense thenable ping blocker metadata to a private root scheduler retry request without executing Suspense compatibility.
- Goal status at setup and report time: active.
- `get_goal` was available and reported the objective above.

## Summary

- Added begin-work classification helpers for accepted Suspense retry ping blockers, offscreen-only retry queues, and compatible retry lane sets.
- Added a private root scheduler retry request record that consumes `UnsupportedSuspenseChildShapeRecord` metadata, records the boundary, retry lane, pinged lanes, retry queues, and scheduler callback blockers, and marks compatible suspended retry lanes as pinged before scheduling the root.
- Kept Suspense rendering, fallback traversal, wakeable subscription, and public Suspense compatibility blocked through explicit blocker metadata and false execution/compatibility accessors.
- Rejected offscreen-only retry records, stale boundaries, non-boundary retry records, non-retry ping lanes, and root lane mismatches without mutating pinged lanes or scheduling callbacks.

## Changed Files

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-571-suspense-retry-root-scheduler-link.md`

## Verification

- `cargo test -p fast-react-reconciler --all-features begin_work -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_scheduler -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`

All commands passed after applying `cargo fmt --all`.

## Evidence

- Begin-work focused tests now assert accepted Suspense retry blockers are retry-lane compatible and that Offscreen blockers remain offscreen-only/unaccepted.
- Root scheduler tests prove accepted Suspense retry metadata marks `RETRY_2` pinged, schedules the root microtask, and later lets microtask processing create deterministic retry callback metadata without host operations.
- Root scheduler tests also prove offscreen-only, stale-boundary, non-retry lane, and root-lane-mismatch inputs are rejected with no pinged-lane mutation and no microtask request.
- Two read-only explorer agents were spawned for parallel inspection, but they did not return usable results before implementation and were closed; conclusions are based on direct code inspection and the verification above.

## Risks Or Blockers

- The new retry request is crate-private and diagnostic-first. It does not subscribe wakeables, traverse fallback children, execute Suspense rendering, or claim public compatibility.
- Public Suspense behavior remains blocked by design.

## Recommended Next Tasks

- Wire future Suspense workers to produce a dedicated accepted-record wrapper once wakeable subscription and boundary retry queues become executable.
- Add root-work-loop integration only after Suspense begin/complete traversal can safely preserve the same rejection semantics.
