# Worker 980 - Expired Queue-Lane Currentness Consumer

## Summary

- Added a private/test-only expired Default+Sync queue-lane currentness
  consumer in `root_scheduler.rs`.
- The consumer accepts only
  `RootExpiredLaneSyncSchedulerQueueLaneContinuationRecordForCanary` records
  that prove expired Default selection with Sync co-selected and contain an
  accepted underlying queue-lane continuation.
- The accepted path delegates to
  `consume_finished_work_queue_lane_commit_currentness_for_canary`, preserving
  Worker 948's source-token and live-tree replay defense instead of creating a
  parallel currentness ledger.
- Audit follow-up: the consumer now validates the expired wrapper's own
  root/callback/lane/currentness metadata against the accepted underlying
  continuation before consuming the Worker 948 source token, and the wrapper's
  routed proof predicate fails when that metadata is caller-shaped.
- Second audit follow-up: the wrapper currentness gate also validates the
  top-level `current_time` and `expired_lanes_before` fields against the
  wrapper source metadata before consuming the Worker 948 source token.
- Kept public root, Scheduler timing, act, React DOM, test-renderer, native,
  package, and public effect compatibility claims blocked.

## Context

- Worker 898 added the queue-lane gated finished-work commit consumer.
- Worker 904 routed that queue-lane proof through the private root scheduler
  continuation.
- Worker 907 hardened callback/selected-lane/replay negatives for that route.
- Worker 906 added the expired Default+Sync queue-lane continuation wrapper.
- Worker 948 added the finished-work queue-lane currentness source token and
  live committed tree consumer used here.

## Evidence

- Positive canary consumes an expired Default+Sync queue-lane continuation
  through the Worker 948 source token, then verifies the committed HostRoot
  element, child topology, update sequence, selected/finished/remaining lanes,
  callback identity, and no public compatibility claims.
- Negative canaries reject pre-consume clones, replay, stale live roots, wrong
  expired/selected lanes, missing underlying continuations, scheduler-only
  evidence, and skipped-lane smuggling before any public behavior claim.
- Added a regression for caller-shaped top-level expired wrapper metadata
  around a genuine underlying continuation. It returns `Err` before source
  consumption, then the original source-owned execution still consumes
  successfully.
- Added a regression for drifted `current_time` and `expired_lanes_before`
  around a genuine underlying continuation. Each drift returns `Err` before
  source consumption, then the original source-owned execution still consumes
  successfully.

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-reconciler --all-features expired_default_sync_queue_lane_currentness -- --nocapture` (rerun after audit repair)
- `cargo test -p fast-react-reconciler --all-features finished_work_queue_lane_commit_currentness`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_expired_default_sync_queue_lane_continuation`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `git diff --check`

All commands passed.

## Risks Or Blockers

- This remains Rust-private/test-only currentness evidence. It does not expose
  public Scheduler timing, public roots, act, React DOM, native host execution,
  package, or root behavior.
- The wrapper stores a cloned expired continuation after consumption; the clone
  intentionally has no Worker 948 source token, so follow-up consumers must use
  the original source-owned execution record and not replay the wrapper.
