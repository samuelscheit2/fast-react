# worker-080-reconciler-host-root-update-queue-plan

## Objective

Produce a report-only implementation plan for HostRoot update queues and
`update_container` APIs.

Write scope honored: this report is the only changed file. No Rust,
JavaScript, package, test, or orchestration source files were modified.

Goal tooling status: `create_goal` was available and was called before file
reads or verification. `get_goal` was also available immediately afterward and
reported the active objective as "Produce a report-only implementation plan for
HostRoot update queues and update_container APIs." with status `active`.

## Summary

Fast React should implement HostRoot updates as the class/root update queue
family from React 19.2.6, not as a direct root render shortcut. The root cause
is that `root.render`, test-renderer `update`, and `root.unmount` all enqueue
HostRoot updates whose lanes are selected before render work begins. The render
work loop later processes those updates against render lanes, rebases skipped
updates, schedules remaining lanes, and commits host mutations in a separate
phase.

The first HostRoot slice should therefore add reconciler-owned queue storage,
root update payloads, callback storage, transition entanglement hooks, and
internal `update_container` / `update_container_sync` APIs. It should not
create DOM nodes, mutate a host container, flush sync work, or expose public
React DOM root behavior. Public facades and real host commits must consume the
reconciler APIs after root scheduling and commit slices exist.

Worker 047 is unavailable in this worktree. `MASTER_PLAN.md` and
`MASTER_PROGRESS.md` mark it running, no
`worker-progress/worker-047-core-root-lane-bookkeeping.md` exists locally, and
no `crates/fast-react-core/src/root_lanes.rs` exists locally. This plan treats
root lane bookkeeping as an unmerged prerequisite and does not assume worker
047 output.

## Evidence Gathered

Required reports:

- Worker 007 establishes that React 19.2.6 requires lane bitsets, root lane
  bookkeeping, double-buffered fibers, circular/rebased update queues,
  concurrent update staging, transition entanglement, and mask-driven commit
  traversal. It rejects FIFO queues and flat priorities.
- Worker 044 records the React DOM root contract: `root.render(children)` calls
  `updateContainer(children, root, null, null)`, while `root.unmount()` clears
  the public handle, calls `updateContainerSync(null, root, null, null)`, then
  separately calls `flushSyncWork()` before unmarking the container.
- Worker 055 places HostRoot update queues below the public React DOM facade
  and above root scheduling/DOM mutation. It explicitly requires `{element}`
  payload semantics and no direct DOM mutation from public roots.
- Worker 070 provides the shared update queue model: circular pending rings,
  base queues, skipped-lane rebasing, callback collection, hidden callback
  hooks, and transition queue lanes.
- Worker 072 puts HostRoot queues after root lane bookkeeping and fiber/root
  records, and before root scheduler/work-loop slices.
- Worker 073 confirms test-renderer public `create`, `update`, and `unmount`
  must share the same `updateContainer` root update path rather than mutate the
  in-memory renderer directly.

Current local source evidence:

- `crates/fast-react-core/src/lane.rs` contains `Lane`, `Lanes`, `LaneIndex`,
  lane masks, and `LaneMap<T>`, but no root lane bookkeeping module.
- `crates/fast-react-reconciler/src/lib.rs` is still a placeholder with no
  `FiberRoot`, HostRoot fiber, update queue, root scheduler, or work loop.
- `crates/fast-react-host-config/src/lib.rs` already has opaque host types,
  host fiber tokens, and `HostScheduling`, but event priority is still a host
  associated type. The HostRoot queue slice should stay host-neutral.
- `packages/react-dom/client.js` still exports loud unsupported placeholders
  for `createRoot` and `hydrateRoot`.

Primary React 19.2.6 source evidence:

- `packages/react-reconciler/src/ReactFiberReconciler.js`: `updateContainer`
  requests a lane, then `updateContainerImpl` creates an update, assigns
  `update.payload = {element}`, stores an optional callback, enqueues the
  update, schedules work, and calls `entangleTransitions`. `updateContainerSync`
  uses `SyncLane` and delegates to the same implementation.
- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.js`: class and
  HostRoot queues use `baseState`, `firstBaseUpdate`, `lastBaseUpdate`, shared
  circular `pending`, shared transition `lanes`, shared hidden callbacks, and
  render-owned callbacks. Pending queues transfer into linear base queues
  before processing.
- `packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`: concurrent
  enqueues stage `(fiber, queue, update, lane)` entries, append to circular
  pending queues later, and mark source fiber and alternate lanes immediately.
- `packages/react-reconciler/src/ReactFiberBeginWork.js`: `updateHostRoot`
  clones and processes the HostRoot queue, then reads `nextState.element` for
  child reconciliation. DevTools depends on the root state key being named
  `element`.
- `packages/react-reconciler/src/ReactFiberLane.js`: transition entanglement is
  transitive, hidden updates add `OffscreenLane`, and finished lanes clear
  hidden update markers.
- `packages/react-dom/src/client/ReactDOMRoot.js`: public unmount calls
  `updateContainerSync(null, root, null, null)` and then `flushSyncWork()`;
  therefore `update_container_sync` should enqueue a sync null-element update,
  not own flushing or host mutation.

## Root-Cause Invariants

### HostRoot Queues Are Not FIFO

Updates are stored in insertion order, not sorted by lane. Lane priority only
decides whether an update is included in the current render. If an insufficient
lane is skipped, that update and all later updates must remain in a base queue
so a future lower-priority render can rebase deterministically.

The canonical `A1 B2 C1 D2` example must hold: a priority-1 render applies
`A1` and `C1`, but the later priority-2 render starts from the state after
`A1` and applies `B2 C1 D2`, producing the insertion-order final result.

### Pending Is A Shared Circular Ring

Each class/HostRoot queue has `shared.pending` as the tail of a circular
single-linked ring. Enqueue is O(1):

- empty ring: `update.next = update`
- non-empty ring: insert after `pending`, then replace the tail with `update`

During processing, the ring is detached into a linear pending segment and
appended to the base queue. If current and work-in-progress queues are distinct,
the same pending segment must also be appended to the current queue so an
aborted render does not drop updates.

### Base Queue Rebasing Preserves Skips

Queue processing should track:

- `new_state`, initially `queue.base_state`
- `new_base_state`, set to the state before the first skipped update
- `new_first_base_update` / `new_last_base_update`
- `new_lanes`, the remaining skipped lanes

When an update lane is not included in the current render lanes, clone it into
the new base queue with the same lane, payload, tag, and callback. When an
update is applied after the first skip, clone it into the new base queue with
`NoLane` and no callback so it will be rebased later but will not fire its
callback twice. `NoLane` clones must always be considered eligible.

Updates appended while `process_update_queue` is running must be picked up and
processed in the same pass when React does: when the current linear list ends,
check `shared.pending`, detach it, append it, clear `shared.pending`, and keep
processing.

### Hidden And Skipped Lanes Need Hooks

Hidden updates may carry `OffscreenLane` in addition to their real update lane.
Processing strips `OffscreenLane` before lane comparison. Hidden updates are
checked against root render lanes, while normal updates are checked against the
current render lanes. The HostRoot queue slice should provide the data hooks
and tests for this, even if full Offscreen behavior is implemented later.

Skipped lanes must be reported back to the work-in-progress fiber and root
work-loop state. With worker 047 unavailable, this should be an explicit
dependency/hook, not a local reimplementation of `get_next_lanes` or
root-lane algorithms inside the queue module.

### Callbacks Are Stored, Not Invoked By Enqueue

Internal root update APIs accept an optional callback even though public
`root.render` no longer accepts one. The update node should store a typed
callback handle. Processing applied updates collects callbacks on the
render-owned queue and marks callback work for commit. Commit slices invoke and
clear them later.

Skipped updates keep their callback on the skipped clone. Applied updates
cloned for future rebase after an earlier skip must have `callback = None` so a
callback cannot run twice. Hidden callbacks need shared hidden callback storage
and reveal hooks. Callback validation and JS lifetime/rooting belong at the
JS/native boundary; Rust queue code should not store raw JS values.

### Null Unmount Is A Root Payload

Unmount is not a special queue operation and not an immediate container clear.
`root.unmount()` schedules a SyncLane HostRoot update whose payload is still
the root-state partial shape `{element: null}`. In Rust this should be modeled
as `RootUpdatePayload { element: RootElement::None }` or an equivalent typed
handle, not as a missing payload and not as direct host deletion.

`update_container_sync` should return `SyncLane` and enqueue/schedule a sync
root update. Public `root.unmount` and `flushSync` remain responsible for
cross-root sync flushing after enqueue.

### Payload Key Must Remain `element`

React source and React DevTools both depend on the HostRoot state property name
`element`. Fast React can use a typed Rust representation internally, but the
boundary to JS/debug tooling must preserve the semantic shape `{element}`.
Tests should assert the root update payload field is specifically named or
exported as `element`, including the `null` unmount case.

### Transitions Entangle Through The Queue

After enqueueing a transition-lane update, React calls
`entangleTransitions(root, rootFiber, lane)`. The queue stores a shared
transition-lane superset:

1. Intersect `queue.shared.lanes` with still-pending root lanes to prune lanes
   that have already finished.
2. Merge in the new transition lane.
3. Store the merged lanes back on `queue.shared.lanes`.
4. Call `mark_root_entangled(root, new_queue_lanes)`.

The queue slice should expose this as a small hook into core root lane
bookkeeping. Until worker 047 or equivalent lands, tests should use a fake
entanglement recorder and must not duplicate the root-lane transitive
entanglement algorithm locally.

## Rust Module Boundary Plan

Prerequisites before this slice can fully implement behavior:

- Core root lane bookkeeping in `crates/fast-react-core/src/root_lanes.rs` or
  an equivalent merged module. This worktree does not have it.
- Reconciler fiber/root arena records: `FiberId`, `FiberRootId`, HostRoot
  fiber creation, `alternate`, `return`, `lanes`, `child_lanes`,
  `memoized_state`, `update_queue`, and root current handle.
- A callback/value handle policy so Rust stores opaque handles instead of raw
  JS values.

Recommended HostRoot queue slice:

- `crates/fast-react-reconciler/src/update_queue.rs`
  - `UpdateId`, `UpdateQueueId`, arena storage, and validated next links.
  - `UpdateTag::{UpdateState, ReplaceState, ForceUpdate, CaptureUpdate}` for
    class/root parity, even if HostRoot initially uses only `UpdateState`.
  - `ClassOrRootUpdate<StatePayload, CallbackHandle>` with `lane`, `tag`,
    `payload`, `callback`, and `next`.
  - `SharedQueue` with circular `pending`, transition `lanes`, and hidden
    callbacks.
  - `UpdateQueue` with `base_state`, `first_base_update`,
    `last_base_update`, shared queue ID, and render-owned callbacks.
  - Ring append, pending-to-base transfer, current/WIP queue append, and
    processing helpers.
- `crates/fast-react-reconciler/src/root_updates.rs`
  - `RootState` with at least `element`, `is_dehydrated`, and cache placeholder
    fields matching the future `FiberRoot` model.
  - `RootUpdatePayload` as a partial root-state update with an `element` field.
  - `RootElement` or `RootElementHandle` that can represent a React node list
    and `None` for unmount.
  - `update_container` and `update_container_sync` entry points.
  - `entangle_transitions_for_update` hook that delegates to root lane
    bookkeeping.
- `crates/fast-react-reconciler/src/update_priority.rs`
  - Owns `request_update_lane` later. The HostRoot queue API should call this
    module for async updates, but `update_container_sync` should pass
    `Lane::SYNC` directly.
- `crates/fast-react-reconciler/src/fiber.rs` and
  `crates/fast-react-reconciler/src/fiber_root.rs`
  - Own HostRoot fiber/root records and queue attachment. The queue module
    should use IDs and methods, not direct references that alias current and
    work-in-progress fibers.
- `crates/fast-react-core`
  - Remains the owner of lane bitsets, lane maps, event priority, and root lane
    bookkeeping once merged. Do not reimplement those algorithms in the
    reconciler.
- `packages/react-dom` and DOM adapter modules
  - Stay out of this slice. They can call `update_container` later, but they
    should not receive queue internals or own queue semantics.

This is a breaking-change boundary for the existing reconciler placeholder:
real root APIs should be new APIs instead of growing behavior inside
`render_mutation_placeholder`. The placeholder can remain as a loud scaffold
until callers migrate.

## `update_container` API Plan

The internal Rust API should mirror React's separation of concerns:

- Read `root.current`.
- Ask `request_update_lane(current)` for the async path.
- Create an update for that lane.
- Set payload to `{element}` using a typed root payload.
- Store an optional callback handle.
- Enqueue on the HostRoot update queue.
- If enqueue returns a root, record timing/profiling hooks if available,
  schedule the update on the fiber/root, and entangle transition lanes.
- Return the lane.

`update_container_sync` should use the same implementation with `Lane::SYNC`.
It may reserve the legacy passive-effect preflush branch as an explicit
unsupported/legacy hook, but Fast React's `createRoot` path should not depend
on legacy roots. It must not flush work itself.

Suggested API shape for implementation workers, names adjustable to local
style:

```rust
pub fn update_container(
    root_id: FiberRootId,
    element: RootElementHandle,
    parent_component: Option<FiberId>,
    callback: Option<CallbackHandle>,
    runtime: &mut ReconcilerRuntime,
) -> ReconcilerResult<Lane>;

pub fn update_container_sync(
    root_id: FiberRootId,
    element: RootElementHandle,
    parent_component: Option<FiberId>,
    callback: Option<CallbackHandle>,
    runtime: &mut ReconcilerRuntime,
) -> ReconcilerResult<Lane>;
```

For unmount, callers pass `RootElementHandle::none()` or equivalent. The update
payload must still be present and must still mean `{element: null}`.

`ReconcilerRuntime` should be an implementation detail that owns the fiber
arena, root arena, update arena, queue arena, callback/value handle tables,
lane selector, entanglement hook, and scheduler hook. Tests can replace the
scheduler and entanglement hook with recorders.

## Verification Plan

Pure queue unit tests in `fast-react-reconciler`:

- Circular pending queue append for empty, single, and multiple updates.
- Pending-to-base transfer detaches the ring, preserves insertion order, and
  appends to both current and work-in-progress queues when required.
- Base queue rebase with the `A1 B2 C1 D2` scenario.
- Insufficient-lane skipping clones skipped updates with callbacks intact.
- Applied updates after a skipped update are cloned with `NoLane` and no
  callback.
- `NoLane` updates are always processed.
- Updates appended during processing are detached from `shared.pending` and
  processed in the same pass.
- Skipped lanes are reported on the work-in-progress fiber without guessing
  root lane selection.
- Hidden update lanes strip `OffscreenLane` for priority checks and preserve
  hidden callback deferral hooks.
- Queue shared transition lanes reset or prune when the base queue/root pending
  lanes indicate finished work.

HostRoot API unit tests:

- `update_container` returns the lane selected by a fake lane source and
  enqueues exactly one HostRoot update.
- The update tag is `UpdateState`, lane is the requested lane, and payload is
  the typed equivalent of `{element}`.
- A `null`/none element goes through the same payload path as `{element: null}`
  for unmount.
- `update_container_sync` always returns `Lane::SYNC` and enqueues a SyncLane
  update.
- Optional callback handles are stored on the update but not invoked by
  enqueue or processing.
- Invalid callback values are rejected or warned at the JS/native boundary;
  Rust queue tests should use typed valid/invalid handle fixtures, not raw JS.
- Enqueue on an unmounted HostRoot fiber with no queue returns no root and does
  not schedule.
- Parent component context is stored as root context or pending context through
  an explicit context hook; it should not be silently ignored.
- Transition-lane updates call the entanglement hook with pruned queue lanes;
  non-transition lanes do not.
- The scheduler hook is called after successful enqueue; failed enqueue does
  not schedule.

No-DOM-mutation tests:

- Use a fake root plus fake scheduler/entanglement recorders and no host.
  Calling `update_container` should not require `MutationRenderer`.
- Add a fake host with counters for creation, append, insert, remove,
  clear-container, and text update operations. `update_container` and
  `update_container_sync` must leave all counters at zero.
- If `fast-react-test-renderer` is used as a verifier later, assert that its
  storage snapshots do not change until a separate work-loop/commit API runs.
- Public `root.unmount` integration tests should later prove that
  `update_container_sync(None)` enqueues first, cross-root `flush_sync_work`
  flushes separately, and container unmarking happens after the flush.

Required command checks for the implementation worker:

```sh
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check -- crates/fast-react-reconciler worker-progress/<worker-report>.md
```

If the worker touches core root lane hooks, also run the matching
`fast-react-core` tests and clippy command. If it touches the test renderer,
also run `cargo test -p fast-react-test-renderer --all-features`.

## Future Work Slices

1. Core root lane bookkeeping:
   `crates/fast-react-core/src/root_lanes.rs` plus tests for pending,
   suspended, pinged, warm, expired, hidden, entangled, transition, retry, and
   sync-upgrade behavior. Consume worker 047 if it merges first.
2. Reconciler fiber/root records:
   `fiber.rs`, `fiber_root.rs`, arena IDs, HostRoot construction, root state,
   queue attachment, root callbacks, and lifecycle state.
3. HostRoot update queue:
   `update_queue.rs` and `root_updates.rs` with all queue semantics above and
   no host mutation.
4. Reconciler update priority:
   `request_update_lane`, event-priority-to-lane conversion, transition lane
   reuse, render-phase lane fallback, and `flushSync` priority override hooks.
5. Root scheduler:
   root schedule list, microtask processing, sync flush, scheduler callback
   reuse/cancelation, and passive-effect preflush hooks.
6. Work loop and HostRoot begin-work:
   process HostRoot queues into `memoized_state.element` and reconcile child
   handles, with unsupported child tags failing before commit.
7. Commit skeleton:
   host mutation phases, `root.current` switch, callbacks, refs, and passive
   scheduling.
8. Public facade integration:
   React DOM and test-renderer roots call `update_container` only after the
   shared reconciler path can schedule and commit.

## Quality, Maintainability, Performance, And Security

Quality:

- This plan models the root cause: HostRoot updates are lane-filtered queue
  records processed by the reconciler, not immediate renderer operations.
- It keeps stable React 19.2.6 behavior separate from future hydration,
  Offscreen, transition tracing, and DOM facade concerns.

Maintainability:

- React names should stay recognizable: `base_state`, `first_base_update`,
  `last_base_update`, `shared.pending`, `shared.lanes`, `UpdateState`,
  `NoLane`, and `entangle_transitions`.
- Class/HostRoot queues can share low-level ring and rebase helpers. Hook
  queues should remain separate because eager state, reducer identity,
  render-phase updates, and optimistic `revertLane` have different invariants.

Performance:

- Use arena IDs and O(1) circular append; avoid heap maps on the queue hot
  path.
- Keep lane checks as bit operations over existing `Lane`/`Lanes` newtypes.
- Do not cross the JS/native boundary per update during processing except via
  opaque rooted handles.

Security:

- Do not store raw JS values or function pointers in Rust update nodes.
  Elements, callbacks, error handlers, refs, reducers, wakeables, and action
  handles need explicit rooting and disposal policy.
- Validate arena IDs/generations so stale public handles cannot access reused
  fibers or update nodes.
- User callbacks should run only in commit/act-controlled contexts with
  reentrancy guards, never during enqueue or queue processing.

## Risks Or Blockers

- Root lane bookkeeping is absent locally because worker 047 has not merged in
  this worktree.
- Reconciler fiber/root records do not exist yet, so update queues need an
  arena/ID foundation before implementation.
- Callback and element handle lifetime policy is unresolved at the JS/native
  boundary.
- Exact public timing cannot be claimed until root scheduling, sync flushing,
  and commit phases exist.
- Full hidden update behavior depends on Offscreen root/fiber state; this
  slice should provide data hooks without claiming Offscreen compatibility.
- A future DOM facade can accidentally bypass this work by mutating containers
  directly. That should be treated as a breaking root-cause bug.

## Delegated Checks

- Spawned read-only explorer `019e0eec-7679-7a41-9f39-9d4e0d796bb0` to
  challenge React 19.2.6 HostRoot queue and `updateContainer` source
  semantics.
- Spawned read-only explorer `019e0eec-8915-7301-ab97-b2a187fbdd87` to
  challenge local Rust module boundaries, worker 047 availability, and
  report-only verification checks.

Consumed findings:

- Both explorers confirmed worker 047 is unavailable locally and root lane
  bookkeeping remains a prerequisite.
- The source-semantics explorer confirmed the must-have invariants in this
  report: class-style HostRoot queue shape, `{element}` payloads, SyncLane
  `update_container_sync`, null unmount as `{element: null}`, circular pending
  transfer, lane-filtered rebasing, callback deferral, concurrent staging, and
  transition entanglement through `markRootEntangled`.
- It also called out two pitfalls that this plan intentionally avoids:
  entanglement happens after successful enqueue/scheduling, and null updates
  are not intrinsically synchronous because React DOM unmount uses
  `updateContainerSync(null)` while test-renderer unmount uses
  `updateContainer(null)`.
- The local-boundary explorer confirmed the current worktree has only core
  lane primitives, host-config scheduling/token traits, React DOM placeholders,
  and reconciler placeholders. It recommended the same module boundary and
  no-DOM-mutation tests recorded above.

## Commands Run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
git status --short
git status --short --untracked-files=all
sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,620p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,760p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,900p' worker-progress/worker-070-core-update-queue-plan.md
sed -n '1,700p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,760p' worker-progress/worker-073-test-renderer-update-model-plan.md
test -f worker-progress/worker-047-core-root-lane-bookkeeping.md
rg --files crates/fast-react-core/src crates/fast-react-reconciler/src crates/fast-react-host-config/src packages/react-dom tests/conformance
sed -n '1,260p' crates/fast-react-core/src/lib.rs
sed -n '1,760p' crates/fast-react-core/src/lane.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
rg -n "trait HostScheduling|EventPriority|schedule_microtask|current_update_priority|request_post_paint|wait_for_commit|Transition" crates/fast-react-host-config/src/lib.rs
sed -n '720,1040p' crates/fast-react-host-config/src/lib.rs
sed -n '1,220p' packages/react-dom/client.js
sed -n '1,220p' packages/react-dom/placeholder-utils.js
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberReconciler.js | sed -n '220,500p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberClassUpdateQueue.js | sed -n '1,760p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '760,860p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberBeginWork.js | rg -n "function updateHostRoot|processUpdateQueue|memoizedState|nextChildren|element|suspendIfUpdateReadFromEntangledAsyncAction" -C 4
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberLane.js | sed -n '820,1090p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberRootScheduler.js | rg -n "requestTransitionLane|currentEventTransitionLane|scheduleTaskForRootDuringMicrotask|performWorkOnRootViaSchedulerTask" -C 4
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactEventPriorities.js | sed -n '1,180p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberRoot.js | sed -n '150,250p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMRoot.js | rg -n "root\\.render|root\\.unmount|updateContainer\\(|updateContainerSync\\(|flushSyncWork|_internalRoot|null|Cannot update an unmounted root" -C 4
git diff --name-only
git diff --stat
git diff --check -- worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
git status --short --untracked-files=all
git ls-files --others --exclude-standard
rg -n "^## (Objective|Summary|Evidence Gathered|Root-Cause Invariants|Rust Module Boundary Plan|Verification Plan|Risks Or Blockers|Delegated Checks|Commands Run|Changed Files|Recommended Next Tasks|Completion Checklist)$" worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
rg -n "[ \\t]+$" worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
rg -n "<local/temp path patterns>" worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
rg -n "^- \\[ \\]" worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
sed -n '1,220p' worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
sed -n '220,620p' worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
```

Tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after goal setup.
- Spawned two read-only explorer agents for independent hypothesis checks.
- `wait_agent` for the React source-semantics explorer.

## Changed Files

- `worker-progress/worker-080-reconciler-host-root-update-queue-plan.md`

## Recommended Next Tasks

1. Merge or implement core root lane bookkeeping before HostRoot queue
   implementation.
2. Implement reconciler fiber/root arena records and queue attachment.
3. Implement HostRoot update queues and `update_container` /
   `update_container_sync` with fake scheduler and entanglement hooks.
4. Add root scheduler and work-loop slices before public React DOM or
   test-renderer facades claim root update behavior.
5. Add public conformance oracles only after the Rust path is routable from JS.

## Completion Checklist

- [x] Called `create_goal` before research, file reads, implementation, or
  verification.
- [x] Called `get_goal` and recorded the active goal status/objective.
- [x] Read the required worker brief, master plan/progress, and dependency
  reports.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Treated worker 047 as unavailable because it is not merged in this
  worktree.
- [x] Covered circular pending queues, base queue rebasing, skipped lanes,
  callbacks, null unmount updates, payload `{element}`, and transition
  entanglement hooks.
- [x] Specified Rust module boundaries and no-DOM-mutation tests for
  `update_container` / `update_container_sync`.
- [x] Folded in returned subagent findings.
- [x] Checked report-only scope with git status.
- [x] Checked scoped diff for whitespace.
- [x] Checked this report for concrete local temp path leaks.
