# worker-111-reconciler-sync-flush-act-plan

## Objective

Produce a report-only implementation plan for reconciler sync flushing and
`act` integration, including cross-root sync work flushing, render/commit
reentrancy guards, act queue routing, priority override boundaries, and how
React DOM/test-renderer facades should call the shared scheduler layer.

Write scope honored: this report is the only file changed. No source code,
tests, package metadata, or generated artifacts were implemented or modified.

Goal tooling status: `create_goal` was available and called before research,
file reads, implementation planning, or verification. `get_goal` was available
immediately afterward and returned status `active` for objective:
"Produce a report-only implementation plan for reconciler sync flushing and
`act` integration, including cross-root sync work flushing, render/commit
reentrancy guards, act queue routing, priority override boundaries, and how
React DOM/test-renderer facades should call the shared scheduler layer. Write
only worker-progress/worker-111-reconciler-sync-flush-act-plan.md, anchored in
specified merged worker reports/oracles, with delegated checks summarized and
no source implementation."

## Summary

Fast React should implement sync flushing and `act` as a shared reconciler root
scheduler subsystem. They should not be implemented as React DOM facade
shortcuts, test-renderer-only helpers, or direct calls into the public
`scheduler` package.

The root cause is cross-root ownership. React DOM `flushSync`,
`root.unmount()`, React public `act`, React DOM test-utils `act`, and future
test-renderer root APIs all need the same root list, lane selection,
HostRoot update queues, Scheduler callback routing, passive-effect preflush,
commit ordering, and render/commit reentrancy guards. A per-root sync flush or
facade-level callback wrapper would pass rootless callable-shape tests while
breaking multi-root sync updates, unmount cleanup reentrancy, Scheduler
continuations, and `act` queue capture.

The first implementation should therefore add reconciler-owned
`scheduler_bridge`, `execution_context`, `root_scheduler`, `sync_flush`, and
`act` modules after the FiberRoot and HostRoot update-queue prerequisites
exist. React DOM and test-renderer facades should call narrow shared
reconciler APIs: enqueue HostRoot updates, enter priority override scopes, call
cross-root `flush_sync_work`, and enter/leave `act` scopes. They should not
inspect lanes, maintain their own root queues, or mutate host containers
directly.

This plan intentionally stays below Suspense, transitions beyond the recorded
transition-lane/cache placeholders, real DOM event dispatch/plugin extraction,
hydration replay, and full test-renderer serialization.

## Current Local State

- `crates/fast-react-core/src/lane.rs` has React 19.2.6 lane constants,
  `Lane`, `Lanes`, `LaneIndex`, and `LaneMap<T>`.
- `crates/fast-react-reconciler/src/lib.rs` is placeholder-only: it validates
  mutation host capability and exposes `render_mutation_placeholder`,
  `render_placeholder`, and `scheduler::schedule_update_placeholder`. It has
  no FiberRoot, HostRoot update queue, root scheduler, work loop, sync queue,
  commit pipeline, execution context, or act queue.
- `crates/fast-react-host-config/src/lib.rs` has host scheduling hooks and
  token-aware host lifecycle signatures. `EventPriority` remains an associated
  host type, and local test hosts still use `()`, which is a known breaking
  boundary for lane-backed priority work.
- `crates/fast-react-test-renderer/src/lib.rs` is an in-memory mutation host
  and snapshot helper. It is not a reconciler root API and callers still drive
  host operations directly.
- `packages/react-dom/index.js`, `packages/react-dom/profiling.js`,
  `packages/react-dom/client.js`, and `packages/react-dom/test-utils.js` expose
  root, `flushSync`, batching, and `act` placeholders.
- `packages/react/index.js` exposes `React.act` as an unimplemented
  placeholder.
- `packages/scheduler/cjs/scheduler.development.js` and production root files
  implement the public `scheduler@0.27.0` root API. `scheduler/unstable_mock`
  remains placeholder-only in this worktree.
- `bindings/node/index.cjs` and `bindings/node/index.mjs` are native-load
  placeholders; no JS facade currently reaches Rust reconciler behavior.
- `packages/react-test-renderer` is absent locally.

## Evidence Anchors

Required merged anchors present in this worktree:

- Worker 007: React 19.2.6 has two scheduling layers. Root scheduling is
  lane-driven; public Scheduler uses task/timer heaps and continuations.
  Sync lanes bypass Scheduler tasks and flush through root scheduling.
- Worker 041: internal event/update priority is lane-backed and separate from
  public Scheduler numeric priorities. Discrete maps to `SyncLane`,
  continuous to `InputContinuousLane`, default to `DefaultLane`, and idle to
  `IdleLane`.
- Worker 044: React DOM roots enqueue HostRoot updates. `flushSync` changes DOM
  current update priority to discrete, clears transition state while the
  callback runs, restores both, then calls the renderer dispatcher to flush
  sync work. `root.unmount()` uses `updateContainerSync(null, root, null,
  null)`, then `flushSyncWork()`.
- Worker 055: client roots must be wired after root lane bookkeeping, HostRoot
  queues, root scheduling, cross-root sync flush, and DOM markers/listeners.
  Public roots must not directly mutate DOM.
- Worker 058: the checked React DOM `flushSync` /
  `unstable_batchedUpdates` oracle covers public export/callback/rootless
  behavior and public Scheduler priority observations. It does not prove DOM
  root commit timing, private update-priority override internals, or
  cross-root flushing.
- Worker 067: the checked `react-dom/test-utils.act` oracle covers the
  deprecated wrapper, descriptor behavior, sync/async callback return
  handling, thrown/rejected callback errors, thenable classification, and
  unawaited async warning evidence. It intentionally does not cover
  renderer-backed flushing.
- Worker 073: test-renderer `create`, `update`, and `unmount` must route
  through shared reconciler roots and `updateContainer`; `act` cannot be a
  renderer-local flush helper.
- Worker 080: HostRoot update queues must preserve circular pending queues,
  base queue rebasing, callbacks, `{element}` payload shape, SyncLane null
  unmount updates, and transition entanglement hooks.
- Worker 081: root scheduling needs a global scheduled-root list, one
  root-schedule microtask per event, callback node reuse/cancellation,
  cross-root sync flushing, continuation handling, execution-context guards,
  and DEV act queue routing.
- Worker 094: `root.unmount()` must clear `_internalRoot` before scheduling,
  enqueue a SyncLane `{element: null}` update, call shared `flushSyncWork()`,
  then unmark the DOM container after the flush. Per-root flushing and direct
  DOM teardown are root-cause bugs.

Provisional or absent inputs:

- Workers 086, 097, 100, 101, and 103 are listed as potentially unmerged by
  the assignment. No local worker reports or worker-specific oracle files were
  present for them:
  - `worker-progress/worker-086-react-test-renderer-act-oracle.md`
  - `worker-progress/worker-097-react-act-oracle.md`
  - `worker-progress/worker-100-reconciler-function-component-render-plan.md`
  - `worker-progress/worker-101-test-renderer-root-api-plan.md`
  - `worker-progress/worker-103-scheduler-mock-implementation-plan.md`
- Local scheduler mock oracle files from worker 052 are present and useful as
  public scheduler-mock evidence, but worker 103's implementation plan is
  absent. Any dependency on scheduler mock implementation remains provisional.
- Because worker 097 is absent, direct `React.act` public behavior beyond what
  worker 067 observes through `react-dom/test-utils.act` must remain
  provisional.
- Because worker 086 is absent, react-test-renderer-specific `act` and
  `unstable_flushSync` oracle details must remain provisional.
- Because worker 100 is absent, function component rendering and hooks are
  prerequisites only by dependency shape; this plan does not claim component
  render semantics.
- Because worker 101 is absent and `packages/react-test-renderer` is absent,
  public test-renderer root facade details remain provisional. This report
  names the shared reconciler call pattern that such a facade should use.

## Root-Cause Invariants

### Sync work is cross-root

`flush_sync_work` must operate over the scheduler's root list, not over a
caller-supplied root only. React DOM `flushSync`, `root.unmount`, passive
effects that schedule sync updates, layout work during commit, and multi-root
apps all depend on this.

Required invariant:

- The scheduler tracks every scheduled root.
- Sync lanes are detected from root lane state.
- A sync flush loops over all scheduled roots and repeats until a full pass
  performs no sync work.
- The function returns or reports "already rendering/committing" instead of
  re-entering the work loop.

### Render and commit reentrancy are separate from flush recursion

The work loop needs `RenderContext` and `CommitContext` guards so public
facades can warn or defer when `flushSync`, unmount, or event functions are
called during render/commit. The root scheduler also needs an `is_flushing_work`
guard so cross-root sync flushing cannot recursively corrupt the root list even
when callers already checked execution context.

Required diagnostics:

- `is_already_rendering_or_committing` for JS facades and DEV warnings.
- `FlushSyncDuringRenderOrCommit` or equivalent structured diagnostic for
  React DOM `flushSync`.
- `UnmountDuringRenderOrCommit` or equivalent structured diagnostic for
  React DOM root unmount.
- Internal debug assertions that `root.current` only switches after mutation
  and before layout, and that sync flush never enters while commit traversal is
  already active.

### Act routing belongs to the reconciler scheduler

`act` captures renderer work, not just facade callbacks. DEV act scopes need to
intercept both root-schedule tasks and non-sync render callbacks. The scheduler
must move existing real Scheduler callbacks into the act queue when an act
scope appears, preserve callback continuations, preserve remaining queue items
on errors or suspension-like async waits, and aggregate thrown errors.

Required invariant:

- React DOM/test-renderer facades enter an act scope; they do not flush roots
  themselves.
- Root-schedule microtasks go to the act queue when present.
- Non-sync render tasks go to the act queue when present and return a fake
  callback node.
- Cancelling a fake act callback node is a no-op.
- Scheduler continuations remain associated with the same logical callback
  node unless root callback state changes.

### Priority overrides are scoped and lane-backed

`flushSync` and discrete events set the current update priority to the
lane-backed discrete event priority. They must not use public Scheduler
Immediate priority as a substitute for `SyncLane`.

Required invariant:

- Core should expose a concrete lane-backed `EventPriority` type instead of
  host/test placeholders such as `()`.
- React DOM owns event-name and `window.event` resolution.
- The reconciler owns `request_update_lane`, transition lane placeholders, and
  mapping event priority to lanes.
- The root scheduler maps `lanes_to_event_priority(next_lanes)` to public
  Scheduler callback priority only at the async transport boundary:
  discrete/continuous to UserBlocking, default to Normal, idle to Idle.
- Sync lanes bypass Scheduler callbacks in the normal root path.

### Facades enqueue; they do not render

React DOM and test-renderer facades should be thin owners of public object
shape, warning text, option parsing, and JS callback lifetimes. They should
call the shared reconciler layer for root creation, update enqueueing, priority
scopes, sync flushing, and act queue scopes. They should not store lane state,
own the scheduled-root list, mutate host containers, or call test-renderer
storage operations directly.

## Implementation Plan

### 1. Prerequisite: lane-backed event priority

Future source files:

- `crates/fast-react-core/src/event_priority.rs`
- `crates/fast-react-core/src/lib.rs`
- follow-up report file for that worker

Plan:

- Add `EventPriority` as a transparent lane-backed type with `NO`,
  `DISCRETE`, `CONTINUOUS`, `DEFAULT`, and `IDLE`.
- Add `event_priority_to_lane`, `lanes_to_event_priority`,
  `higher_event_priority`, `lower_event_priority`, and
  `is_higher_event_priority`.
- Replace `type EventPriority = ()` in `fast-react-test-renderer` and
  reconciler fake hosts with the core type or a constrained adapter.

Tests:

- `cargo test -p fast-react-core --all-features`
- Unit tests for discrete, continuous, default, idle, no priority, lane
  conversion, priority ordering, and `lanes_to_event_priority` for sync,
  input-continuous, default, idle, and mixed lane sets.

Completion gate:

- No host config or test renderer path can use `()` for event priority.
- Public Scheduler constants are not imported into `fast-react-core`.

### 2. Prerequisite: FiberRoot and HostRoot update queues

Future source files:

- `crates/fast-react-reconciler/src/arena.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/lib.rs`

Plan:

- Consume worker 079/080 plans and any merged implementation that lands first.
- Add `FiberRootId`, `FiberId`, root scheduling fields, root lane state,
  HostRoot fiber initialization, current/WIP alternate shape, and HostRoot
  update queue attachment.
- Implement `update_container` and `update_container_sync` as internal
  reconciler APIs that create HostRoot updates with payload `{element}` and
  return the chosen lane.
- Keep these APIs host-neutral. They must enqueue and schedule; they must not
  mutate DOM or test-renderer storage.

Tests:

- HostRoot construction and current HostRoot fiber wiring.
- Circular pending queue append/transfer.
- Base queue rebase and skipped lane preservation.
- Sync `null` unmount update shape as `{element: null}`.
- Callback handles stored but not invoked during enqueue.
- `update_container` leaves fake host mutation counters at zero.

Completion gate:

- `update_container_sync(null, root, null, null)` enqueues a SyncLane HostRoot
  update and does not flush work itself.

### 3. Scheduler bridge

Future source file:

- `crates/fast-react-reconciler/src/scheduler_bridge.rs`

Plan:

- Add an internal `SchedulerPriority` enum/newtype mirroring Immediate,
  UserBlocking, Normal, Low, and Idle names without exposing public JS task
  object behavior.
- Add opaque `SchedulerCallbackNode` handles.
- Add `RenderTask` as a callback receiving `did_timeout` and returning an
  optional continuation.
- Add a `SchedulerBridge` trait or runtime object with `now`,
  `schedule_callback`, `cancel_callback`, and `should_yield`.
- Add a root microtask queue abstraction.

Boundary:

- This bridge is not `packages/scheduler` and should not implement
  `scheduler/unstable_mock`. Public Scheduler compatibility remains in the JS
  package tracks.

Tests:

- Deterministic fake scheduler records callback priority, cancellation,
  insertion order, didTimeout, continuation reuse, and scripted yield.
- Fake microtask queue records root-schedule microtasks without immediately
  running render work.

Completion gate:

- Reconciler root scheduler tests can run without importing
  `packages/scheduler` or `scheduler/unstable_mock`.

### 4. Execution context and reentrancy diagnostics

Future source files:

- `crates/fast-react-reconciler/src/execution_context.rs`
- `crates/fast-react-reconciler/src/diagnostics.rs`
- `crates/fast-react-reconciler/src/lib.rs`

Plan:

- Add `ExecutionContext` bit flags or newtype covering `NoContext`,
  `BatchedContext`, `RenderContext`, and `CommitContext`.
- Add guard APIs for entering/exiting render and commit phases.
- Add `is_already_rendering_or_committing`.
- Add structured diagnostics for invalid flush/unmount/event-function calls
  during render or commit.
- Keep public warning text in JS facades; Rust returns structured facts.

Tests:

- Enter/exit guards restore prior context after normal returns and errors.
- `flush_sync_work` reports already-rendering when called in render/commit.
- Root-schedule microtask firing during render/commit falls back to immediate
  Scheduler work instead of re-entering.
- Diagnostics are stable enum variants, not ad hoc strings.

Completion gate:

- React DOM facades can ask the reconciler whether to warn without inspecting
  private work-loop fields.

### 5. Root scheduler and cross-root sync flushing

Future source files:

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/sync_flush.rs`
- `crates/fast-react-reconciler/src/work_loop.rs`
- `crates/fast-react-reconciler/src/lib.rs`

Plan:

- Add scheduler-owned state: first/last scheduled root handles,
  `did_schedule_microtask`, `did_schedule_microtask_act`,
  `might_have_pending_sync_work`, `is_flushing_work`, and
  `current_event_transition_lane`.
- Implement `ensure_root_is_scheduled(root)` so it adds the root to the
  scheduled-root list and schedules the root-schedule microtask; it should not
  compute lanes or call render directly.
- Implement `process_root_schedule_in_microtask()` so it recomputes each root,
  removes roots with no work, schedules or cancels callbacks, resets the
  event transition lane cache, and flushes sync work across roots at the end.
- Implement `schedule_task_for_root_during_microtask(root, now)` so sync lanes
  cancel async callbacks and bypass Scheduler tasks; non-sync lanes map to
  scheduler bridge priorities.
- Implement `perform_work_on_root_via_scheduler_task(root, did_timeout)` so it
  flushes pending passive effects first, recomputes lanes, calls the injectable
  work-loop entry point, then returns a continuation only if the root callback
  node is unchanged.
- Implement `flush_sync_work_on_all_roots()` and
  `flush_sync_work_across_roots_impl(sync_transition_lanes, only_legacy)`.
  Legacy-specific behavior can remain a typed unsupported hook for the first
  concurrent-root slice.

Tests:

- Root inserted once and removed only during microtask processing.
- Multiple updates in one event schedule one root-schedule microtask.
- Sync lanes bypass Scheduler callbacks and flush at microtask end.
- Cross-root sync flush visits every scheduled root and repeats when work
  schedules more sync work.
- Equal callback priority reuses the callback node.
- Changed priority cancels stale callback and schedules replacement.
- No lanes, pending commit, or suspended data render cancels callback state.
- Passive preflush can cancel the current task and suppress rendering.
- Continuations preserve callback identity only while the root callback node is
  unchanged.
- `flush_sync_work` refuses render/commit reentry and sets a diagnostic.

Completion gate:

- Both React DOM `flushSync` and root unmount can call the same
  `flush_sync_work` boundary, and there is no per-root flush shortcut.

### 6. Act queue integration

Future source files:

- `crates/fast-react-reconciler/src/act.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- later JS glue in `packages/react/src/act.js` or equivalent, if a React
  package source directory is introduced

Plan:

- Add `ActQueueState` with absent/present queue, task vector, nested depth,
  flush guard, and thrown-error collection.
- Add a fake act callback node sentinel for root callback state.
- Route root-schedule tasks into act when the queue is present, deduped by
  `did_schedule_microtask_act`.
- Route non-sync render callbacks into act when the queue is present and store
  the fake callback node on the root.
- If a root has a real Scheduler callback and an act scope appears, cancel the
  real Scheduler callback and reschedule into act.
- `flush_act_queue()` should call tasks with `did_timeout = false`, follow
  continuations, preserve remaining tasks after errors or simulated async
  suspension, and aggregate thrown errors.
- Expose diagnostics hooks for not-wrapped-in-`act` warnings. Public warning
  wording belongs in JS after worker 097 or equivalent React act evidence
  lands.

Tests:

- Root-schedule tasks enter act instead of host microtasks.
- Non-sync root render tasks enter act instead of Scheduler callbacks.
- Cancelling fake act callback nodes is a no-op.
- A real Scheduler callback is cancelled and moved into act when act appears.
- Act follows continuations without consulting host `should_yield`.
- Errors aggregate and preserve later queued tasks.
- Simulated async/suspension preserves the current task and remaining queue.
- Not-wrapped diagnostics fire only when act environment is enabled and no act
  queue is present.

Completion gate:

- Test renderer and React DOM test-utils can share this queue without owning a
  renderer-local work loop.

### 7. Priority override scopes

Future source files:

- `crates/fast-react-reconciler/src/update_priority.rs`
- `crates/fast-react-reconciler/src/priority_scope.rs`
- `packages/react-dom/src/shared/flush-sync.js` or equivalent JS module
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`

Plan:

- Add reconciler `request_update_lane` that reads current transition placeholder
  state first, then lane-backed current update priority, then defaults.
- Add scoped override helpers so callers can set discrete update priority and
  clear current transition while running a callback, with restoration in
  `finally`.
- React DOM `flushSync` should use the scoped override helper, then call the
  shared dispatcher/reconciler `flush_sync_work`.
- Do not map public Scheduler priority to update lanes except for the explicit
  DOM `message` event path owned by the future event system.

Tests:

- Scoped priority restores after normal return and thrown callback.
- Nested override scopes restore in stack order.
- `flushSync` callback return and throw behavior matches worker 058.
- Sync updates scheduled inside the scope choose `SyncLane`.
- Public Scheduler priority observations from worker 058 remain unchanged.

Completion gate:

- `flushSync` no longer needs to know lane constants in JS; it calls a narrow
  priority scope and flush dispatcher.

### 8. React DOM facade call sites

Future JS files:

- `packages/react-dom/client.js`
- `packages/react-dom/src/client/create-root.js`
- `packages/react-dom/src/client/root-object.js`
- `packages/react-dom/src/client/update-container.js`
- `packages/react-dom/src/shared/flush-sync.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/test-utils.js`

Plan:

- `createRoot(container, options)` should validate/mark the DOM container and
  create a reconciler concurrent root through the shared root API. It should
  install delegated root listeners only after the root exists. Real event
  dispatch remains out of this plan.
- `root.render(children)` should call shared `update_container(children, root,
  null, null)` and return `undefined`.
- `root.unmount()` should warn for callback arguments, no-op when
  `_internalRoot` is `null`, set `_internalRoot = null` before scheduling,
  call `update_container_sync(null, root, null, null)`, call shared
  `flush_sync_work`, then unmark the container after the flush returns.
- `ReactDOM.flushSync(fn)` and profiling `flushSync` should call the shared
  priority override and cross-root sync flush boundary. `unstable_batchedUpdates`
  should remain a separate batching scope, not a sync flush.
- `react-dom/test-utils.act` should remain a deprecation-warning wrapper around
  `React.act` per worker 067 once `React.act` exists. It should not own
  scheduler queues.

Tests:

- Existing worker 058 flushSync/batching oracle tests remain green.
- Existing worker 067 test-utils act oracle tests remain green.
- Future React DOM client-root conformance should cover root object shape,
  second-argument warnings, invalid container throw, unmounted render throw,
  unmount idempotence, marker order, and cross-root sync flush.
- Future `react-dom-unmount-flush-sync` conformance should assert sync null
  update ordering, `_internalRoot` clearing before cleanup user code, and
  post-flush container unmarking.

Completion gate:

- No React DOM facade directly mutates host children or calls test-renderer
  storage. All root work enters through reconciler APIs.

### 9. Test-renderer facade call sites

Future Rust/JS files:

- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/options.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/index.js` if/when that package is added
- `packages/react/index.js` for public `React.act`

Plan:

- Add a `TestRendererRoot` layer that owns a reconciler root handle and an
  in-memory mutation host container.
- `create(element, options)` should create a reconciler root, call
  `update_container(element, root, null, null)`, and use the shared root
  scheduler/act integration to flush according to public test-renderer
  semantics once oracles land.
- `update(element)` should call shared `update_container`.
- `unmount()` should call shared `update_container(null, root, null, null)` or
  `update_container_sync` only where the future test-renderer oracle proves it.
  Worker 073 notes upstream test-renderer unmount uses `updateContainer(null)`,
  so do not assume React DOM's sync unmount behavior for test renderer.
- `unstable_flushSync` should call shared `flush_sync_work` after entering the
  correct priority scope once worker 086 or equivalent evidence lands.
- `act` should enter the shared act queue and flush through the reconciler
  scheduler. It must not directly mutate the in-memory host.

Tests:

- Rust tests prove create/update/unmount enqueue root updates and leave host
  storage unchanged until work-loop/commit runs.
- Fake scheduler/fake act tests prove queue routing independent of JS package
  scheduler mock.
- Future react-test-renderer act/root API oracles must be consumed before any
  public compatibility claim.

Completion gate:

- Existing direct host mutation APIs remain only explicit low-level host tests;
  public test-renderer root APIs cannot bypass the reconciler.

## Out Of Scope

- Suspense ping/retry implementation beyond preserving typed hooks and not
  blocking future lane integration.
- Transitions beyond recorded placeholders: lane reuse, event transition cache,
  and entanglement hooks may be present, but no default transition indicator,
  transition tracing, async action scope, or full `startTransition` behavior is
  claimed here.
- Real DOM event dispatch, plugin extraction, controlled input restore, form
  actions, and hydration replay.
- Full test-renderer `toJSON`, `toTree`, and `TestInstance` serialization.
- Public `scheduler/unstable_mock` implementation. Its oracle exists from
  worker 052, but worker 103 is absent.
- Public React `act` compatibility beyond the wrapper evidence available from
  worker 067 until worker 097 or equivalent lands.

## Completion Gates

Minimum gates before React DOM `flushSync`, root unmount, or test-renderer
`act` can claim compatibility:

1. `fast-react-core` exposes lane-backed `EventPriority`; no local test host
   uses `()` for event priority.
2. Reconciler has FiberRoot, HostRoot update queues, and
   `update_container`/`update_container_sync`.
3. Reconciler has scheduler bridge and fake scheduler tests for callback
   reuse, cancellation, continuation, and lane-to-Scheduler mapping.
4. Reconciler has execution context guards and structured reentrancy
   diagnostics.
5. Reconciler has cross-root `flush_sync_work` with tests proving all scheduled
   roots are visited and repeated until no sync work remains.
6. Reconciler has act queue routing with tests for root-schedule tasks,
   non-sync render tasks, fake callback node cancellation, continuations, and
   error aggregation.
7. React DOM `flushSync` continues to pass worker 058's oracle and adds
   root-backed conformance for cross-root flush and priority override.
8. React DOM `test-utils.act` continues to pass worker 067's wrapper oracle
   and delegates to `React.act`.
9. React/test-renderer public `act` compatibility waits for worker 097/086 or
   equivalent checked oracles.
10. `cargo fmt --all --check`, `cargo test -p fast-react-core --all-features`,
    `cargo test -p fast-react-reconciler --all-features`,
    `cargo test -p fast-react-test-renderer --all-features` when touched, and
    targeted conformance tests pass for the touched package surfaces.

## Delegated Checks

Two read-only managed explorer agents were spawned. Both were instructed not
to modify files and not to read `ORCHESTRATOR.md`.

- Evidence/oracle explorer checked workers 007, 041, 044, 055, 058, 067, 073,
  080, 081, 094, and the local oracle files. It confirmed the main anchors:
  sync flushing is a shared root-scheduler boundary; cross-root flushing is
  required for `root.unmount` and `flushSync`; reentrancy requires both
  execution-context and scheduler flush guards; act queue routing belongs in
  the scheduler; and priority overrides must stay lane-backed. It also
  confirmed workers 086, 097, 100, 101, and 103 are absent locally and should
  be treated as provisional.
- Source topology explorer checked current crates and JS facades. It confirmed
  the structural blocker: public APIs exist as placeholders, but no JS facade
  reaches a real reconciler; the reconciler has no root, update queue, work
  loop, sync queue, commit pipeline, or act queue; `packages/react-test-renderer`
  is absent; and the existing test renderer is a low-level mutation host, not a
  reconciler root API.

I used both results as hypothesis checks and incorporated their findings into
the dependency and provisional-worker sections.

## Quality, Maintainability, Performance, And Security

Quality:

- The plan models the root causes directly: root scheduling, cross-root sync
  flushing, act task routing, and lane-backed priority scopes.
- Compatibility claims are bounded by checked local evidence. Missing worker
  086/097/100/101/103 outputs are explicitly provisional.

Maintainability:

- Reconciler scheduling is split into small modules with fake scheduler and
  fake act tests. React DOM and test-renderer facades call shared APIs instead
  of maintaining parallel scheduler behavior.
- Public Scheduler package compatibility remains separate from internal
  reconciler scheduling so future scheduler mock work does not leak into root
  semantics.

Performance:

- The scheduler keeps lane bitsets and fixed root list state on hot paths.
  Sync flushing should fast-exit when no sync work is possible and reuse/cancel
  callback nodes instead of scheduling redundant tasks.
- Act routing captures tasks only in DEV/test scopes; production paths should
  keep the direct scheduler bridge.

Security:

- JS callback handles for `flushSync`, `act`, root error callbacks, refs, and
  test-renderer callbacks must be rooted and disposed explicitly at the
  JS/native boundary. Rust should not store raw JS values or call user JS from
  background threads.
- Reentrancy guards prevent user callbacks from observing half-mutated commit
  state or re-entering sync flush while roots are being committed.
- DOM facades must use structured DOM operations from the host adapter and must
  not implement sync unmount through HTML string replacement or direct child
  clearing.

## Risks Or Blockers

- FiberRoot, HostRoot queues, root lane bookkeeping, work loop, and commit
  skeleton are still absent in this worktree.
- `EventPriority = ()` remains in local test hosts and must be broken before
  priority override behavior is sound.
- Native binding remains placeholder-only, so JS facade-to-Rust calls need a
  private handle/lifetime design before public roots can work.
- Worker 097's React `act` oracle and worker 086's react-test-renderer act
  oracle are absent; public act wording and renderer-specific flushing details
  need future evidence.
- Worker 103's scheduler mock implementation plan is absent; scheduler mock
  should not be used as the internal reconciler test harness.
- DOM root marker and listener implementation are outside this plan but needed
  before React DOM root/unmount conformance can be claimed.

## Recommended Next Tasks

1. Implement or consume lane-backed core `EventPriority`.
2. Implement or consume reconciler FiberRoot/HostRoot records and HostRoot
   update queues.
3. Implement reconciler scheduler bridge, execution-context guards,
   cross-root sync flushing, and act queue routing with fake scheduler tests.
4. Add React public `act` and react-test-renderer act/root oracles if workers
   097/086/101 remain unmerged.
5. Wire React DOM `flushSync`, `root.unmount`, and `test-utils.act` only after
   the shared reconciler scheduler gates pass.
6. Add root-backed conformance for cross-root `flushSync`, unmount marker
   ordering, and act-flushed updates before claiming compatibility.

## Commands Run

Tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after goal setup.
- Spawned two read-only explorer agents for delegated hypothesis checks.
- `wait_agent` for the topology explorer after the evidence explorer returned.

Shell commands:

```sh
pwd && ls
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files worker-progress | sort
rg --files tests/conformance | sort
rg --files crates packages bindings tests | sort
git status --short
sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,260p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '260,620p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,260p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '260,620p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,280p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,320p' worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md
sed -n '1,320p' worker-progress/worker-067-react-dom-test-utils-act-oracle.md
sed -n '1,360p' worker-progress/worker-073-test-renderer-update-model-plan.md
sed -n '1,360p' worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
sed -n '360,760p' worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
sed -n '1,420p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '420,860p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,360p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '1,320p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,280p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '1,320p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,280p' crates/fast-react-core/src/lib.rs
sed -n '1,520p' crates/fast-react-core/src/lane.rs
sed -n '1,360p' crates/fast-react-host-config/src/lib.rs
sed -n '720,1100p' crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-test-renderer/src/lib.rs
sed -n '520,900p' crates/fast-react-test-renderer/src/lib.rs
sed -n '1,260p' packages/react-dom/index.js
sed -n '1,240p' packages/react-dom/client.js
sed -n '1,200p' packages/react-dom/test-utils.js
sed -n '1,220p' packages/react-dom/profiling.js
sed -n '1,260p' packages/react/index.js
sed -n '1,220p' packages/react/placeholder-utils.js
sed -n '1,260p' packages/scheduler/cjs/scheduler.development.js
sed -n '1,260p' tests/conformance/src/react-dom-flush-sync-batching-scenarios.mjs
sed -n '1,260p' tests/conformance/src/react-dom-test-utils-act-scenarios.mjs
node tests/conformance/scripts/print-react-dom-flush-sync-batching-oracle.mjs --format markdown | sed -n '1,220p'
test -f worker-progress/worker-086-react-test-renderer-act-oracle.md
test -f worker-progress/worker-097-react-act-oracle.md
test -f worker-progress/worker-100-reconciler-function-component-render-plan.md
test -f worker-progress/worker-101-test-renderer-root-api-plan.md
test -f worker-progress/worker-103-scheduler-mock-implementation-plan.md
rg --files tests/conformance worker-progress | rg 'react-test-renderer|react-act|scheduler-mock|worker-086|worker-097|worker-100|worker-101|worker-103'
rg -n "actQueue|React\\.act|react-dom/test-utils|flushSync|unstable_flushSync|scheduler/unstable_mock|root scheduler|test renderer" worker-progress/worker-0*.md tests/conformance/src tests/conformance/oracles packages crates -g '!target'
rg -n "HostFiberToken|HostScheduling|schedule_microtask|current_update_priority|EventPriority|request_post_paint|wait_for_commit|preparePortalMount" crates/fast-react-host-config/src/lib.rs crates/fast-react-test-renderer/src/lib.rs crates/fast-react-reconciler/src/lib.rs
sed -n '1,220p' worker-progress/worker-052-scheduler-mock-oracle.md
sed -n '1,220p' tests/conformance/src/scheduler-mock-scenarios.mjs
sed -n '1,220p' worker-progress/worker-045-scheduler-root-implementation.md
sed -n '1,220p' tests/conformance/src/scheduler-root-scenarios.mjs
```

Additional verification commands are recorded in the Completion Audit below.

## Changed Files

- `worker-progress/worker-111-reconciler-sync-flush-act-plan.md`

## Completion Audit

Objective restated as success criteria:

- Create only `worker-progress/worker-111-reconciler-sync-flush-act-plan.md`.
- Produce an implementation plan, not source implementation.
- Cover reconciler sync flushing, cross-root sync flushing,
  render/commit reentrancy guards, act queue routing, priority override
  boundaries, and React DOM/test-renderer facade calls into the shared
  scheduler layer.
- Anchor the plan in workers 007, 041, 044, 055, 058, 067, 073, 080, 081,
  086 if present, 094, and 097 if present.
- Treat workers 086, 097, 100, 101, and 103 as provisional unless local
  reports/oracles are present.
- Stay below Suspense, broad transitions, real DOM event dispatch, and full
  test-renderer serialization.
- Specify exact future files, JS call sites, tests, diagnostics, and
  completion gates.
- Summarize delegated checks and results.
- Include changed files, commands run, evidence, risks/blockers, recommended
  next tasks, and quality/security review.

Prompt-to-artifact checklist:

- Write scope: satisfied by `git status --short` after report creation, which
  shows only this report as changed.
- Goal setup: satisfied in the Objective section with recorded `create_goal`
  and `get_goal` status/objective.
- Required context files: satisfied; commands above read `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. `ORCHESTRATOR.md` was not read.
- Required anchors: satisfied in Evidence Anchors. Reports 007, 041, 044, 055,
  058, 067, 073, 080, 081, and 094 were present and read.
- Provisional anchors: satisfied in Evidence Anchors. Reports/oracles for 086,
  097, 100, 101, and 103 were checked and found absent.
- Cross-root sync flush: satisfied in Root-Cause Invariants, Implementation
  Plan step 5, and Completion Gates.
- Reentrancy guards: satisfied in Root-Cause Invariants, Implementation Plan
  step 4, tests, and diagnostics.
- Act queue routing: satisfied in Root-Cause Invariants, Implementation Plan
  step 6, facade sections, and delegated checks.
- Priority override boundaries: satisfied in Root-Cause Invariants,
  Implementation Plan steps 1 and 7, and React DOM facade plan.
- React DOM facade calls: satisfied in Implementation Plan step 8.
- Test-renderer facade calls: satisfied in Implementation Plan step 9 with
  worker 086/101 caveats.
- Out-of-scope limits: satisfied in Out Of Scope.
- Exact files: satisfied across Implementation Plan steps 1-9.
- Unit/conformance tests: satisfied in each implementation step and Completion
  Gates.
- Reentrancy diagnostics: satisfied in Root-Cause Invariants and step 4.
- Completion gates: satisfied in the Completion Gates section.
- Delegated checks: satisfied in Delegated Checks with both returned results.
- Quality/security/performance review: satisfied in the dedicated section.
- Handoff sections: satisfied by Summary, Changed Files, Commands Run,
  Evidence Anchors, Risks Or Blockers, and Recommended Next Tasks.

Verification commands after writing this report:

```sh
git status --short --untracked-files=all
git diff --check -- worker-progress/worker-111-reconciler-sync-flush-act-plan.md
git diff --check --no-index /dev/null worker-progress/worker-111-reconciler-sync-flush-act-plan.md
node -e "<scoped report hygiene check>"
node -e "<scoped local/temp path leak check>"
rg -n "<trailing-whitespace/conflict-marker/local-temp-path patterns>" worker-progress/worker-111-reconciler-sync-flush-act-plan.md
rg -n "worker-086|worker-097|worker-100|worker-101|worker-103|cross-root|reentrancy|act queue|priority override|React DOM facade|Test-renderer facade|Completion Gates|Delegated Checks|Changed Files|Commands Run|Risks Or Blockers|Recommended Next Tasks|Goal tooling" worker-progress/worker-111-reconciler-sync-flush-act-plan.md
node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs
node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs
sed -n '1,220p' worker-progress/worker-111-reconciler-sync-flush-act-plan.md
sed -n '220,520p' worker-progress/worker-111-reconciler-sync-flush-act-plan.md
sed -n '520,900p' worker-progress/worker-111-reconciler-sync-flush-act-plan.md
wc -l worker-progress/worker-111-reconciler-sync-flush-act-plan.md
```

Verification results:

- `git status --short --untracked-files=all` showed only
  `?? worker-progress/worker-111-reconciler-sync-flush-act-plan.md`.
- `git diff --check -- worker-progress/worker-111-reconciler-sync-flush-act-plan.md`
  returned clean.
- `git diff --check --no-index /dev/null worker-progress/worker-111-reconciler-sync-flush-act-plan.md`
  returned no whitespace errors for the untracked report file.
- The scoped report hygiene check printed `report hygiene ok`.
- The scoped local/temp path leak check printed `no local path leaks`.
- The scoped regex whitespace/conflict-marker/local-temp-path check returned no
  matches.
- The targeted checklist `rg` found the expected report sections and
  requirement terms.
- `node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`
  passed: 12 tests, 0 failures.
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
  passed: 11 tests, 0 failures.
- Full report re-read completed after writing.

Uncovered requirements after audit:

- None for this report-only objective. Source implementation and source test
  execution are intentionally out of scope; the report does not claim runtime
  compatibility.
