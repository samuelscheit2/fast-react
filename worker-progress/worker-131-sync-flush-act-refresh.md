# Worker 131 Sync Flush And Act Integration Refresh

## Goal Evidence

- `create_goal` called for objective: Produce a report-only refresh for sync flushing and act integration, scoped to `worker-progress/worker-131-sync-flush-act-refresh.md`, after inspecting the requested planning/context files and React 19.2.6 scheduler/act sources.
- `get_goal` returned status `active` for the same objective with `tokensUsed: 0` and `timeUsedSeconds: 0`.

## Summary

This is a report-only refresh. No source, tests, package metadata, prompts,
master docs, or lockfiles were changed.

The accepted worker 128 scheduler foundation is the right base for the next
sync flushing and `act` work: `root_scheduler.rs` already owns a global
scheduled-root list, microtask dedupe, callback priority/node state,
sync-callback bypass, bridge schedule/cancel records, and a guarded
`collect_sync_flush_plan`. It intentionally does not render, commit, execute
callbacks, flush roots, or route `act` tasks.

Worker 129 is active on HostRoot render-phase work in a separate worktree. The
sync/act follow-up should wait for that slice to settle before modifying
`root_scheduler.rs` or any future `root_work_loop.rs` entry points. The next
mergeable work should be split so execution-context guards, real cross-root
sync flushing, act queue routing, fake callback nodes, and JS facade call sites
can land independently without mixing public React DOM/test-renderer behavior
into reconciler internals.

## Current Baseline

- `crates/fast-react-reconciler/src/root_scheduler.rs` stores
  `first_scheduled_root`, `last_scheduled_root`, `did_schedule_microtask`,
  `did_schedule_microtask_act`, `might_have_pending_sync_work`,
  `is_flushing_work`, and `current_event_transition_lane`.
- `ensure_root_is_scheduled` validates the HostRoot schedule record, appends
  the root once, marks possible sync work, and requests one root-schedule
  microtask.
- `process_root_schedule_in_microtask` resets microtask flags, walks scheduled
  roots, removes roots with no lanes, records sync possibility, and schedules
  or cancels callback records. It does not flush sync work at microtask end yet.
- `schedule_task_for_root_during_microtask` maps non-sync lanes through the
  internal scheduler bridge, reuses equal-priority callback nodes, cancels
  stale nodes, and bypasses Scheduler for sync lanes. It does not call
  `mark_starved_lanes_as_expired`, passive-effect hooks, pending-commit
  checks, or act routing yet.
- `collect_sync_flush_plan` proves the list traversal and `is_flushing_work`
  guard but only returns root IDs; it does not perform work or repeat until no
  sync work remains.
- `scheduler_bridge.rs` is a deterministic record store for microtask requests,
  callback requests, and cancellation records. It has no executable
  `RenderTask`, no `did_timeout`, no continuation model, and no fake act
  callback node.
- `root_updates.rs` exposes `update_container` and `update_container_sync`.
  They enqueue HostRoot `{element}` updates and return schedule records; the
  caller still has to call `ensure_root_is_scheduled`.
- `packages/react-dom/*` and `packages/react/index.js` still expose public
  placeholders for `createRoot`, `flushSync`, `React.act`, and
  `react-dom/test-utils.act`. `packages/react-test-renderer` is absent locally.

## Evidence Gathered

Planning files:

- `WORKER_BRIEF.md` confirms React 19.2.6 targets and the local reference clone
  at `/Users/user/Developer/Developer/react-reference`, commit
  `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- `MASTER_PLAN.md` has worker 129 active on HostRoot render-phase foundation
  and keeps workers 130-139 report-only.
- `MASTER_PROGRESS.md` records worker 128 root scheduler foundation as merged.
- Worker 081 and worker 111 agree that sync flushing and `act` belong in a
  shared reconciler scheduler, not in React DOM or test-renderer shortcuts.
- Worker 128 confirms the merged foundation is data-only and explicitly leaves
  real sync flushing and `act` routing for future slices.
- The worker 129 prompt confirms HostRoot render-phase processing, callback
  identity validation, and render records are active elsewhere and should not
  be preempted here.

React 19.2.6 source checks:

- `ReactFiberRootScheduler.js` keeps the scheduled-root list and scheduler
  module state at lines 99-114, adds roots and schedules a microtask in
  `ensureRootIsScheduled` at lines 116-169, and flushes all sync roots through
  `flushSyncWorkAcrossRoots_impl` at lines 185-247.
- `processRootScheduleInMicrotask` resets microtask flags, recomputes each
  root, removes roots only in that microtask, and flushes sync work at the end
  at lines 259-345.
- `scheduleTaskForRootDuringMicrotask` marks starved lanes, recomputes lanes,
  cancels no-work/pending-commit roots, bypasses Scheduler for sync lanes,
  reuses equal-priority callback nodes, and maps non-sync lanes to Scheduler
  priority at lines 384-506.
- `performWorkOnRootViaSchedulerTask` preflushes passive effects, recomputes
  lanes, enters the work loop, reschedules at task end, and returns a
  continuation only when `root.callbackNode` still equals the original node at
  lines 513-606.
- `performSyncWorkOnRoot`, `fakeActCallbackNode`, act-routed callback
  scheduling/cancellation, act-routed root-schedule tasks, and render/commit
  microtask fallback are at lines 608-686.
- `ReactAct.js` uses `ReactSharedInternals.actQueue` as the renderer task
  capture signal at lines 32-50, flushes sync and async queues at lines
  141-187 and 271-307, and protects queue draining with an `isFlushing` guard,
  continuation following, suspension preservation, and error aggregation at
  lines 310-349.
- `ReactFiberWorkLoop.js` shows `flushSyncFromReconciler` owns the discrete
  update-priority scope and calls `flushSyncWorkOnAllRoots` only outside
  render/commit at lines 1815-1851. `flushSyncWork` returns whether it was
  called during render/commit at lines 1857-1863.
- `ReactDOMRoot.js` keeps public root validation/warnings/container marking in
  React DOM, but calls reconciler `updateContainer`, `updateContainerSync`, and
  `flushSyncWork` for root work.
- `ReactTestRenderer.js` keeps serialization and public wrapper behavior in
  test renderer, but root create/update/unmount call shared reconciler
  `createContainer` and `updateContainer`; `act` is exported from `React.act`.

Local source checks:

- `root_scheduler.rs` lines 21-104 contain the scheduler state already needed
  by future sync and act work.
- `root_scheduler.rs` lines 285-320 append/dedupe roots and request a
  root-schedule microtask.
- `root_scheduler.rs` lines 323-374 process the root schedule but do not flush
  sync work at the end.
- `root_scheduler.rs` lines 377-462 schedule/cancel/reuse callback records but
  have no act exception for moving an existing Scheduler callback into an act
  queue.
- `root_scheduler.rs` lines 464-504 only collect a sync flush plan; no work
  is performed.
- `scheduler_bridge.rs` lines 1-5 explicitly separates the internal bridge
  from the public `scheduler` package.
- `scheduler_bridge.rs` lines 69-170 record callback nodes and cancellation,
  but do not model executable tasks or continuations.
- `lib.rs` lines 51-64 expose the root scheduler and bridge data types, so
  future slices should keep new internals narrow and avoid leaking public
  Scheduler task object shape.

Two read-only explorer agents were spawned for source cross-checks, but neither
returned before the report was ready; both were closed without file edits. The
findings above come from direct local inspection.

## Mergeable Source Slices

### Slice 1: Execution-Context Guards

Owner files:

- `crates/fast-react-reconciler/src/execution_context.rs` (new)
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-reconciler/src/test_support.rs`

Purpose:

- Add `ExecutionContext` flags for `NoContext`, `BatchedContext`,
  `RenderContext`, and `CommitContext`.
- Add render/commit enter/exit guards that restore prior context on normal
  return and panic/error paths.
- Add `is_already_rendering_or_committing` and
  `is_invalid_execution_context_for_event_function`.
- Add reconciler `flush_sync_work` facade that returns a structured
  "called during render/commit" result without flushing.
- Teach root-schedule microtask dispatch to fall back to an immediate scheduler
  callback when a host microtask fires during render/commit.

Tests:

- Guard enter/exit restores nested context.
- `flush_sync_work` outside render/commit delegates to the root scheduler.
- `flush_sync_work` inside render or commit returns the render/commit result
  and does not traverse roots.
- Root-schedule microtask during render/commit records an immediate bridge
  callback instead of calling `process_root_schedule_in_microtask`.

Boundary:

- No public warning text in Rust. React DOM/test-renderer facades can convert
  structured diagnostics into public DEV messages later.

### Slice 2: Cross-Root Sync Flushing

Dependency:

- Wait for worker 129's HostRoot render-phase entry points to merge. This
  slice should consume those entry points instead of inventing a parallel render
  path.

Owner files:

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs` if worker 129 adds it
- optional `crates/fast-react-reconciler/src/sync_flush.rs` if keeping the loop
  separate makes ownership clearer
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-reconciler/src/test_support.rs`

Purpose:

- Replace or extend `collect_sync_flush_plan` with
  `flush_sync_work_on_all_roots` and
  `flush_sync_work_across_roots_impl(sync_transition_lanes, only_legacy)`.
- Keep the existing `is_flushing_work` fast reentry guard and
  `might_have_pending_sync_work` fast exit.
- Traverse the scheduled-root list, not a caller-supplied root.
- Recompute lanes each pass using root lane state plus worker 129's
  work-in-progress render-lane state.
- Call `perform_sync_work_on_root(root, lanes)` for each sync root and repeat
  until a full pass performs no work.
- Keep root removal owned by `process_root_schedule_in_microtask`.
- Keep commit/current switching out of this slice unless a commit worker has
  already merged.

Tests:

- No pending sync work fast-exits.
- Reentrant sync flush fast-exits and clears no state.
- Two scheduled roots with sync lanes both invoke the work-loop hook.
- If the first sync root schedules more sync work on the second root, the loop
  repeats until a clean pass.
- Non-sync roots remain scheduled and are not flushed.
- Pending commit or unsupported prerender hooks fail closed and do not enter
  sync work.

Boundary:

- This is reconciler-internal. It should not implement React DOM `flushSync`
  callback shape, DOM container unmarking, test-renderer serialization, or
  public Scheduler task objects.

### Slice 3: Scheduler Bridge Render Tasks And Continuations

Owner files:

- `crates/fast-react-reconciler/src/scheduler_bridge.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-reconciler/src/test_support.rs`

Purpose:

- Extend callback records from inert schedule requests into an executable test
  model: callback node, root ID, scheduler priority, callback lane priority,
  `did_timeout`, cancellation, and optional continuation.
- Add `perform_work_on_root_via_scheduler_task(root, did_timeout)` once worker
  129 exposes callback identity validation and render-phase entry points.
- Preserve React's continuation rule: return a continuation only if the root's
  callback node still equals the original node after passive preflush,
  render-phase work, and rescheduling.
- Add `mark_starved_lanes_as_expired` into task selection before lane
  recomputation.

Tests:

- Equal callback priority returns the same callback node.
- Changed callback priority cancels stale node and schedules a replacement.
- A yielded work-loop hook returns a continuation only while callback identity
  is unchanged.
- Passive-effect preflush that changes callback identity suppresses the
  continuation.
- `did_timeout` reaches the work-loop hook but does not turn sync lanes into
  public Scheduler Immediate tasks.

Boundary:

- The internal `SchedulerPriority` names may mirror Scheduler priority names,
  but the bridge must not expose JS Scheduler task shape, heap behavior,
  `unstable_mock`, or public cancellation tombstones.

### Slice 4: Act Queue Routing And Fake Callback Nodes

Owner files:

- `crates/fast-react-reconciler/src/act.rs` (new)
- `crates/fast-react-reconciler/src/scheduler_bridge.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-reconciler/src/test_support.rs`

Purpose:

- Add an internal `ActQueueState` with absent/present queue, nested depth,
  flush guard, queued renderer tasks, and recorded thrown errors.
- Add a typed fake act callback node sentinel. Do not overload raw handle `0`
  because `NONE` already means no callback.
- Route root-schedule tasks into the act queue when an act queue is present,
  using `did_schedule_microtask_act` separately from normal microtask dedupe.
- Route non-sync render callbacks into the act queue when present and store the
  fake callback node on the root.
- When an act queue appears and an equal-priority real Scheduler callback is
  already stored, cancel the real callback and reschedule the task into act.
- Make cancellation of the fake callback node a no-op.
- Flush act tasks with `did_timeout = false`, follow continuations, preserve
  remaining tasks when simulated suspension/promise use asks to yield, preserve
  remaining tasks on errors, and aggregate thrown errors.

Tests:

- Normal root-schedule microtask requests still use the scheduler bridge.
- Inside act, root-schedule tasks enter the act queue and normal microtask
  dedupe remains independent.
- Inside act, non-sync root callbacks enter act and return the fake node.
- Cancelling fake callback nodes records no scheduler cancellation.
- A real callback node is cancelled and moved into act when the act queue is
  installed.
- Act continuation flushing does not consult host `should_yield`.
- Errors and simulated suspension leave the correct remaining task queue.

Boundary:

- This is the renderer scheduler routing hook. Public `React.act` thenable
  behavior, unawaited warnings, and `react-dom/test-utils.act` deprecation
  text stay in JS package facades.

### Slice 5: Public Facade Call Points

Dependency:

- Do not wire public React DOM or test-renderer roots until the reconciler has
  real HostRoot render work, sync flushing, and at least the minimal commit
  path needed for observable root behavior.

React DOM owner files:

- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/client.js`
- future source files under `packages/react-dom/src/` if package structure is
  introduced

React DOM call pattern:

- `createRoot` validates and marks the DOM container, creates a reconciler
  concurrent root, installs delegated root listeners, and returns the public
  root object.
- `root.render(children)` calls reconciler `update_container`, then
  `ensure_root_is_scheduled`; it returns `undefined` and owns public argument
  warnings.
- `root.unmount()` clears `_internalRoot` before scheduling, calls
  `update_container_sync(null, root, null, null)`, calls shared
  `flush_sync_work`, and unmarks the container only after the flush returns.
- `flushSync(fn)` owns callback return/throw behavior, clears current
  transition, sets a lane-backed discrete update-priority scope, restores both
  in `finally`, then calls reconciler `flush_sync_work` and emits the public
  DEV warning if it reports render/commit reentry.
- `unstable_batchedUpdates` remains a batching scope, not a sync flush alias.

React/test-renderer owner files:

- `packages/react/index.js`
- `packages/react-dom/test-utils.js`
- future `packages/react-test-renderer/*` if the package is added
- `crates/fast-react-test-renderer/src/*` for the native in-memory host root
  layer

React/test-renderer call pattern:

- `React.act` owns public thenable shape, nested scope tracking, unawaited
  warnings, thrown/rejected callback behavior, and connection to
  `ReactSharedInternals.actQueue`.
- `react-dom/test-utils.act` remains a public wrapper around `React.act`; it
  does not flush roots itself.
- Test-renderer `create`, `update`, and `unmount` call shared reconciler
  `create_container`/`update_container` APIs. Serialization and `TestInstance`
  wrappers stay in test renderer.
- Test-renderer `unstable_flushSync` calls the shared reconciler flush boundary
  after entering the correct priority scope, but only after a public oracle
  proves the exact behavior.

Boundary:

- Public facades own public object shape, argument validation, warnings,
  package exports, container markers/listeners, serialization, and callback
  lifetimes.
- Reconciler owns lanes, scheduled-root list, callback node identity, sync
  flushing, execution context, work-loop entry points, and act task routing.
- Public Scheduler package compatibility remains isolated in `packages/scheduler`.

## Suggested Order

1. Wait for worker 129 to merge, then re-read its actual `root_work_loop` and
   callback identity APIs.
2. Land execution-context guards because they unblock both sync flushing and
   facade diagnostics without requiring commit behavior.
3. Land scheduler bridge executable task/continuation support if worker 129
   has the render callback identity hook ready.
4. Land cross-root sync flushing against the worker 129 render-phase hook,
   still below commit/current switching if commit is not merged.
5. Land act queue routing plus fake callback node support in the internal
   scheduler.
6. Wire React DOM/test-renderer public call points only after minimal commit
   and host behavior make observable root updates meaningful.

## Risks Or Blockers

- Worker 129 may change `root_scheduler.rs`, `fiber_root.rs`, or add
  `root_work_loop.rs`; future sync/act workers should start from accepted
  worker 129 code to avoid conflicts.
- Current scheduler lane selection uses `highest_priority_pending_lanes` plus
  entanglement. React's full `getNextLanes`, pending commit, suspended data,
  passive-effect lane, prerender, and sync-transition-lane behavior still need
  typed hooks before compatibility claims.
- There is no commit path in this worktree. Cross-root sync flushing can be
  made testable against render-phase hooks, but public React DOM/test-renderer
  behavior needs commit/current switching and host mutation before wiring.
- `scheduler_bridge.rs` records data only. Executable Rust test tasks are fine,
  but JS callbacks crossing the native boundary will need explicit handle
  rooting, disposal, and thread-affinity rules.
- Public `React.act` and react-test-renderer act details should be checked
  against merged oracles before user-visible warnings or thenable behavior are
  claimed.
- `packages/react-test-renderer` is absent locally, so test-renderer public
  wiring remains a future package/source-layout decision.

## Recommended Next Tasks

1. After worker 129 merges, run a small refresh that maps its actual
   render-phase APIs to `perform_work_on_root_via_scheduler_task` and
   `perform_sync_work_on_root`.
2. Implement execution-context guards with structured diagnostics in the
   reconciler.
3. Replace `collect_sync_flush_plan` with a guarded cross-root sync flush loop
   that can call the accepted HostRoot render-phase hook and repeat on newly
   scheduled sync work.
4. Add internal act queue routing and fake callback-node support before any
   public `React.act` or test-renderer root facade wiring.
5. Keep React DOM `flushSync`, root unmount, `react-dom/test-utils.act`, and
   future test-renderer `unstable_flushSync` as facade-only call sites into
   shared reconciler APIs.

## Changed Files

- `worker-progress/worker-131-sync-flush-act-refresh.md`

## Commands Run

Tool actions:

- `create_goal`
- `get_goal`
- spawned two read-only explorer agents; both were closed after timing out
  without returned findings

Shell commands:

```sh
sed -n '1,240p' WORKER_BRIEF.md
git status --short
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,560p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,980p' worker-progress/worker-111-reconciler-sync-flush-act-plan.md
sed -n '1,360p' worker-progress/worker-128-reconciler-root-scheduler-foundation.md
sed -n '1,320p' docs/tasks/worker-129-host-root-render-phase-foundation.prompt.md
rg --files crates/fast-react-reconciler/src | sort
rg -n "firstScheduledRoot|lastScheduledRoot|didScheduleMicrotask|didScheduleMicrotask_act|mightHavePendingSyncWork|isFlushingWork|currentEventTransitionLane|fakeActCallbackNode|ensureRootIsScheduled|processRootScheduleInMicrotask|scheduleTaskForRootDuringMicrotask|flushSyncWork|flushSyncWorkAcrossRoots|performWorkOnRootViaSchedulerTask|executionContext|RenderContext|CommitContext|actQueue|queueMacrotask|recursivelyFlushAsyncActWork|flushActQueue" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js /Users/user/Developer/Developer/react-reference/packages/react/src/ReactAct.js
sed -n '1,920p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,360p' crates/fast-react-reconciler/src/scheduler_bridge.rs
sed -n '1,520p' crates/fast-react-reconciler/src/root_updates.rs
sed -n '1,760p' crates/fast-react-reconciler/src/fiber_root.rs
sed -n '1,340p' crates/fast-react-reconciler/src/work_in_progress.rs
sed -n '1,340p' crates/fast-react-reconciler/src/update_priority.rs
sed -n '1,360p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,260p' packages/react-dom/index.js
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,240p' packages/react-dom/test-utils.js
sed -n '1,260p' packages/react/index.js
find packages -maxdepth 2 -type f | sort
sed -n '90,740p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js
sed -n '1,390p' /Users/user/Developer/Developer/react-reference/packages/react/src/ReactAct.js
sed -n '1,180p' /Users/user/Developer/Developer/react-reference/packages/react-dom/src/shared/ReactDOMFlushSync.js
sed -n '1,620p' /Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMRoot.js
sed -n '1,780p' /Users/user/Developer/Developer/react-reference/packages/react-test-renderer/src/ReactTestRenderer.js
sed -n '340,420p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberReconciler.js
sed -n '400,430p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js
sed -n '1800,1885p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js | sed -n '99,686p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react/src/ReactAct.js | sed -n '28,352p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '1808,1875p'
nl -ba crates/fast-react-reconciler/src/root_scheduler.rs | sed -n '1,620p'
nl -ba crates/fast-react-reconciler/src/scheduler_bridge.rs | sed -n '1,180p'
nl -ba crates/fast-react-reconciler/src/lib.rs | sed -n '1,95p'
nl -ba crates/fast-react-core/src/root_lanes.rs | sed -n '130,430p'
```

Verification commands:

```sh
git diff --check
git status --short --untracked-files=all
git diff --check --no-index /dev/null worker-progress/worker-131-sync-flush-act-refresh.md; status=$?; if [ "$status" -eq 0 ] || [ "$status" -eq 1 ]; then exit 0; else exit "$status"; fi
git diff --check --no-index /dev/null worker-progress/worker-131-sync-flush-act-refresh.md; diff_status=$?; if [ "$diff_status" -eq 0 ] || [ "$diff_status" -eq 1 ]; then exit 0; else exit "$diff_status"; fi
allowed='worker-progress/worker-131-sync-flush-act-refresh.md'
files=$( { git diff --name-only; git ls-files --others --exclude-standard; } | grep -v '^\.worker-logs/' | sed '/^$/d' )
printf '%s\n' "$files"
bad=$(printf '%s\n' "$files" | grep -vx "$allowed" || true)
test -z "$bad"
```

Verification results:

- `git diff --check` passed with no output.
- `git status --short --untracked-files=all` showed
  `.worker-logs/worker-131-sync-flush-act-refresh.log` and this report. The
  worker log path is generated session output and was excluded from the scoped
  source/report audit.
- The first no-index whitespace check used `status` as a shell variable and
  failed because the active shell treats it as read-only. It was rerun with
  `diff_status` and passed with no whitespace errors for the untracked report.
- The scoped changed-path check, excluding `.worker-logs/`, printed only
  `worker-progress/worker-131-sync-flush-act-refresh.md` and passed.
- After appending verification details, final reruns of `git diff --check`,
  the no-index whitespace check, `git status --short --untracked-files=all`,
  and the scoped changed-path check produced the same clean result: only the
  report file is changed after excluding `.worker-logs/`.
