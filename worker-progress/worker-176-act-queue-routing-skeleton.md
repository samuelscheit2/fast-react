# Worker 176 Progress

Objective: add internal act queue routing records and fake callback-node tests without exposing public act or changing React DOM/test-renderer facades.

Goal status: complete

Goal objective: add internal act queue routing records and fake callback-node tests without exposing public act or changing React DOM/test-renderer facades

Notes:
- Goal was created with `create_goal`, then confirmed with `get_goal`.

## Summary

Added data-only internal act queue routing records to the reconciler scheduler
bridge and routed root scheduling through them when act mode is active. The
normal inactive scheduler path remains unchanged: microtasks still record
`SchedulerMicrotaskRequest`s, non-sync callbacks still record real scheduler
callback nodes, and real callback cancellation records are preserved.

No public JS `act`, React DOM facade, test-renderer facade, sync flush
execution, render execution, commit execution, or host mutation path was
changed.

## Changed Files

- `crates/fast-react-reconciler/src/scheduler_bridge.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-176-act-queue-routing-skeleton.md`

## Evidence Gathered

- `SchedulerBridge` now records act queue tasks with
  `SchedulerActQueueRequest` and `SchedulerActQueueTaskKind`.
- A single exported fake callback sentinel,
  `FAKE_ACT_CALLBACK_NODE`, models React's fake act callback node.
- `cancel_callback` ignores both empty handles and the fake act callback node.
- `RootSchedulerState` now uses the existing `did_schedule_microtask_act`
  flag for act root-schedule task dedupe.
- `ensure_root_is_scheduled` records an act root-schedule task when the
  bridge act queue is active and keeps the normal microtask request path when
  inactive.
- `schedule_task_for_root_during_microtask` routes non-sync callbacks to the
  act queue when active, stores the fake callback node on the root, and cancels
  an existing real scheduler callback before rerouting equal-priority work.
- Focused tests cover act root-schedule routing, act callback routing,
  real-callback cancellation before rerouting, fake-node cancellation no-op,
  inactive-path behavior, and no render/commit/host mutation side effects.
- `git diff --name-status` shows no public package or JS facade files changed.

## Commands Run

```sh
create_goal objective="add internal act queue routing records and fake callback-node tests without exposing public act or changing React DOM/test-renderer facades"
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,220p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,220p' worker-progress/worker-086-react-test-renderer-act-oracle.md
sed -n '1,220p' worker-progress/worker-097-react-act-oracle.md
sed -n '1,220p' worker-progress/worker-131-sync-flush-act-refresh.md
sed -n '1,260p' crates/fast-react-reconciler/src/scheduler_bridge.rs
sed -n '1,620p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,140p' crates/fast-react-reconciler/src/lib.rs
rg -n "act|Act|callback_node|callback_node|fake|schedule_callback|cancel_callback|microtask|scheduler_bridge" crates/fast-react-reconciler/src crates/fast-react-reconciler/tests
git status --short --untracked-files=all
sed -n '140,340p' crates/fast-react-reconciler/src/scheduler_bridge.rs
sed -n '150,245p' crates/fast-react-reconciler/src/fiber_root.rs
sed -n '1,180p' crates/fast-react-reconciler/src/root_config.rs
sed -n '618,920p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '920,1220p' crates/fast-react-reconciler/src/root_scheduler.rs
rg -n "fakeActCallbackNode|actQueue|didScheduleMicrotask_act|scheduleCallback" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
sed -n '90,180p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
sed -n '380,520p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
sed -n '640,690p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
rg -n "RootSchedulerCallbackHandle|SchedulerCallbackRequest|RootTaskScheduleOutcome|did_schedule_microtask_act|SchedulerMicrotaskRequest" crates packages tests -g '!node_modules'
rg -n "struct RootCallbackPriority|impl RootCallbackPriority" crates/fast-react-reconciler/src/root_config.rs
sed -n '300,335p' crates/fast-react-reconciler/src/root_config.rs
cargo fmt --all
cargo test -p fast-react-reconciler --all-features scheduler_bridge
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo fmt --all --check
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
git diff --name-status
git diff -- crates/fast-react-reconciler/src/scheduler_bridge.rs crates/fast-react-reconciler/src/root_scheduler.rs crates/fast-react-reconciler/src/lib.rs
git status --short --untracked-files=all
```

The `rg ... crates/fast-react-reconciler/tests` command reported that the
crate has no separate `tests` directory; unit tests live under `src`.

## Verification Results

- Worker-local verification passed before orchestration merge:
  - `cargo fmt --all --check`
  - `cargo test -p fast-react-reconciler --all-features scheduler_bridge`: 7 tests
  - `cargo test -p fast-react-reconciler --all-features root_scheduler`: 14 tests
  - `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
  - `git diff --check`
- Orchestrator merged current `main` into this branch and resolved
  `root_scheduler.rs` by preserving accepted scheduler callback/sync-flush
  execution helpers plus the act queue routing records and tests.
- Post-merge orchestrator verification passed:
  - `cargo fmt --all --check`
  - `cargo test -p fast-react-reconciler --all-features scheduler_bridge`: 7 tests
  - `cargo test -p fast-react-reconciler --all-features root_scheduler`: 21 tests
  - `cargo test -p fast-react-reconciler --all-features`: 112 tests + 1 doctest
  - `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
  - `git diff --check`

## Risks Or Blockers

- This is intentionally still a routing skeleton. Act queue tasks are recorded
  but not executed, and continuations are still outside this slice.
- The fake callback node is an internal sentinel and should remain separate
  from any future public Scheduler task object shape.
- No blockers remain for this worker objective.

## Recommended Next Tasks

- Add the actual act queue drain/continuation execution path once the root work
  loop slice owns executable renderer tasks.
- Wire future public `React.act`/renderer wrappers to this internal queue only
  after facade-specific warning and async behavior is implemented.
