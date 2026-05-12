# Worker 1237 - Rust Exact-Three Transition Currentness

## Status

Complete. The dirty exact-three branch was unsound as a replacement because it removed the accepted exact-two same-transition multi-update continuation shape. I repaired it as a bounded private Rust/test-only extension that accepts exactly two or exactly three same-transition rows and still rejects four rows or forged source sequences.

## Summary

- Added `RootTransitionSameLaneMultiUpdateRequestsForCanary`, an explicit exact-two/exact-three request enum for private same-transition multi-update scheduler/currentness canaries.
- Kept the existing exact-two continuation/currentness evidence live and added exact-three acceptance/currentness evidence without introducing N-row batching.
- Kept source-owned queue handoff validation tied to the exact request update sequence, queue identity, root identity, lane metadata, and queue row order.
- Changed root update same-transition handoff proof from exact two only to exact two or exact three, with a fourth-row negative.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_scheduler/tests.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `worker-progress/worker-1237-rust-exact-three-transition-currentness.md`

## Commands Run

- `cargo test -p fast-react-reconciler --all-features root_updates_same_transition_multi_update`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_transition_same_lane_multi_update_queue_lane_continuation`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_queue_lane_continuation`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_transition`
- `cargo test -p fast-react-reconciler --all-features root_updates`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `git diff --check`

## Evidence Gathered

- `root_updates_same_transition_multi_update`: 1 passed; exact two and exact three same-transition handoff proofs accepted, fourth rejected.
- `root_scheduler_transition_same_lane_multi_update_queue_lane_continuation`: 7 passed; exact two and exact three continuations accepted, duplicate exact-two and exact-three request claims rejected, and negative cases fail before commit.
- `root_scheduler_queue_lane_continuation`: 13 passed; generic private queue-lane continuation path remains fail-closed.
- `root_scheduler_transition`: 31 passed; exact two and exact three currentness consumers passed and broader transition queue-lane scheduler coverage remained green.
- `root_updates`: 35 passed; broader root update queue-lane coverage remained green.
- `cargo check`, `cargo fmt --all --check`, and `git diff --check` passed after edits.

## Risks Or Blockers

- Scope remains private Rust/test-only. Public Scheduler, public root, React DOM, hooks, act, test-renderer, native, package, and renderer compatibility are not claimed.
- This branch does not establish broad N-row same-transition batching. It only proves exact two and exact three shapes.
- The exact-three helper now tolerates unrelated roots that drain as `NoWork` while still requiring exactly one scheduled record for the target root; this was needed for the cross-root negative.

## Recommended Next Tasks

- If broader multi-row batching is desired, add a separate source-owned request collection design rather than extending this exact-two/exact-three enum.
- Keep future public compatibility work blocked until renderer-facing currentness and scheduling surfaces have source-owned evidence beyond these private canaries.
