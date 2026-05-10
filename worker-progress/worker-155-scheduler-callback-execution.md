# Worker 155 - Scheduler Callback Execution

## Goal
- Status: active
- Objective: connect scheduled root callback records to the HostRoot render-phase entry point from worker 129, producing deterministic execution records and stale-callback behavior without owning sync flush, commit, or public Scheduler package behavior

## Progress
- 2026-05-10: Goal created and confirmed with `get_goal`.
- 2026-05-10: Implemented scheduler callback execution records and verified the required suites.

## Summary

Connected deterministic scheduler callback records to worker 129's HostRoot
render-phase entry point.

The new internal scheduler API accepts a recorded `SchedulerCallbackRequest`,
validates its callback node with `validate_scheduled_host_root_callback`, and
returns an explicit execution record for:

- stale callback: no lane selection and no render;
- no work: matching callback but no selected lanes, with internal callback
  identity cleared;
- rendered callback: selected lanes passed to
  `render_host_root_via_scheduler_callback`, yielding the HostRoot render-phase
  record.

The slice does not implement cross-root sync flushing, continuation scheduling,
commit, host mutation, public Scheduler package behavior, or `root.current`
switching.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-155-scheduler-callback-execution.md`

No `scheduler_bridge.rs` change was needed; the existing
`SchedulerCallbackRequest` already contains the root, callback node, scheduler
priority, and callback priority needed for deterministic execution records.

## Evidence Gathered

- Read `WORKER_BRIEF.md` after goal setup; did not read `ORCHESTRATOR.md`.
- Read worker 128, 129, and 131 progress reports for scheduler ownership,
  callback identity validation, and sync-flush boundaries.
- Inspected `root_scheduler.rs`, `scheduler_bridge.rs`, `root_work_loop.rs`,
  and `lib.rs`.
- Cross-checked React 19.2.6 `ReactFiberRootScheduler.js`
  `scheduleTaskForRootDuringMicrotask` and
  `performWorkOnRootViaSchedulerTask` for callback identity, no-work, and
  stale-callback behavior.
- No subagents were spawned.

## Commands Run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,240p' worker-progress/worker-128-reconciler-root-scheduler-foundation.md
sed -n '1,260p' worker-progress/worker-129-host-root-render-phase-foundation.md
sed -n '1,220p' worker-progress/worker-131-sync-flush-act-refresh.md
sed -n '1,760p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,420p' crates/fast-react-reconciler/src/scheduler_bridge.rs
sed -n '1,820p' crates/fast-react-reconciler/src/root_work_loop.rs
sed -n '1,360p' crates/fast-react-reconciler/src/lib.rs
rg -n "performWorkOnRootViaSchedulerTask|scheduleTaskForRootDuringMicrotask|originalCallbackNode|callbackNode|No work|stale|callbackNode" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
sed -n '384,610p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo test -p fast-react-reconciler --all-features root_work_loop
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
git status --short
git diff --stat
{ git diff --name-only; git ls-files --others --exclude-standard; }
```

## Verification Results

Passed:

```sh
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo test -p fast-react-reconciler --all-features root_work_loop
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
```

Full reconciler result: 66 unit tests passed plus 1 doctest.

Changed-path scope:

```text
crates/fast-react-reconciler/src/lib.rs
crates/fast-react-reconciler/src/root_scheduler.rs
worker-progress/worker-155-scheduler-callback-execution.md
```

## Risks Or Blockers

- The rendered path intentionally stops after HostRoot render-phase work; it
  does not finish lanes, switch `root.current`, or schedule continuations.
- The no-work path clears the internal callback identity but does not emit a
  Scheduler cancellation record because the callback being handled is already
  executing.
- Sync callbacks remain outside this API because sync work still belongs to a
  future cross-root sync-flush slice.

## Recommended Next Tasks

- Add the continuation/reschedule decision after commit/current-switch
  semantics exist.
- Replace the current sync flush plan collector with real guarded cross-root
  sync work once that worker owns sync flushing.
- Connect commit completion to lane finishing and callback cleanup so rendered
  callback records can flow into a complete root lifecycle.
