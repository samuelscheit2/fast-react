# worker-081-reconciler-root-scheduler-act-plan

## Objective

Produce a report-only implementation plan for root scheduling, cross-root sync
flushing, and act queue routing.

Write scope honored: this worker changes only
`worker-progress/worker-081-reconciler-root-scheduler-act-plan.md`. No source
code was implemented.

## Summary

Fast React should implement root scheduling as a reconciler subsystem, not as a
thin wrapper around the public `scheduler` package and not as a per-root render
shortcut. React 19.2.6 keeps a global scheduled-root list, schedules one
root-schedule microtask per event, recomputes each root's next lanes inside that
microtask, flushes sync work across all scheduled roots at the end, and only
uses Scheduler callbacks for non-sync work. That split is the root cause:
lanes decide what work is eligible; Scheduler decides when asynchronous
callbacks run.

The first Fast React root scheduler should therefore add a deterministic Rust
bridge around host microtasks and scheduler callbacks, explicit per-root
callback node/priority state, cross-root sync flushing, continuation handling,
render/commit reentrancy guards, and a DEV-only act queue routing path. Public
`packages/scheduler` behavior must remain a separate JS package compatibility
surface; the reconciler can share concepts and priority names, but it should
not expose public Scheduler task objects or rely on `scheduler/unstable_mock`
as its internal test harness.

## Current Local State

- `fast-react-core` exposes React 19.2.6 lane bitsets and `LaneMap<T>`, but no
  root lane bookkeeping, event priority type, or root scheduler state.
- `fast-react-host-config` already has `HostScheduling` hooks for timeouts,
  microtasks, update priority, post-paint callbacks, and commit suspension. It
  also has host fiber token plumbing. Its `EventPriority` remains host-owned,
  and current test hosts still bind it to `()`.
- `fast-react-reconciler` is still a placeholder. It validates the mutation
  host boundary and exposes `scheduler::schedule_update_placeholder`, but it has
  no `FiberRoot`, HostRoot update queue, root scheduler, work loop, act routing,
  or sync flush implementation.
- `packages/scheduler` root CJS files implement public `scheduler@0.27.0`
  root behavior. Mock, post-task, and native scheduler entrypoints remain
  separate surfaces with their own oracle or implementation tracks.
- The conformance suite already has public Scheduler root/mock/native/post-task
  oracles and a React DOM `flushSync`/`unstable_batchedUpdates` oracle. Those
  are evidence for package behavior, not a substitute for reconciler scheduler
  unit tests.

## Evidence Gathered

Required reports:

- Worker 007 establishes the two scheduling layers: public Scheduler heaps and
  root scheduling over lanes. It also records that sync lanes bypass Scheduler,
  non-sync lanes map through `lanesToEventPriority`, callbacks may return
  continuations, and public Scheduler behavior is directly observable.
- Worker 041 keeps public Scheduler priority constants separate from internal
  lane-backed event priorities, and ties DOM event priority to reconciler lane
  selection rather than package Scheduler values.
- Worker 044 documents the client-root contract: `root.render` and
  `root.unmount` enqueue HostRoot updates; `flushSyncWork` must flush sync work
  across roots with render/commit reentrancy detection.
- Worker 055 sequences client roots after root lane bookkeeping, HostRoot update
  queues, root scheduling, cross-root sync flushing, and DOM listener/marker
  integration.
- Worker 072 outlines the root work loop and calls out the exact root scheduler
  slice: scheduled-root list, microtasks, stale callback cancellation, callback
  priority reuse, sync flushing, passive-effect preflush, and reentrancy guards.
- Worker 073 shows test renderer has the same dependency on shared root
  scheduling and act routing. Test renderer updates must call shared
  `updateContainer` semantics, not mutate host storage directly.

Primary React 19.2.6 source checks:

- `ReactFiberRootScheduler.js` keeps `firstScheduledRoot`, `lastScheduledRoot`,
  `didScheduleMicrotask`, `didScheduleMicrotask_act`,
  `mightHavePendingSyncWork`, `isFlushingWork`, and
  `currentEventTransitionLane` as scheduler module state.
- `ensureRootIsScheduled(root)` adds a root to the linked list, marks possible
  sync work, and schedules a root-schedule microtask. Actual task selection is
  deferred to `scheduleTaskForRootDuringMicrotask`.
- `processRootScheduleInMicrotask()` is the only place that removes roots from
  the root list. It recomputes every root, cancels or schedules callbacks, then
  flushes sync work across roots at the end of the microtask.
- `scheduleTaskForRootDuringMicrotask(root, now)` marks starved lanes expired,
  recomputes next lanes, cancels stale callbacks, bypasses Scheduler for sync
  lanes, reuses equal-priority callbacks, maps lanes to Scheduler priority for
  non-sync work, and reschedules Scheduler tasks onto act when needed.
- `performWorkOnRootViaSchedulerTask(root, didTimeout)` flushes pending passive
  effects before rendering, recomputes lanes because Scheduler can batch
  callbacks before microtasks run, calls `performWorkOnRoot`, then returns a
  continuation only if the root still points at the same callback node.
- `flushSyncWorkAcrossRoots_impl` guards against reentry with `isFlushingWork`,
  fast-exits when no sync work is possible, loops over all scheduled roots, and
  repeats until no root performed sync work.
- `ReactAct.js` owns `ReactSharedInternals.actQueue`, nested act scope depth,
  thrown-error aggregation, async act recursion, a flush guard, and continuation
  flushing by repeatedly calling renderer tasks with `didTimeout = false`.

## Root-Cause Invariants

### Root scheduling is a global list

Each `FiberRoot` needs a `next` scheduling link plus `callback_node` and
`callback_priority`. A root can be added to the schedule whenever it receives
an update, but it should only be removed during root-schedule microtask
processing. Removing roots elsewhere invites reentrancy bugs because renders,
commits, passive effects, pings, and act flushing can all schedule more work.

Fast React should model this as an explicit scheduler-owned root list, with
stable root IDs or arena handles rather than borrowing roots through a callback
closure. Optimizing for the single-root case is fine, but multi-root behavior
is correctness-critical because public `flushSync` and `root.unmount` flush
sync work across roots.

### Microtasks schedule root selection, not render work directly

The root-schedule microtask should recompute lane priority and callback state.
It should not run normal asynchronous render work itself. Sync work is the
special case: sync lanes are flushed at the end of the root-schedule microtask
and do not receive a Scheduler task.

The host microtask hook should be supplied through the host/scheduler bridge.
If a microtask fires during render or commit, Fast React needs the React-style
fallback: defer root-schedule processing through an immediate Scheduler task
instead of reentering the work loop.

### Lanes own eligibility; Scheduler owns transport

Root scheduling must call root lane bookkeeping (`get_next_lanes`,
`get_next_lanes_to_flush_sync`, expiration, suspension, ping, pending commit,
and WIP stickiness) before it decides whether Scheduler is involved. Public
Scheduler priority values should appear only at the bridge boundary for
non-sync callbacks:

- discrete or continuous event priority maps to UserBlocking Scheduler priority;
- default event priority maps to Normal Scheduler priority;
- idle event priority maps to Idle Scheduler priority;
- sync work is flushed by the root scheduler and should not be represented as a
  public Immediate Scheduler task in the normal root path.

The public `packages/scheduler` implementation remains the compatibility owner
for JS-observable task object shape, heaps, cancellation tombstones, priority
context, delayed tasks, `unstable_shouldYield`, and `unstable_mock`.

### Callback reuse and cancellation are semantic

Each root stores the currently scheduled callback node and the lane priority it
represents. If the next highest-priority lane matches the existing callback
priority, the root scheduler should reuse the callback. If the priority changes
or the root has no work, the old callback must be cancelled. Sync work also
cancels any existing async callback because sync work flushes at microtask end.

There is one DEV act exception: when an act queue exists and a root currently
has a real Scheduler callback, equal-priority reuse is not enough. The existing
Scheduler callback must be cancelled and rescheduled into the act queue so test
work is captured by `act`.

### Continuations preserve callback identity

Scheduler callbacks can return a continuation. React keeps the same callback
node alive when a root yields and still owns the same scheduled task. Fast
React's bridge should model a `RenderTask` as a function that accepts
`did_timeout` and returns either `None` or a continuation task.

After `perform_work_on_root`, the scheduler should call the same lane selection
routine used by the microtask path. If the root's callback node is still the
same original node, return a continuation for that same root. If passive
effects, lane changes, sync work, cancellation, or another update replaced the
callback node, return no continuation and let normal scheduling own the next
task.

### Sync flushing is cross-root and guarded

`flush_sync_work_on_all_roots` should delegate to one internal cross-root
flusher. It must:

- return immediately if already flushing;
- return immediately if the scheduler knows no sync work is possible;
- iterate every scheduled root, not only the caller's root;
- use `get_next_lanes_to_flush_sync` when flushing selected transition lanes;
- otherwise use `get_next_lanes` and flush roots whose next lanes include sync
  or gesture-sync work and are not prerendering;
- call `perform_sync_work_on_root` and repeat until a full pass performs no
  work.

This behavior is required for `flushSync`, root unmount, passive effects that
schedule sync updates, layout work scheduled during commit, and multi-root
apps.

### Reentrancy is explicit state

The root scheduler needs two layers of reentrancy protection:

- work-loop execution context: render and commit contexts prevent starting work
  while work is already running, control `flushSyncWork` return values, and
  force microtask fallback when needed;
- scheduler flush state: `is_flushing_work` prevents nested cross-root sync
  flush recursion even when callers already check execution context.

The act queue also needs its own flush guard so a task that schedules more act
work does not recursively drain the queue and corrupt the remaining task order.

### Act routing is a scheduler concern

In DEV, the reconciler scheduler should consult a shared act queue abstraction
before scheduling both root-schedule microtasks and non-sync render callbacks.
When an act queue is present:

- root-schedule "microtasks" are pushed into the act queue and deduped with a
  separate `did_schedule_microtask_act` flag;
- non-sync render tasks are pushed into the act queue instead of the host
  Scheduler and return a fake callback node;
- cancelling the fake act callback node is a no-op;
- if a root already has a real Scheduler callback and an act queue appears, the
  real callback is cancelled and an act task is scheduled;
- act queue flushing runs renderer tasks with `did_timeout = false`, repeatedly
  follows continuations, preserves remaining tasks on error or suspension, and
  aggregates thrown errors.

The public React `act` API lives in the JS React/test-utils layer, but the
renderer scheduler must provide the task routing hook. Implementing `act` as a
test-renderer-only synchronous flush helper would miss root scheduling,
continuations, passive effects, and not-wrapped-in-act diagnostics.

## Implementation Plan

### 1. Scheduler bridge and task model

Add a reconciler-internal bridge module, likely
`crates/fast-react-reconciler/src/scheduler_bridge.rs`, before root scheduling
logic grows direct dependencies on JS package code.

Recommended types:

- `SchedulerPriority`: internal enum or newtype with Immediate, UserBlocking,
  Normal, Low, and Idle. It mirrors public Scheduler priority names but is not
  the public JS task object API.
- `SchedulerCallbackNode`: opaque handle returned by the bridge. Real
  implementations can wrap Scheduler task handles; tests can use deterministic
  IDs.
- `RenderTask`: callable task equivalent to React's `boolean =>
  RenderTask | null`.
- `SchedulerBridge`: `now`, `schedule_callback`, `cancel_callback`, and
  `should_yield` hooks.
- `RootMicrotaskQueue`: host-backed `schedule_microtask` hook, with test
  control over when microtasks run.

This module should not implement `scheduler@0.27.0` exports. It should be a
small internal seam that lets unit tests replace time, callback transport, and
yielding without pulling in public package behavior.

### 2. Act queue bridge

Add `crates/fast-react-reconciler/src/act.rs` as a DEV-capable abstraction
over renderer tasks. The JS binding can later connect this to
`ReactSharedInternals.actQueue`; Rust tests can use a fake queue.

Recommended shape:

- `ActQueueState`: absent or present queue plus task vector.
- `FakeActCallbackNode`: distinct callback-node sentinel.
- `push_root_schedule_task(task)` for microtask-equivalent root schedule work.
- `push_render_task(task)` for non-sync root render callbacks.
- `cancel_fake_callback_node(node)` as a no-op only for the sentinel.
- `flush_act_queue()` test helper that runs tasks with `did_timeout = false`,
  follows continuations, stops and preserves remaining tasks when a simulated
  promise-use/suspension flag asks to yield, and preserves remaining work when a
  task throws.

Keep not-wrapped-in-act diagnostics as hooks, not as hard-coded console calls
inside the scheduler. The JS/test-renderer facade can own public warning text
once the public act oracle lands.

### 3. Root scheduler state

Add `crates/fast-react-reconciler/src/root_scheduler.rs` after `FiberRoot` and
HostRoot update queues exist.

Scheduler module state should include:

- first and last scheduled root handles;
- `did_schedule_microtask`;
- `did_schedule_microtask_act` for DEV act scopes;
- `might_have_pending_sync_work`;
- `is_flushing_work`;
- `current_event_transition_lane`;
- accessors for root callback node, callback priority, `next`, pending commit,
  timeout handle, and pending passive effect lanes.

This state can be owned by a `RootScheduler` struct instead of true globals, as
long as all roots for one renderer runtime share the same scheduler instance.
That makes Rust tests deterministic and avoids hidden process-wide state before
the JS runtime boundary is defined.

### 4. `ensure_root_is_scheduled`

Implement `ensure_root_is_scheduled(root)` with the React order:

1. Add the root to the scheduled-root list if it is not already last and its
   `next` link is null.
2. Mark `might_have_pending_sync_work = true`.
3. Call `ensure_schedule_is_scheduled`.
4. In DEV legacy mode later, record `didScheduleLegacyUpdate` for legacy act
   compatibility. The first concurrent-root slice can expose the hook without
   claiming legacy mode.

This function should not compute lanes or schedule Scheduler callbacks
directly. Deferring that work to the microtask is what lets multiple updates in
one event coalesce and lets transition lane caching reset at the right time.

### 5. Root-schedule microtask processing

Implement `ensure_schedule_is_scheduled` and
`process_root_schedule_in_microtask`.

`ensure_schedule_is_scheduled` should:

- route to the act queue and dedupe with `did_schedule_microtask_act` when an
  act queue exists;
- otherwise schedule exactly one host microtask per event using
  `did_schedule_microtask`.

`process_root_schedule_in_microtask` should:

- reset the relevant microtask flags;
- reset `might_have_pending_sync_work` before scanning roots;
- compute sync transition lanes from `current_event_transition_lane` and host
  `should_attempt_eager_transition`;
- iterate the scheduled-root list, call `schedule_task_for_root_during_microtask`,
  remove roots with no work, and keep roots with work;
- set `might_have_pending_sync_work` if any retained root might have sync work;
- flush sync work across roots at the end unless pending commit effects block
  it;
- reset `current_event_transition_lane` at event end.

Root removal should happen only here.

### 6. `schedule_task_for_root_during_microtask`

Implement the task selection routine as a pure, testable decision path over
root lane state and callback state.

Required behavior:

- call `mark_starved_lanes_as_expired(root, now)`;
- choose pending passive-effect lanes when the React-compatible
  yielding-before-passive path applies, otherwise call `get_next_lanes`;
- treat no lanes, suspended data render, or pending commit cancellation as no
  schedulable work; cancel existing callbacks and clear root callback state;
- for sync lanes that are not prerendering, cancel existing callbacks, store
  sync callback priority, clear callback node, and return sync priority;
- for non-sync lanes, compare `get_highest_priority_lane(next_lanes)` to the
  stored callback priority;
- reuse the existing callback only when priority is unchanged and act does not
  require moving the task from Scheduler to the act queue;
- cancel stale callback nodes before scheduling replacements;
- map `lanes_to_event_priority(next_lanes)` to internal Scheduler priority and
  call the bridge with `perform_work_on_root_via_scheduler_task(root)`;
- store the returned callback node and lane priority on the root.

The function should never call `perform_work_on_root` directly.

### 7. Scheduled callback entry point

Implement `perform_work_on_root_via_scheduler_task(root, did_timeout)`.

Required behavior:

- if an async commit is pending, clear callback state and return no
  continuation;
- flush delayed/pending passive effects before lane recomputation;
- if passive effects changed the root callback node, return no continuation;
- recompute lanes from current root state, WIP render lanes, and pending commit
  state;
- return no continuation if there are no lanes;
- call `perform_work_on_root(root, lanes, force_sync)` where `force_sync` comes
  from `did_timeout` only through the React-compatible feature flag path;
- call `schedule_task_for_root_during_microtask(root, now)` at the end of the
  Scheduler task;
- return a continuation only if the root callback node is non-null and still
  equals the original callback node.

This routine should be unit-tested without a real fiber render loop by injecting
a fake `perform_work_on_root` hook that records lanes, changes root state, and
simulates yields.

### 8. Cross-root sync flushing

Implement:

- `flush_sync_work_on_all_roots()`;
- `flush_sync_work_on_legacy_roots_only()` as a stubbed or feature-gated path
  if legacy roots remain out of initial scope;
- `flush_sync_work_across_roots_impl(sync_transition_lanes, only_legacy)`;
- `perform_sync_work_on_root(root, lanes)`;
- public reconciler `flush_sync_work()` that returns whether it was called
  during render or commit.

The implementation should loop over the scheduled-root list until no sync work
is performed. `perform_sync_work_on_root` should flush pending passive effects
first and return to the outer loop when passive effects schedule more work, so
lanes are recomputed before rendering.

`root.unmount` and React DOM `flushSync` should eventually call this shared
boundary. Do not add a per-root sync flush shortcut.

### 9. Reentrancy and execution context

Root scheduling needs a shared execution-context model before it can safely
flush work:

- `NoContext`, `BatchedContext`, `RenderContext`, and `CommitContext`;
- `is_already_rendering`;
- `is_invalid_execution_context_for_event_function`;
- render and commit context enter/exit guards;
- `flush_sync_work` that flushes only outside render/commit and otherwise
  reports that React is already working;
- microtask callback fallback to an immediate Scheduler task when it fires
  during render/commit.

These guards should live with the work loop, but root scheduler tests can use a
minimal fake execution context before the full render loop exists.

### 10. Transition lane cache hook

Root scheduler owns `current_event_transition_lane` because React resets it at
the end of root-schedule microtask processing. The implementation should add
`request_transition_lane(transition)` in the scheduler/root lane layer, using
action-scope lane reuse and transition-lane claiming from root lane
bookkeeping. It should remain independent from source-only default transition
indicator behavior until that feature has its own oracle.

## Fake Scheduler Test Strategy

Use a deterministic fake scheduler for Rust unit tests. It should not reuse
`scheduler/unstable_mock`; that package is a JS public API surface with its own
oracle.

Fake scheduler capabilities:

- monotonically controlled `now`;
- `schedule_callback(priority, task)` returns a stable callback-node ID and
  records priority, task, cancellation state, and insertion order;
- `cancel_callback(node)` marks the node cancelled and records the cancellation;
- `flush_next(did_timeout)` invokes one non-cancelled task and stores returned
  continuations on the same node;
- `flush_all()` drains eligible work in deterministic priority/order;
- `should_yield` can be scripted to force concurrent render yields;
- a separate fake microtask queue records root-schedule microtasks and lets
  tests drain them manually.

Required unit tests:

- root is inserted once, deduped, and removed only by microtask processing;
- multiple root updates in one event schedule one root-schedule microtask;
- sync lanes cancel async callbacks and flush at microtask end without a
  Scheduler callback;
- cross-root sync flush visits all scheduled roots and repeats when work
  schedules more sync work;
- non-sync lanes map to UserBlocking, Normal, and Idle bridge priorities;
- equal callback priority reuses the callback node;
- lane priority changes cancel the stale callback and schedule a replacement;
- pending commit or no lanes cancels and clears root callback state;
- passive effect preflush can cancel the current task and suppress rendering;
- Scheduler task continuations are returned only when the callback node remains
  unchanged;
- microtask firing during render/commit falls back to an immediate Scheduler
  task instead of reentering.

## Fake Act Queue Test Strategy

Add a fake act queue that is independent from the fake scheduler and can be
installed or removed around scheduler calls.

Fake act queue capabilities:

- records root-schedule tasks and render tasks separately from real Scheduler
  tasks;
- returns/recognizes a fake callback node sentinel;
- flushes tasks with `did_timeout = false`;
- repeatedly follows continuations;
- can simulate a promise-use/suspension flag so flushing stops and preserves
  the current task plus remaining tasks;
- aggregates thrown errors and preserves unflushed tasks after errors;
- exposes nested scope depth and overlap diagnostics as test state.

Required unit tests:

- `ensure_schedule_is_scheduled` pushes root-schedule work into act and uses
  `did_schedule_microtask_act` dedupe separately from normal microtasks;
- non-sync root callbacks inside act are pushed to act and return the fake
  callback node;
- cancelling the fake node is a no-op;
- an already scheduled real Scheduler callback is cancelled and rescheduled
  into act when an act queue is present;
- callback continuations flush in act without consulting host `should_yield`;
- suspended/promise-use simulation preserves remaining act tasks for async act
  recursion;
- errors thrown by act tasks are aggregated and leave later tasks queued;
- not-wrapped-in-act diagnostics hooks fire only when the act queue is absent
  in an act-enabled test environment.

## Public Scheduler Separation

The reconciler scheduler should not export JS Scheduler APIs, public task
objects, or `unstable_mock` helpers. It should use an internal bridge with
callback-node handles. Public scheduler package work remains responsible for:

- exact priority constant values;
- task/timer heap ordering;
- task object shape and descriptors;
- delayed callbacks and cancellation tombstones;
- public priority context APIs;
- `unstable_shouldYield`, `requestPaint`, `forceFrameRate`, and host transport;
- root, mock, post-task, and native package entrypoint behavior.

Reconciler root scheduler tests can compare conceptual behavior to the public
Scheduler oracles, but they should assert internal root invariants directly
with fake scheduler and fake act queue hooks.

## Recommended Next Tasks

1. Implement core `EventPriority` and root lane bookkeeping if active workers
   have not already merged them.
2. Implement `FiberRoot`, HostRoot fiber records, and HostRoot update queues
   before this scheduler slice. Root scheduling needs `next`, `callback_node`,
   `callback_priority`, lane state, pending commit state, and update enqueue
   hooks.
3. Add `scheduler_bridge.rs`, `act.rs`, and `root_scheduler.rs` in the
   reconciler with fake scheduler/fake act queue unit tests.
4. Add a minimal execution-context/work-loop shell so `flush_sync_work` can
   detect render/commit reentrancy and `perform_work_on_root_via_scheduler_task`
   can call an injectable work function.
5. Wire React DOM `flushSync`, root unmount, and test-renderer `act` only after
   shared cross-root sync flushing and act queue routing pass unit tests.
6. Keep `scheduler/unstable_mock` implementation and public Scheduler package
   compatibility in their existing package-level tracks.

## Risks Or Blockers

- Root scheduler implementation is blocked on `FiberRoot`, HostRoot update
  queues, root lane bookkeeping, and at least a work-loop shell.
- `HostScheduling::EventPriority` still being host-owned or `()` in test hosts
  can hide the lane-backed priority invariant. A breaking change to use a core
  event-priority type is likely needed before scheduler integration is sound.
- The act queue path is DEV-only in React but has major test behavior impact.
  Deferring it would make early root scheduler tests misleading.
- Callback handles crossing a JS/Rust boundary need explicit rooting and
  lifetime rules. The internal fake scheduler can use IDs, but real JS callbacks
  cannot be stored as raw Rust closures without a binding policy.
- The initial implementation should reserve legacy-root hooks without claiming
  legacy mode compatibility unless an oracle and root mode plan land first.
- Pending commit, passive effects, Suspense pings, default transition
  indicators, and commit suspension all interact with root scheduling. The
  first slice should fail closed or expose typed hooks where those subsystems
  are still absent.

## Commands Run

Tool actions:

- `create_goal` for the worker objective.
- Spawned two read-only explorer agents for independent checks of upstream
  scheduler/act semantics and local source/report consistency.

Read-only shell commands included:

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,620p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,760p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,360p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,820p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,360p' worker-progress/worker-073-test-renderer-update-model-plan.md
git status --short --untracked-files=all
rg --files crates packages tests worker-progress | sort
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,260p' crates/fast-react-core/src/lane.rs
sed -n '1120,1195p' crates/fast-react-host-config/src/lib.rs
sed -n '1,560p' packages/scheduler/cjs/scheduler.development.js
sed -n '1,240p' tests/conformance/src/scheduler-root-scenarios.mjs
sed -n '1,240p' tests/conformance/src/scheduler-mock-scenarios.mjs
sed -n '1,240p' tests/conformance/src/react-dom-flush-sync-batching-scenarios.mjs
sed -n '1,260p' worker-progress/worker-045-scheduler-root-implementation.md
sed -n '1,220p' worker-progress/worker-052-scheduler-mock-oracle.md
sed -n '1,240p' worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberRootScheduler.js
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberWorkLoop.js
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react/src/ReactAct.js
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react/src/ReactSharedInternalsClient.js
scoped local/temp path leak check over worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
git diff --check -- worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
```

No source tests were run because this worker is report-only.

## Changed Files

- `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md`

## Completion Checklist

- [x] Called `create_goal` for this worker task before research.
- [x] Read the required worker brief, master plan/progress, and required
  dependency reports.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Wrote only the assigned report file.
- [x] Covered scheduled-root lists, microtasks, callback reuse/cancellation,
  sync flushing, continuation handling, reentrancy guards, and act queue
  integration.
- [x] Kept public Scheduler package behavior separate from reconciler scheduler
  internals.
- [x] Included fake scheduler and fake act queue test strategy.
- [x] Used nested read-only agents to test hypotheses; their returned findings
  will be summarized if received before handoff.
- [x] Ran standard report-only scope checks.
