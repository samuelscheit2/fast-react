# Worker 948 - Finished-Work Commit Queue-Lane Currentness

## Summary

- Added a private, test-only finished-work commit queue-lane currentness
  consumer in `root_scheduler.rs`.
- Tied the source-owned record to root/current/finished-work identity,
  selected/finished/remaining lanes, scheduler callback identity, queue handoff,
  commit order, update sequence ids, and resulting committed HostRoot state.
- Kept public React DOM, test renderer, flushSync, act, Scheduler timing,
  native host execution, and public effect compatibility blocked.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-948-rust-finished-work-commit-queue-lane-currentness.md`

## Currentness Path

Successful queue-lane scheduler continuation commits now record a pending
source-owned currentness identity in `RootSchedulerState` after the private
finished-work queue-lane handoff is accepted and committed.

`consume_finished_work_queue_lane_commit_currentness_for_canary` validates the
accepted scheduler continuation, pending source identity, live root state,
queue rows, committed HostRoot element, and committed child topology before
moving that identity from pending to consumed. Replay, caller-built callback
identity drift, stale live roots, scheduler-only evidence, and skipped-lane
smuggling all fail before consumption.

## Tests And Checks

- `cargo fmt --all`
- `cargo fmt --all --check`
- `git diff --check`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo test -p fast-react-reconciler --all-features finished_work_queue_lane_commit_currentness -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features finished_work_queue_lane_commit_currentness`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_queue_lane_continuation`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_expired_default_sync_queue_lane_continuation`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo test -p fast-react-reconciler --all-features root_updates`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features`

## Evidence

- Positive canary consumes live committed tree state with test-renderer
  HostRoot child output, verifies previous/current/finished-work identity,
  queue lane metadata, callback identity, commit order, and mutation/deletion
  evidence.
- Negative canaries reject replay, caller-built callback identity drift,
  stale live root state, scheduler-only execution, and skipped-lane smuggling.
- `RootSchedulerState` private source ledgers stay under `#[cfg(test)]`, and
  public `Debug` / `PartialEq` output remains compatibility-neutral.
- Currentness record helpers explicitly report no public root, Scheduler
  timing, act, React DOM, test renderer, or public effect compatibility claim.

## Risks Or Blockers

- This remains a private/test-only canary. It does not expose public React DOM,
  test renderer, flushSync, act, Scheduler timing, native host mutation, or
  effect behavior.
- Bit-for-bit in-process clones before first consume are not distinguishable by
  value equality; replay after consume and caller-built drift are rejected by
  the source-owned pending/consumed ledger.

## Recommended Next Tasks

- Use this currentness consumer as the regression layer before opening any
  public queue-lane commit or renderer compatibility surface.
