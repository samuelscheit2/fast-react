# Worker 191: Root Scheduler Lane Selection Integration

## Goal

- Status: complete
- Objective: integrate the accepted core `RootLaneState::get_next_lanes` helper into the reconciler root scheduler's lane selection path, preserving existing callback reuse/cancel behavior while adding focused coverage for suspended, pinged, prewarm, idle, and entangled lane selection

## Progress

- Created and confirmed the worker goal with `get_goal` before research or file reads.
- Read `WORKER_BRIEF.md`; did not read `ORCHESTRATOR.md`.
- Read the requested worker reports and scheduler/root lane/work-loop files.
- Integrated scheduler microtask and scheduled callback lane selection with the accepted core `RootLaneState::get_next_lanes` helper.
- Added focused reconciler scheduler tests for suspended, pinged, prewarm, idle, entangled, and callback recheck behavior.
- Ran all requested verification commands successfully.

## Summary

The root scheduler now uses core `RootLaneState::get_next_lanes` when choosing work for root-schedule microtasks and scheduled callback execution. The scheduler keeps two lane views:

- `priority_lanes`: the direct `get_next_lanes` result used for callback priority, Scheduler priority, sync callback bypass decisions, and prerendering checks.
- `render_lanes`: the existing `RootLaneState::entangled_lanes_for` expansion applied after priority selection and passed onward as the work lanes.

This preserves existing no-work, sync, scheduled callback, reused callback, stale callback, and no host mutation/current-switching behavior while making suspended, pinged, prewarm, idle, and entangled selection match the accepted core helper semantics.

`get_next_lanes_to_flush_sync` integration remains intentionally deferred. The existing sync-flush planning path still uses the pre-existing highest-priority pending-lane helper plus entanglement expansion so this worker stays scoped to microtask and scheduled callback selection.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-191-root-scheduler-lane-selection-integration.md`

No `lib.rs` export changes were needed.

## Evidence Gathered

- Worker 128 established the root scheduler list, microtask scheduling, callback reuse/cancel, sync bypass, and no-render side-effect boundaries.
- Worker 155 established scheduled callback execution and stale/no-work/rendered callback records.
- Worker 156 established core `get_next_lanes`, prewarm fail-closed with pending commit, idle deferral behind suspended non-idle work, and entanglement remaining separate from priority selection.
- React 19.2.6 `ReactFiberRootScheduler.js` confirms `scheduleTaskForRootDuringMicrotask` and `performWorkOnRootViaSchedulerTask` call `getNextLanes` with WIP lanes and root pending-commit state before scheduling or rendering work.

No nested subagents were spawned.

## Tests Added

- Warm suspended unpinged lanes produce no async callback and remove the root from the scheduled list.
- Pinged suspended lanes schedule a normal async callback.
- Prewarm selection returns no work when `root_has_pending_commit` is true.
- Idle work waits behind suspended non-idle work.
- Entangled lanes expand after callback priority selection.
- Scheduled callback execution rechecks lane selection and reports no work for newly suspended unpinged lanes.

## Commands Run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,240p' worker-progress/worker-128-reconciler-root-scheduler-foundation.md
sed -n '1,260p' worker-progress/worker-155-scheduler-callback-execution.md
sed -n '1,260p' worker-progress/worker-156-root-lane-selection-helpers.md
sed -n '1,360p' crates/fast-react-core/src/root_lanes.rs
sed -n '360,840p' crates/fast-react-core/src/root_lanes.rs
sed -n '1,860p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '860,1320p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1320,1860p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,520p' crates/fast-react-reconciler/src/fiber_root.rs
sed -n '1,760p' crates/fast-react-reconciler/src/root_work_loop.rs
sed -n '1,360p' crates/fast-react-reconciler/src/lib.rs
rg -n "pending_commit|PendingCommit" crates/fast-react-reconciler/src -g '!target'
rg -n "mark_suspended|mark_pinged|mark_entangled|mark_finished|lanes_mut\\(\\)" crates/fast-react-reconciler/src -g '!target'
sed -n '1,280p' crates/fast-react-core/src/lane.rs
sed -n '1,260p' crates/fast-react-reconciler/src/root_config.rs
sed -n '260,380p' crates/fast-react-reconciler/src/root_commit.rs
sed -n '1,340p' crates/fast-react-reconciler/src/root_updates.rs
sed -n '340,620p' crates/fast-react-reconciler/src/root_updates.rs
rg -n "get_next_lanes|prewarm|warm|idle|entangle|pending commit|suspended" crates/fast-react-core/src/root_lanes.rs
sed -n '1010,1160p' crates/fast-react-core/src/root_lanes.rs
git status --short --untracked-files=all
rg -n "function scheduleTaskForRootDuringMicrotask|function performWorkOnRootViaSchedulerTask|getNextLanes\\(" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
sed -n '300,520p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
sed -n '520,660p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo test -p fast-react-reconciler --all-features root_work_loop
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
git status --short --untracked-files=all
git diff --stat
git diff -- crates/fast-react-reconciler/src/root_scheduler.rs
```

## Verification

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-reconciler --all-features root_scheduler`: passed, 22 tests.
- `cargo test -p fast-react-reconciler --all-features root_work_loop`: passed, 7 tests.
- `cargo test -p fast-react-reconciler --all-features`: passed, 91 unit tests plus 1 doctest.
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`: passed.
- `git diff --check`: passed.

## Post-Merge Orchestrator Verification

- Orchestrator merged current `main` into this branch and resolved the
  `crates/fast-react-reconciler/src/root_scheduler.rs` conflict by preserving
  accepted act-queue routing and sync-flush commit behavior while using
  `RootLaneState::get_next_lanes` for microtask and scheduled-callback priority
  selection.
- Post-merge verification passed:
  - `cargo fmt --all --check`
  - `cargo test -p fast-react-reconciler --all-features root_scheduler`: 28
    tests
  - `cargo test -p fast-react-reconciler --all-features root_work_loop`: 7
    tests
  - `cargo test -p fast-react-reconciler --all-features`: 131 unit tests plus
    1 doctest
  - `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
  - `git diff --check`

## Risks Or Blockers

- Pending-commit state currently has no local reconciler test setter in the allowed write scope, so the pending-commit prewarm case is covered through the scheduler's root-lane selection helper rather than by mutating a live `FiberRoot`.
- Sync-flush lane selection still needs a later scoped worker to integrate `RootLaneState::get_next_lanes_to_flush_sync`.

## Recommended Next Tasks

- Integrate `get_next_lanes_to_flush_sync` into real cross-root sync flush planning when that scope is assigned.
- Add public pending-commit/cancel-pending-commit state transitions once commit suspension or async commit work exists, then replace the helper-only pending-commit prewarm coverage with a full root-scheduler path test.
