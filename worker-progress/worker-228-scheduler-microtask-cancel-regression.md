# Worker 228: Scheduler Microtask Cancellation Regression

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- Initial `get_goal` status: `active`.
- Initial `get_goal` objective: `Add a focused regression slice for internal root scheduler microtask/callback cancellation and lane reselection using accepted get_next_lanes helpers, preserving the no-render/no-commit scheduler boundary and avoiding public Scheduler package changes unless a test harness requires them.`
- Pre-report `get_goal` status: `active` for the same objective.

## Summary

Added a focused regression slice in `root_scheduler.rs` for the accepted
`RootLaneState::get_next_lanes` scheduling path after worker 191.

The new tests cover:

- canceling an already scheduled async callback when a later microtask
  reselects no work because the pending lane is now suspended/warm;
- canceling and replacing an existing callback when lane reselection moves work
  from Default to a pending Transition lane, even though the Scheduler priority
  remains `Normal`;
- reselecting lanes at scheduled-callback execution time before the HostRoot
  render-phase handoff, while preserving no commit, no current switch, and no
  host mutation.

No public Scheduler package files, scheduler bridge implementation files, root
commit, sync flush, or root work-loop implementation files were changed.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-228-scheduler-microtask-cancel-regression.md`

## Evidence Gathered

- `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` were read.
- Required worker reports 120, 125, 126, 127, 144, 155, 156, 164, and 191
  were read.
- Inspected `root_scheduler.rs`, `scheduler_bridge.rs`, `fiber_root.rs`,
  `root_work_loop.rs`, `root_updates.rs`, and core lane/root-lane helpers.
- Checked React 19.2.6 `ReactFiberRootScheduler.js` and `ReactFiberLane.js`
  for `scheduleTaskForRootDuringMicrotask`, callback cancellation/reuse,
  `performWorkOnRootViaSchedulerTask`, and `getNextLanes` semantics.
- Confirmed worker 191 already integrated `RootLaneState::get_next_lanes` into
  microtask and scheduled-callback lane selection; this worker locks down the
  cancellation and re-selection behavior around that path.
- No nested managed agents were spawned.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-120-scheduler-mock-source-implementation.md
sed -n '1,260p' worker-progress/worker-125-scheduler-post-task-implementation.md
sed -n '1,260p' worker-progress/worker-126-scheduler-native-entry-implementation.md
sed -n '1,260p' worker-progress/worker-127-scheduler-native-smoke-integration.md
sed -n '1,280p' worker-progress/worker-144-scheduler-regression-refresh.md
sed -n '1,320p' worker-progress/worker-155-scheduler-callback-execution.md
sed -n '1,320p' worker-progress/worker-156-root-lane-selection-helpers.md
sed -n '1,320p' worker-progress/worker-164-scheduler-regression-tests.md
sed -n '1,360p' worker-progress/worker-191-root-scheduler-lane-selection-integration.md
sed -n '1,280p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '281,620p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '621,980p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '981,1360p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1361,2240p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,760p' crates/fast-react-reconciler/src/scheduler_bridge.rs
sed -n '1,760p' crates/fast-react-core/src/root_lanes.rs
sed -n '1,360p' crates/fast-react-core/src/lane.rs
sed -n '300,760p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
sed -n '240,390p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js
git status --short
git diff -- crates/fast-react-reconciler/src/root_scheduler.rs
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features scheduler_bridge
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
```

Goal/tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after goal setup.
- `get_goal` again before writing this report.

## Verification

Passing:

```sh
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo test -p fast-react-reconciler --all-features scheduler_bridge
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
```

Latest observed results:

- `root_scheduler`: 31 tests passed.
- `scheduler_bridge`: 7 tests passed.
- Full `fast-react-reconciler`: 154 unit tests and 1 doctest passed.

## Risks Or Blockers

- The pending-commit cancellation edge from React's
  `scheduleTaskForRootDuringMicrotask` is still limited by the current lack of
  local setters for `cancel_pending_commit`, `timeout_handle`, and
  `pending_commit` in the allowed write scope.
- The callback execution regression intentionally uses lane-state mutation to
  model a transition lane without adding a new root update entry point. The
  test proves lane reselection and no commit/host mutation, not transition
  update queue payload application.
- Sync-flush lane selection still uses the existing deferred path and was not
  changed.

## Recommended Next Tasks

1. Add pending-commit/cancel-pending-commit root scheduler tests when those
   state transitions have scoped mutators or real async commit owners.
2. Integrate `get_next_lanes_to_flush_sync` into sync flush planning in a
   separate sync-flush-owned slice.
