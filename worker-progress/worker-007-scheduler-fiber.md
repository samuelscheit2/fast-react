# worker-007-scheduler-fiber

## Objective

Investigate React 19.2.6 scheduler, fiber, lane, update queue, and effect-list semantics that Fast React must model. The output is this research report only; no project implementation files were changed.

Root conclusion: Fast React must model React's lane bitsets, double-buffered fibers, root lane bookkeeping, prioritized rebasing queues, Scheduler task heaps, and `flags`/`subtreeFlags` commit traversal as first-class Rust structures. A simplified priority enum, FIFO state queue, or single global effect list would miss observable behavior around transitions, Suspense retries, hidden/offscreen updates, sync flushing, effect order, and public `scheduler` package APIs.

## Sources and commands used

Primary sources:

- React source tag: `/tmp/fast-react-worker-007-src/react-19.2.6`, fetched from `https://github.com/facebook/react/archive/refs/tags/v19.2.6.tar.gz`.
- Shipped npm tarballs unpacked under `/tmp/fast-react-worker-007-npm`:
  - `react` 19.2.6
  - `react-dom` 19.2.6, depending on `scheduler: ^0.27.0`
  - `scheduler` 0.27.0
- Key files inspected:
  - `packages/scheduler/src/forks/Scheduler.js`
  - `packages/scheduler/src/SchedulerMinHeap.js`
  - `packages/scheduler/src/SchedulerPriorities.js`
  - `packages/scheduler/src/SchedulerFeatureFlags.js`
  - `packages/react-reconciler/src/ReactFiberLane.js`
  - `packages/react-reconciler/src/ReactFiberRootScheduler.js`
  - `packages/react-reconciler/src/ReactFiberWorkLoop.js`
  - `packages/react-reconciler/src/ReactFiber.js`
  - `packages/react-reconciler/src/ReactInternalTypes.js`
  - `packages/react-reconciler/src/ReactFiberRoot.js`
  - `packages/react-reconciler/src/ReactFiberClassUpdateQueue.js`
  - `packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`
  - `packages/react-reconciler/src/ReactFiberHooks.js`
  - `packages/react-reconciler/src/ReactFiberFlags.js`
  - `packages/react-reconciler/src/ReactFiberCompleteWork.js`
  - `packages/react-reconciler/src/ReactFiberCommitWork.js`
  - `packages/react-reconciler/src/ReactFiberCommitEffects.js`

Commands run:

- `pwd && ls`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `rg --files`
- `git status --short`
- `ls -la worker-progress`
- `node --version && npm --version`
- `npm view react@19.2.6 version dist.tarball gitHead --json`
- `npm view react-dom@19.2.6 version dist.tarball dependencies gitHead --json`
- `npm view scheduler version dist.tarball gitHead --json`
- `git ls-remote --tags https://github.com/facebook/react.git refs/tags/v19.2.6 refs/tags/19.2.6 refs/tags/v19.2.6^{}`
- `curl -L --fail https://github.com/facebook/react/archive/refs/tags/v19.2.6.tar.gz | tar -xz -C /tmp/fast-react-worker-007-src`
- `npm pack react@19.2.6 react-dom@19.2.6 scheduler@0.27.0 --pack-destination /tmp/fast-react-worker-007-npm --json` failed because this environment's npm config enforces a minimum release age.
- `npm --minimum-release-age=0 pack ...` also failed because this npm build treats that config as unknown.
- Direct tarball fetches with `curl -L --fail https://registry.npmjs.org/... | tar -xz`.
- `find /tmp/fast-react-worker-007-src -maxdepth 2 -type d | sort | head -40`
- `find /tmp/fast-react-worker-007-npm -maxdepth 3 -type f | sort | head -80`
- Multiple `rg -n` and `sed -n` source inspections across the files listed above.
- `sed -n '1,120p' worker-progress/README.md`
- `node` checks against unpacked `scheduler` package:
  - listed public exports
  - printed priority constants and `unstable_now` type
  - scheduled Immediate/UserBlocking/Normal/Low callbacks and observed `immediate,user-blocking,normal,low`
- `node -e` package version check for unpacked `react`, `react-dom`, and `scheduler`.
- `wait_agent` for three delegated explorer checks.
- Completion audit commands:
  - `rg -n "^## (Objective|Sources and commands used|Scheduler and priority findings|Lane model findings|Fiber and update queue findings|Effect and commit phase implications|Rust data structure recommendations|Behavioral tests required before implementation|Proposed follow-up implementation tasks|Completion checklist)$" worker-progress/worker-007-scheduler-fiber.md`
  - `git status --short --untracked-files=all`
  - `sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md`
  - `sed -n '260,520p' worker-progress/worker-007-scheduler-fiber.md`

Delegated checks:

- Scheduler/root scheduling check confirmed Scheduler task/timer heaps plus React root microtask scheduling and lane selection. It emphasized that lanes live in `ReactFiberLane.js`, while `ReactFiberWorkLoop.js` chooses sync vs concurrent work and yield behavior.
- Lane/update queue check confirmed bitset lanes, root-level entanglement/expiration/ping tracking, and circular pending/base queues. It rejected a simple FIFO model.
- Effect/commit check confirmed React 19.2.6 does not use a tree-wide `firstEffect`/`nextEffect` list. It uses `flags`, `subtreeFlags`, deletion arrays, phase masks, and per-fiber hook effect rings.

## Scheduler and priority findings

React 19.2.6 has two scheduling layers that must not be collapsed.

- The public `scheduler` package exposes `unstable_scheduleCallback`, `unstable_cancelCallback`, `unstable_shouldYield`, `unstable_now`, `unstable_runWithPriority`, `unstable_next`, `unstable_wrapCallback`, five unstable priority constants, `unstable_requestPaint`, `unstable_forceFrameRate`, and `unstable_Profiling`. If Fast React ships a compatible `scheduler` package, those APIs are directly JS-observable.
- Scheduler uses two binary min-heaps: `taskQueue` for ready tasks and `timerQueue` for delayed tasks. Heap order is `sortIndex` and then monotonically increasing task `id`, which preserves insertion order among equal sort keys.
- `unstable_scheduleCallback` computes `startTime`, timeout, and `expirationTime`; delayed work is sorted by `startTime`, ready work by `expirationTime`. Canceled callbacks stay in the heap with `callback = null` until popped.
- Priority constants are numeric: NoPriority `0`, Immediate `1`, UserBlocking `2`, Normal `3`, Low `4`, Idle `5`. Timeouts are Immediate `-1`, UserBlocking `250ms`, Normal `5000ms`, Low `10000ms`, Idle max signed 31-bit int.
- Scheduler does not align work to animation frames. It yields after a `frameYieldMs` budget, default `5ms`, or when `requestPaint` asks for a paint. Host callback transport prefers `setImmediate`, then `MessageChannel`, then `setTimeout`.
- Returning a continuation function from a scheduled callback keeps the same task and yields immediately; the next host callback resumes that task before lower-priority eligible work.
- React root scheduling adds roots to a linked list in `ensureRootIsScheduled`, then schedules a microtask. Actual root task selection happens later in `scheduleTaskForRootDuringMicrotask`.
- Sync lanes bypass a Scheduler task and are flushed at the end of the root-schedule microtask. Non-sync lanes map `lanesToEventPriority(nextLanes)` to Scheduler priority and schedule `performWorkOnRootViaSchedulerTask`.
- React re-runs `getNextLanes` inside `performWorkOnRootViaSchedulerTask` because Scheduler can batch callbacks into a single browser task without letting microtasks run between them.
- `performWorkOnRoot` decides sync vs concurrent rendering from `forceSync`, blocking lanes, expired lanes, and prerender state. Concurrent loops yield either by Scheduler `shouldYield()` or throttled time windows.

JS-observable constraints:

- Relative order of Scheduler callbacks at equal/different priorities is observable through the public `scheduler` package.
- `didTimeout`, current priority level, `unstable_shouldYield`, cancellation, delayed callback behavior, and continuation behavior are observable.
- React users observe this layer indirectly through sync flush timing, transition pending state, Suspense fallback/retry timing, passive effect flushing, and whether higher-priority updates interrupt lower-priority renders.

## Lane model findings

React 19.2.6 lanes are 31-bit numeric bitsets, not a flat priority enum.

- `ReactFiberLane.js` defines `TotalLanes = 31`. Lower set bits are higher priority.
- Important lane groups include Sync/Hydration, InputContinuous/Hydration, Default/Hydration, Gesture, TransitionHydration, 14 Transition lanes, 4 Retry lanes, SelectiveHydration, IdleHydration, Idle, Offscreen, and Deferred.
- `getNextLanes(root, wipLanes, rootHasPendingCommit)` selects from `root.pendingLanes`, excluding suspended lanes, then considering pinged and warm/prewarm lanes. It defers idle work while non-idle work is pending.
- Work-in-progress lanes are sticky unless the next candidate is higher priority; Default priority does not interrupt an in-progress transition in the normal case.
- Root state includes `pendingLanes`, `suspendedLanes`, `pingedLanes`, `warmLanes`, `expiredLanes`, `indicatorLanes`, `errorRecoveryDisabledLanes`, `entangledLanes`, `entanglements`, `expirationTimes`, and `hiddenUpdates`.
- `markRootUpdated` sets pending lanes and clears suspended/pinged/warm lanes for non-idle updates because a new update may unblock suspended transitions.
- `markRootSuspended` marks suspended lanes, clears pings for them, clears expiration times, optionally marks lanes warm, and can spawn deferred lanes.
- `markRootPinged` only pings lanes that were suspended and clears warm state for those lanes.
- `markRootFinished` clears completed lane bookkeeping, root entanglements, expiration times, hidden update markers, and strips `OffscreenLane` from hidden updates that are no longer hidden.
- `markRootEntangled` computes transitive entanglements. This is a root cause for why transition semantics cannot be represented with independent per-lane queues.
- `requestUpdateLane` returns Sync in non-concurrent legacy mode, reuses render lanes for unsupported render-phase updates, uses a stable transition lane within one event, and otherwise maps event priority to a lane.
- `requestTransitionLane` caches the event's transition lane until the event is over, so all transitions in the same event share a lane.
- `requestDeferredLane` batches multiple `useDeferredValue` hooks in one render and uses OffscreenLane when prerendering.

Rust constraint:

- Use a `Lane(u32)`/`Lanes(u32)` newtype, not `enum Priority`.
- Use fixed `[T; 31]` lane maps for expiration times, entanglements, hidden updates, and optional DevTools updater tracking.
- Preserve low-bit priority ordering and all bitwise inclusion/subset operations. This is hot-path code and should be allocation-free.

## Fiber and update queue findings

Fiber shape:

- A fiber stores instance fields (`tag`, `key`, `elementType`, `type`, `stateNode`), tree pointers (`return`, `child`, `sibling`, `index`), refs, props/state, `updateQueue`, context/event dependencies, `mode`, effect flags, `deletions`, `lanes`, `childLanes`, and `alternate`.
- React explicitly notes the Fiber constructor should be easy to port to a C struct. That points directly toward a stable Rust struct or arena-backed node layout, not a high-level dynamic object graph.
- The alternate pair is central: current and work-in-progress fibers share some queue structure but diverge in render-owned fields. A Rust implementation needs precise ownership around double buffering.

Class/root update queues:

- Class and HostRoot queues are prioritized linked lists with a circular `shared.pending` list plus linear `firstBaseUpdate`/`lastBaseUpdate`.
- Pending updates are appended in insertion order, but processing skips insufficient-priority updates by lane. Skipped updates and later applied updates are cloned into a new base queue so later renders can rebase correctly.
- Updates scheduled while processing a queue are appended and processed in the same pass.
- Class callbacks are collected onto `queue.callbacks`; hidden callbacks may be deferred in `shared.hiddenCallbacks` until the component becomes visible.
- Transition class updates record queue lanes and entangle them at the root.

Concurrent enqueue path:

- `ReactFiberConcurrentUpdates.js` first batches `(fiber, queue, update, lane)` tuples into a flat `concurrentQueues` array.
- `finishQueueingConcurrentUpdates` later appends each update to its circular pending queue and marks lanes from the updated fiber to the root.
- The fiber and alternate `lanes` fields are updated immediately to support eager bailout checks.

Hook queues:

- Hook state/reducer queues have `pending`, `lanes`, `dispatch`, `lastRenderedReducer`, and `lastRenderedState`.
- Each hook stores `memoizedState`, `baseState`, `baseQueue`, and `queue`.
- `updateReducerImpl` merges pending circular updates into the base circular queue, skips by lane, clones skipped/applied updates for rebase, supports eager state, and keeps optimistic updates until their `revertLane` is rendered.
- Render-phase hook updates are stashed in the hook queue's circular pending list and cause render restart.
- `dispatchSetStateInternal` eagerly computes state when the fiber and alternate have no pending lanes; if the eager state is `Object.is` equal, it queues a no-lane update for possible future rebase but avoids scheduling a render.

Rust constraint:

- Do not use a draining FIFO for updates. It would break lane skipping, rebase, eager bailouts, render-phase updates, callbacks, hidden updates, optimistic updates, and transition entanglement.
- Use arena indices or another stable owner model for fibers and update nodes. Raw linked lists are semantically close to React, but Rust should represent `next` with node IDs to avoid aliasing and use-after-free across current/work-in-progress sharing.

## Effect and commit phase implications

React 19.2.6 no longer uses a tree-wide effect list on fibers.

- Fiber effect state is `flags`, `subtreeFlags`, and `deletions`. There are no `firstEffect`, `lastEffect`, or `nextEffect` fiber fields for a global commit list.
- `ReactFiberFlags.js` defines phase masks: `BeforeMutationMask`, `MutationMask`, `LayoutMask`, `PassiveMask`, and transition/passive variants.
- `bubbleProperties` ORs child `lanes`, `childLanes`, `flags`, and `subtreeFlags` upward during complete work. Bailout paths preserve only static flags as appropriate.
- Commit phases traverse the fiber tree by masks:
  - before-mutation phase prepares host commit and runs snapshot-style effects before host mutation
  - mutation phase applies host mutations, deletions, ref detaches, insertion effect handling, and other mutation work
  - `root.current = finishedWork` is assigned after mutation and before layout
  - layout phase runs layout lifecycles/effects, callbacks, and ref attaches
  - passive phase is scheduled/flushed separately and runs passive unmounts before passive mounts
- Per-function-component hook effects still use a circular effect ring at `finishedWork.updateQueue.lastEffect`, filtered by hook flags such as insertion, layout, passive, and has-effect. This ring is per fiber, not the old tree-wide effect list.
- Deleted subtree passive unmount traversal is parent-to-child. Deletion arrays are attached to parents and must be visited in phase-specific order.
- View Transition, Activity, Offscreen, hydration, Suspense, and hidden subtree paths add special traversal skips and extra masks. These are not optional details if the compatibility target includes React 19.2.6 concurrent features.

JS-observable constraints:

- `getSnapshotBeforeUpdate` must run before host mutations.
- `useInsertionEffect` and layout-effect destroy/create order must match React's mutation/layout partitioning.
- `root.current` must switch after mutation and before layout because layout effects and lifecycle methods observe the finished tree.
- Passive destroys must run before passive creates in a deferred passive flush.
- Ref detach/attach ordering, class callbacks, hidden callback deferral, and deletion cleanup order are observable.

## Rust data structure recommendations

- Define `Lane` and `Lanes` as `#[repr(transparent)]` `u32` newtypes with explicit helpers for merge, remove, subset, highest-priority lane, index conversion, and group tests.
- Define `LaneMap<T>` as `[T; 31]` or a small fixed array wrapper. Avoid maps/hashes on scheduler hot paths.
- Define `FiberId` and `UpdateId` arena indices. Fibers should store `Option<FiberId>` for `return`, `child`, `sibling`, and `alternate`.
- Keep `Fiber` as a fixed-layout struct with typed fields for tag, mode, lanes, child lanes, flags, subtree flags, deletion list, props/state handles, update queue handle, dependencies, refs, and renderer state node handle.
- Store JS-observable props/state/callbacks in GC-rooted or externally rooted handles at the JS binding boundary. Rust arenas must not outlive JS callbacks or expose dangling JS references.
- Use `bitflags`-style `Flags(u32)` and `Mode(u32)` newtypes. Preserve React's phase masks, including static flags, rather than deriving phases ad hoc.
- Model `FiberRoot` explicitly with current fiber, root linked-list scheduling fields, callback node/priority, all root lane bitsets, lane maps, pending commit handles, ping cache, context fields, and renderer host container data.
- Scheduler crate/module should implement public `scheduler` semantics with binary heaps, delayed timers, cancellation by nulling callbacks or equivalent tombstones, priority context stack, continuation callbacks, and host callback transport abstractions.
- Update queues should be intrusive by index:
  - circular pending ring
  - base queue/ring depending on class vs hook queue needs
  - shared queue object across alternates
  - lane and callback storage
  - cloning/rebasing support without moving JS callback handles unsafely
- Hook effect storage should be a per-fiber circular ring or equivalent stable ordered list. Commit traversal should remain tree/mask driven, not list driven.
- Make any existing or proposed scaffold that assumes flat priorities, `VecDeque` FIFO updates, or global effect lists a breaking-change target. Keeping those abstractions would patch symptoms and force repeated semantic fixes later.

Quality, maintainability, performance, and security review:

- Quality: model the core invariants directly. The main invariant is that lanes select which updates render while queues preserve insertion order for rebasing.
- Maintainability: keep source constants and masks near React naming, with tests that diff lane constants against React 19.2.6. This reduces accidental semantic drift.
- Performance: use fixed bitsets, fixed lane maps, arenas, and heap schedulers. Avoid per-update heap allocation where arenas or slab allocation can batch nodes.
- Security: JS callbacks, wakeables, refs, and host instances cross the Rust boundary. Use explicit rooting/lifetime handles and phase guards so a commit callback cannot observe freed fibers or re-enter inconsistent mutable state.

## Behavioral tests required before implementation

- Public Scheduler:
  - priority ordering Immediate > UserBlocking > Normal > Low > Idle
  - equal-priority insertion order
  - delayed callbacks sorted by delay/start time
  - cancellation tombstones do not invoke callbacks
  - continuation callback resumes same task and yields first
  - `didTimeout`, `unstable_getCurrentPriorityLevel`, `unstable_runWithPriority`, `unstable_next`, `unstable_wrapCallback`, `unstable_now`, and `unstable_shouldYield`
- Root scheduling:
  - sync updates flush at microtask end without an extra Scheduler task
  - non-sync updates reuse/cancel root callback nodes when lane priority changes
  - passive effects can schedule more work and cause lane recomputation
  - higher-priority update interrupts lower-priority WIP, while Default does not unnecessarily interrupt transitions
- Lanes:
  - constant values and lane group masks match React 19.2.6
  - `getNextLanes` cases for pending, suspended, pinged, warm/prewarm, idle, expired, WIP, retry, hydration, offscreen, and deferred work
  - event-stable transition lane reuse
  - transitive entanglement
  - hidden update `OffscreenLane` marking and clearing
- Update queues:
  - class and hook updates preserve insertion order but skip insufficient lanes
  - skipped updates rebase later with the right base state
  - updates after a skipped update are cloned so they are not lost
  - updates scheduled during queue processing are processed in the same pass where React does so
  - eager state bailout queues no-lane updates without scheduling
  - render-phase hook updates restart render and apply to the same hook
  - class callbacks and hidden callbacks fire in React order
  - optimistic updates revert when `revertLane` renders
- Fiber/commit/effects:
  - `flags` and `subtreeFlags` bubble correctly through normal completion and bailout paths
  - deletion arrays are traversed in the right phase and order
  - before-mutation snapshots precede host mutations
  - mutation phase detaches refs and applies host changes before layout
  - `root.current` switches before layout effects and after mutation
  - layout destroys/creates, class lifecycles/callbacks, and ref attaches match React order
  - passive unmounts run before passive mounts in deferred passive flush
  - deleted-tree passive unmounts are parent-to-child
  - per-fiber hook effect ring order for insertion/layout/passive effects
- Concurrency/Suspense:
  - Suspense ping/retry lane behavior
  - transition pending state and entanglement across async action scopes
  - offscreen hidden subtree update behavior
  - hydration lane bumping and fallback-to-client-render behavior

## Proposed follow-up implementation tasks

- Add a `fast-react-lanes` module with lane constants, lane group masks, bitset helpers, `LaneMap<T>`, and tests comparing constants against React 19.2.6.
- Add a scheduler module compatible with `scheduler@0.27.0` public behavior, including task/timer heaps and host callback abstraction.
- Define arena-backed `Fiber`, `FiberRoot`, `UpdateNode`, and hook/effect node layouts before implementing render logic.
- Implement root scheduler state and `getNextLanes` before any component reconciliation work. This should be a standalone tested unit.
- Implement class/root and hook update queues with circular pending queues and rebase semantics.
- Implement complete-work lane/flag bubbling and commit phase traversal from `flags`/`subtreeFlags`.
- Add a minimal test renderer only after lane, queue, and commit traversal primitives exist.
- Create React comparison tests for scheduler, lanes, queues, and effect order before optimizing.
- Treat any earlier scaffold that has flat priorities, FIFO queues, or a global effect list as disposable. Breaking that shape early is cheaper than preserving a root-cause mismatch.

## Completion checklist

- Objective covered: investigated scheduler, fiber, lanes, update queues, and effect-list/commit semantics for React 19.2.6.
- Required sections present:
  - Objective
  - Sources and commands used
  - Scheduler and priority findings
  - Lane model findings
  - Fiber and update queue findings
  - Effect and commit phase implications
  - Rust data structure recommendations
  - Behavioral tests required before implementation
  - Proposed follow-up implementation tasks
  - Completion checklist
- Handoff summary: Fast React should preserve React's internal scheduling model rather than simplify it. Lanes are bitsets with root bookkeeping; updates are insertion-ordered but priority-skipping and rebased; commit traversal is flag/mask based with per-fiber hook effect rings; Scheduler public APIs are observable if shipped.
- Changed files: `worker-progress/worker-007-scheduler-fiber.md`.
- Files intentionally not changed: all implementation files and all project planning/orchestration files.
- Commands run: listed in `Sources and commands used`.
- Subagents used: three read-only explorer checks for scheduler/root scheduling, lanes/update queues, and effects/commit traversal. Their conclusions were incorporated and are summarized above.
- Unresolved risks/follow-up tasks:
  - React 19.2.6 includes feature-flagged paths for View Transition, Gesture Transition, Activity, Offscreen, Suspensey commits, hydration, profiling, and DevTools. Implementation workers must decide which flags are in scope for the first compatibility slice.
  - The exact JS binding strategy may affect callback rooting, wakeable identity, and scheduler host callback transport.
  - React's internal DEV warnings and `act` behavior need a separate conformance pass.
  - The source package is authoritative for internals; npm packages are minified/shipped surfaces. Some internal feature flags may differ by build target and must be verified when scaffold targets are chosen.
- Quality review complete: conclusions are tied to React source, not inferred API names.
- Maintainability review complete: recommendations keep React's invariants explicit and testable.
- Performance review complete: recommendations use bitsets, fixed lane maps, arenas, and heaps on hot paths.
- Security review complete: report calls out JS callback/rooting and reentrancy/lifetime risks at the Rust boundary.
