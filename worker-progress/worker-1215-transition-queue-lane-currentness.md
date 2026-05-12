# Worker 1215: Transition Queue-Lane Currentness

## Summary

- Added a private/test-only transition queue-lane commit currentness consumer
  for the accepted root-scheduler transition continuation path.
- The accepted transition continuation now mints a Worker 948
  `RootFinishedWorkQueueLaneCommitCurrentnessSourceTokenForCanary` from the
  same finished-work queue-lane identity used by the sync and expired
  consumers, and cloned transition records clear that token.
- The transition currentness consumer adapts accepted transition continuations
  into the existing Worker 948 finished-work queue-lane currentness consumer
  rather than adding a second ledger.
- Added source metadata checks around the transition wrapper so caller-shaped
  transition evidence fails before the Worker 948 source token is consumed.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_scheduler/tests.rs`
- `worker-progress/worker-1215-transition-queue-lane-currentness.md`

## Evidence Gathered

- Positive canary consumes the transition queue-lane continuation through the
  Worker 948 source token and proves live committed HostRoot state, root token,
  root/current/finished-work identity, selected/finished/remaining lanes,
  callback identity, update sequence IDs, resulting element, committed child
  topology, mutation record presence, and one-shot source consumption.
- Negative canaries reject cloned transition records without source tokens,
  preserved-token caller-shaped transition metadata, replay after consumption,
  cross-root handoff, stale callback replay, stale live root after another
  update, missing queue handoff/scheduler-only evidence, wrong finished lanes,
  and skipped-lane smuggling.
- The consumer preserves existing queue/lane handoff predicates, row metadata,
  callback identity, root/current/finished-work identity, and replay/cross-root
  protections by delegating to
  `consume_finished_work_queue_lane_commit_currentness_for_canary`.

## Commands Run

- `cargo test -p fast-react-reconciler --all-features root_scheduler_transition`
  - Passed: 18 tests.
- `cargo test -p fast-react-reconciler --all-features finished_work_queue_lane_commit_currentness`
  - Passed: 5 tests.
- `cargo test -p fast-react-reconciler --all-features root_scheduler_queue_lane_continuation`
  - Passed: 13 tests.
- `cargo test -p fast-react-reconciler --all-features root_scheduler_expired_default_sync_queue_lane_continuation`
  - Passed: 11 tests.
- `cargo test -p fast-react-reconciler --all-features root_updates`
  - Passed: 34 tests.
- `cargo test -p fast-react-reconciler --all-features root_commit`
  - Passed: 128 tests.
- `cargo test -p fast-react-reconciler --all-features expired_default_sync_queue_lane_currentness`
  - Passed: 7 tests.
- `cargo check -p fast-react-reconciler --all-features`
  - Passed.
- `cargo fmt --all`
  - Applied formatting.
- `cargo fmt --all --check`
  - Passed.
- `git diff --check`
  - Passed.

## Compatibility Non-Claims

- This remains private Rust/test-host currentness evidence only.
- No public Scheduler timing, public root, React DOM, transition hook, `act`,
  test-renderer, native runtime, package, renderer, or public effect
  compatibility is claimed.

## Risks Or Blockers

- No blockers found.
- The transition adapter intentionally depends on the private canary shape of
  `RootTransitionSchedulerQueueLaneContinuationRecordForCanary` and
  `RootSyncSchedulerQueueLaneContinuationExecutionRecordForCanary`. Future
  transition continuation shape changes should update the source metadata
  comparison and adapter together.
- The source token remains one-shot and root-scheduler-owned. Follow-up
  consumers must not clone or replay transition records and treat them as
  current without consuming the Worker 948 source token.

## Recommended Next Tasks

- Keep public Scheduler timing/root/React DOM/hooks/act/test-renderer/native/
  package/renderer compatibility blocked until separate public behavior gates
  are accepted.
- If multi-transition batches are admitted, add a separate currentness consumer
  for multiple transition lanes rather than widening this single-transition
  queue-lane proof.

## Commit

- Final branch `HEAD` is reported in the worker handoff after the commit is
  created. A commit cannot contain its own final hash in this tracked report.
