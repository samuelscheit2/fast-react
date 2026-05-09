# worker-099-core-hook-state-queue-plan

## Objective

Produce a report-only plan for hook state queues, eager state,
render-phase updates, base queues, and optimistic updates.

Write scope honored: this report only writes
`worker-progress/worker-099-core-hook-state-queue-plan.md`. No Rust,
JavaScript, package, test, or orchestration source files were modified.

Goal tool status:

- `create_goal` was available and called for this exact objective before
  research in the relaunch.
- `get_goal` was available and returned status `active` with objective
  `Produce a report-only plan for hook state queues, eager state,
  render-phase updates, base queues, and optimistic updates.`
- `update_goal(status: "complete")` was not called before this report was
  complete, per worker instructions.

## Summary

Fast React should model hook state queues as per-hook lane-filtered circular
queues, owned by the function component hook list and processed by the
reconciler render dispatcher. The root cause is not "store setState actions";
it is preserving React's insertion order while rendering only lanes included in
the current render, retaining skipped updates for later rebase, supporting a
no-schedule eager bailout update, and treating render-phase and interleaved
updates as separate timing classes.

The plan should not collapse hook state queues into class or HostRoot queues.
They can share lane bitsets, arena IDs, and low-level circular-ring helpers,
but hook queues need `baseState`, circular `baseQueue`, `lastRenderedReducer`,
`lastRenderedState`, render-phase rerender behavior, and optimistic
`revertLane` handling that class and HostRoot queues do not have.

Hook effect rings must stay separate. A hook state queue belongs to a stateful
hook slot and stores actions, lanes, eager state, and optimistic metadata. The
effect ring belongs to the function component fiber update queue and stores
effect callback/dependency metadata. The only shared concepts should be stable
`FiberId`, hook slot ordering, and optional diagnostics IDs.

Recommended sequence:

1. Finish or merge fiber/root topology and root lane bookkeeping before any
   public hook behavior is claimed.
2. Add core lane-aware ring primitives and typed hook queue records over stable
   IDs.
3. Add reconciler hook list ownership and render dispatcher state.
4. Implement `useState` and `useReducer` queue processing with pending/base
   merge, skip/rebase, eager state reuse, and no-lane clones.
5. Add dispatch semantics: eager state bailout, render-phase rerenders,
   interleaved concurrent staging, transition entanglement, and optimistic
   `revertLane` behavior.
6. Add focused Rust unit tests before JS conformance oracles, then add
   React 19.2.6 black-box oracles only after public facades route through the
   Rust queues.

Breaking changes should be accepted if they remove a FIFO queue, renderer-local
priority field, raw JS callback/value storage, or any shortcut that mutates a
host tree directly from a hook dispatch.

## Evidence Gathered

Required merged worker evidence:

- `worker-progress/worker-007-scheduler-fiber.md`: establishes lane bitsets,
  double-buffered fibers, circular/rebased update queues, concurrent update
  staging, eager hook state, render-phase hook updates, optimistic
  `revertLane`s, hidden updates, and per-fiber hook effect rings.
- `worker-progress/worker-070-core-update-queue-plan.md`: provides the general
  update queue plan and confirms hook queues need a separate processor from
  class and HostRoot queues.
- `worker-progress/worker-078-hook-effect-ring-plan.md`: confirms effect
  storage is a per-fiber circular ring and must not be mixed with hook state
  queues.

Additional local evidence:

- `crates/fast-react-core/src/lib.rs`: current core exports elements, symbols,
  compatibility targets, and lane primitives only. It has no fiber, hook, root,
  queue, or effect modules.
- `crates/fast-react-core/src/lane.rs`: current `Lane`, `Lanes`, `LaneIndex`,
  and `LaneMap<T>` primitives are the correct basis for hook queue lanes.
- `crates/fast-react-reconciler/src/lib.rs`: reconciler remains a placeholder;
  there is no function component render path, hook dispatcher, fiber arena,
  root scheduler, or update queue processing yet.
- `worker-progress/worker-096-native-root-boundary-plan.md`: callback and value
  handles that survive a call need explicit JS-owned rooting and disposal. Hook
  queues must therefore store opaque action/state/reducer handles in future JS
  integration, not raw JS values.

Pinned React 19.2.6 source evidence, using normalized source paths:

- `packages/react-reconciler/src/ReactFiberHooks.js`: hook `Update` includes
  `lane`, `revertLane`, `action`, `hasEagerState`, `eagerState`, optional
  gesture metadata, and `next`.
- `packages/react-reconciler/src/ReactFiberHooks.js`: hook `UpdateQueue`
  includes circular `pending`, transition `lanes`, `dispatch`,
  `lastRenderedReducer`, and `lastRenderedState`.
- `packages/react-reconciler/src/ReactFiberHooks.js`: each `Hook` includes
  `memoizedState`, `baseState`, circular `baseQueue`, queue pointer, and `next`
  hook pointer.
- `packages/react-reconciler/src/ReactFiberHooks.js`: `updateReducerImpl`
  merges pending and base circular queues, strips `OffscreenLane`, skips
  insufficient lanes, clones skipped updates, clones later applied updates with
  `NoLane`, applies eager state when valid, handles optimistic `revertLane`,
  updates `baseState` and `baseQueue`, and resets queue transition lanes when
  the base queue is empty.
- `packages/react-reconciler/src/ReactFiberHooks.js`: `dispatchSetStateInternal`
  computes eager state only when the fiber and alternate have no pending lanes;
  if `Object.is` says the eager state equals the current state, React queues a
  no-lane update and avoids scheduling root work.
- `packages/react-reconciler/src/ReactFiberHooks.js`: `dispatchReducerAction`
  does not use the eager bailout path in React 19.2.6, even though reducer
  queues still carry `lastRenderedReducer` and generic update nodes still carry
  eager-state fields.
- `packages/react-reconciler/src/ReactFiberHooks.js`: render-phase updates are
  written to the same hook queue pending ring for the current render pass,
  force rerender, are processed without lane checks by the rerender dispatcher,
  and are cleared on unwind.
- `packages/react-reconciler/src/ReactFiberHooks.js`: `useOptimistic` resets
  `baseState` to the passthrough value on each update, does not use eager
  state, and does not support render-phase updates.
- `packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`: concurrent
  and interleaved updates are staged in a flat buffer of fiber, queue, update,
  and lane tuples, then appended to circular pending rings only when it is safe
  to finish queueing concurrent updates.
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`: a root tracks
  interleaved updated lanes separately from render-phase updated lanes, and
  finishes queueing concurrent updates when preparing fresh work and after
  render completion/interruption.
- `packages/react-reconciler/src/__tests__/ReactInterleavedUpdates-test.js`:
  interleaved updates scheduled while a concurrent render is in progress must
  not affect the current render and must retain ordering relative to later
  updates.

Nested-agent hypothesis checks:

- Spawned a read-only explorer to challenge React hook queue invariants,
  including eager state, render-phase updates, interleaved updates, and
  optimistic `revertLane` behavior.
- Spawned a read-only explorer to challenge local crate boundaries, future
  write scopes, hook state/effect separation, and Rust test strategy.
- The semantic explorer found no material coverage gaps. It recommended two
  tighteners that are incorporated below: avoid blindly clearing `queue.lanes`
  whenever a newly produced base queue becomes empty, and keep eager bailout
  scoped to the `useState` dispatch path rather than treating it as generic
  `useReducer` eager validation.
- The scope explorer confirmed report-only status, no trailing whitespace,
  `git diff --check`, and no local path leaks, but found that the report needed
  this explicit goal-tool record and verification-command record.

## Required Data Model

### Hook list and queue ownership

Function component hooks should be stored as an ordered linked list or
arena-linked list on the function component fiber's `memoized_state`, matching
React's hook slot order. The implementation should use stable IDs rather than
Rust references:

- `FiberId`: owning function component fiber.
- `HookId`: hook slot in a fiber's hook list.
- `HookQueueId`: shared state queue for one hook slot.
- `HookUpdateId`: update node in an arena or slab.
- `ReducerHandle`: opaque reducer identity for queue
  `last_rendered_reducer` tracking and `useState` eager-dispatch eligibility.
- `StateHandle`: opaque state value owned by the relevant Rust or JS boundary.
- `ActionHandle`: opaque action value or updater function handle.
- `DispatchHandle`: stable public dispatch closure handle that routes to a
  fiber and queue through validated IDs.

The hook record should include:

- `memoized_state`
- `base_state`
- `base_queue`: circular tail pointer to the last unprocessed/rebase update
- `queue`
- `next`

The hook queue record should include:

- `pending`: circular tail pointer for updates not yet merged into the base
  queue
- `lanes`: transition lanes used for queue-level entanglement
- `dispatch`
- `last_rendered_reducer`
- `last_rendered_state`

The hook update record should include:

- `lane`
- `revert_lane`
- `action`
- `has_eager_state`
- `eager_state`
- optional gesture transition metadata behind an explicit feature policy
- `next`

Do not force class, HostRoot, hook state, and hook effect records through one
generic queue type. They can share ID/ring utilities, but each processor has
different invariants.

### Separation from hook effect rings

Hook state queues and hook effect rings should remain separate in memory and
API shape:

- State queue location: stateful hook slot, reached from the hook list.
- Effect ring location: function component fiber update queue, reached from
  `last_effect`.
- State queue payload: actions, eager states, lanes, revert lanes, dispatch
  handles.
- Effect ring payload: create/destroy callbacks, dependencies, and hook effect
  phase flags.
- Shared IDs: `FiberId` and hook call order for diagnostics; optionally
  `HookId` if DevTools or debugging wants to correlate a state hook with an
  effect hook position.

Future code should avoid naming a function component update queue as a hook
state queue. React uses the function component update queue for effects,
events, store checks, and memo cache; state queues live on individual hooks.

## Queue Processing Invariants

### Pending ring merge

Pending updates are appended as a circular ring with the queue storing the tail
pointer. The first append sets `update.next = update`; later appends splice the
new update after the tail and make it the new tail.

At update render time, `queue.pending` is merged into `hook.baseQueue`.
If both rings exist, merge by swapping the first pointers:

```text
base_first = base_tail.next
pending_first = pending_tail.next
base_tail.next = pending_first
pending_tail.next = base_first
```

The resulting tail is the old pending tail. After the merge, clear
`queue.pending`. The current hook's `baseQueue` must be updated to the merged
tail so an aborted work-in-progress render does not lose pending updates.

The merge preserves insertion order. Do not sort by lane.

### baseQueue and baseState

`baseState` is the state before the first retained base update. `baseQueue` is
the circular ring of updates that were skipped or must be replayed for rebase.

If `baseQueue` is empty, `memoizedState` normally equals `baseState`. The
notable exception is `useOptimistic`, which receives a fresh passthrough value
and resets `baseState` on each update render.

When an update is skipped for insufficient priority:

- clone it into the new base queue with its effective lane;
- if this is the first skipped update, set `newBaseState` to the state before
  the skipped update;
- merge its lane into the currently rendering fiber's remaining lanes;
- mark skipped update lanes for root bookkeeping.

After the first skip, later normal updates that are applied in this render must
also be cloned into the new base queue with `NoLane` and no duplicate side
effect. `NoLane` is intentionally never skipped, so a future lower-priority
render can replay the full sequence from `newBaseState` without losing
ordering.

### Lane filtering and hidden updates

Each hook update carries a lane. Queue processing checks whether the update's
effective lane is included in the current render lanes.

Hidden Offscreen updates add `OffscreenLane` to the update lane. Processing
must strip `OffscreenLane` before priority checks and use the root's render
lanes when deciding whether a hidden update should be applied. A hidden update
is not just a lower-priority normal update; it carries hidden-tree context that
root lane bookkeeping must preserve.

Queue transition lanes are not the same as root pending lanes. `queue.lanes`
records a superset used to entangle transition updates. When the base queue is
absent on entry, React can clear `queue.lanes`; later transition dispatch also
prunes queue lanes by intersecting with root pending lanes before entanglement.
Future code should not blindly clear `queue.lanes` just because a newly
produced base queue becomes empty.

## Eager State Bailout

React 19.2.6's eager hook optimization is a queue operation, not only a
scheduler shortcut.

For `useState`, dispatch may compute eager state before scheduling only when:

- the source fiber has no pending lanes;
- the alternate fiber is missing or also has no pending lanes;
- the queue has a `lastRenderedReducer`;
- the reducer call does not throw.

If the eager state equals `lastRenderedState` by React's `Object.is` semantics,
React still enqueues the update with `NoLane`, but avoids scheduling a render.
The no-lane update is needed because a later render for another reason may
need to rebase that action against a changed reducer or changed base queue.

If the eager reducer call throws, suppress the dispatch-time error and let the
render phase throw it again. Fast React should not expose a different error
timing from the eager path.

`useReducer` dispatch does not take this eager bailout path in React 19.2.6.
However, the shared hook update processor still needs `has_eager_state` and
`eager_state` fields because `useState` is implemented through the reducer
processor and eager updates are replayed there. There is no per-update reducer
identity stored for generic eager validation; `updateReducerImpl` consumes
`has_eager_state` directly when the update carries an eager value from the
`useState` dispatch path.

Rust test reducers can use deterministic pure functions first. JS-facing eager
state needs a later `Object.is` and callback/value handle boundary before it
can claim public compatibility.

## Render-Phase Updates

Render-phase hook updates are updates to the currently rendering fiber or its
alternate. They are local to the function component render pass.

Required behavior:

- detect render-phase updates by comparing the dispatch fiber with the
  currently rendering fiber or alternate;
- append the update to the hook queue pending ring;
- set per-render flags indicating that a rerender is required;
- rerender the function component from the start of the hook list until no
  render-phase updates remain or the rerender limit is reached;
- process render-phase updates through the rerender dispatcher without lane
  checks;
- clear `queue.pending` for processed render-phase queues;
- if the render unwinds or throws, clear render-phase pending queues from
  processed hooks so they do not leak into the next render;
- persist rerender state to `baseState` only when the hook has no base queue.

Do not route render-phase hook updates through the root scheduler. React treats
local hook render-phase updates differently from normal render-phase root
updates, which are tracked on root render-phase lanes and warned about.

`useOptimistic` does not support render-phase updates. Its dispatch should
throw for direct optimistic updates during render, while the related
start-transition path has separate warning behavior.

## Interleaved And Concurrent Updates

In React 19.2.6, interleaved hook updates are represented by concurrent update
staging, not by a per-queue `interleaved` field. An interleaved update is an
external update that arrives while a root is already rendering.

Fast React should model this as a reconciler-level staging buffer:

```text
ConcurrentUpdateEntry {
  fiber: FiberId,
  queue: Option<HookQueueId>,
  update: Option<HookUpdateId>,
  lane: Lane,
}
```

Enqueueing a normal hook update should:

- push `(fiber, queue, update, lane)` into the staging buffer;
- immediately merge `lane` into the source fiber and alternate fiber lanes so
  eager bailout and work detection see pending work;
- return the HostRoot found by walking the fiber return path;
- schedule root work only when a root exists and a real lane is present;
- entangle transition updates using `queue.lanes` and root pending lanes.

Finishing the staging buffer should:

- append each staged update to its queue's circular `pending` ring;
- mark update lanes from the source fiber to the root;
- propagate child lanes up the return path;
- record hidden updates when a hidden Offscreen ancestor is present;
- reset the staged lanes accumulator.

The work loop must track interleaved root updated lanes separately from
render-phase root updated lanes. Interleaved updates that arrive during a
concurrent render must not be appended to the main queue soon enough to affect
the current render after the relevant hook queue has already been processed.
They should flush in a later render while preserving order relative to updates
scheduled afterward.

The eager bailout no-lane path still uses the concurrent staging machinery. If
no render is in progress, the staging buffer must be flushed immediately so the
no-lane update does not leak indefinitely without scheduled work.

## Optimistic Updates And Revert Lanes

`useOptimistic` uses the same hook queue processor but different dispatch and
base-state rules.

Mount behavior:

- `memoizedState` and `baseState` start as the passthrough value;
- the queue has no eager reducer or eager state;
- dispatch is a distinct optimistic dispatch that can throw on render-phase
  usage.

Update behavior:

- reset `baseState` to the latest passthrough value before processing the
  queue;
- default the reducer to the basic state reducer when no reducer is provided;
- process the queue through the same `updateReducerImpl` shape;
- during rerender, replay pending optimistic updates through the normal update
  implementation because render-phase optimistic updates are unsupported.

Dispatch behavior:

- optimistic updates normally use `SyncLane`, or `GestureLane` behind an
  explicit gesture-transition feature policy;
- `revertLane` is the transition lane associated with the current transition
  or async action;
- optimistic updates do not use eager state;
- optimistic updates are synchronous and do not call normal transition
  entanglement at dispatch time.

Processing behavior:

- if an optimistic update's normal lane is eligible and its `revertLane` is
  also included in the current render lanes, skip the update as reverted;
- if `revertLane` is not included, apply the update and clone it into the new
  base queue with `NoLane` plus the original `revertLane`;
- mark the `revertLane` as skipped/remaining work so the optimistic state can
  be removed when the associated transition finishes;
- if the optimistic update is part of an entangled async action, preserve the
  suspension behavior that batches it with later action updates.

This means a boolean "optimistic" flag is insufficient. The queue needs both
the visible update lane and the independent revert lane.

## Rust Ownership And Boundary Plan

Use arenas or slabs with generational IDs for hooks, queues, and updates.
Avoid raw Rust references in queue nodes because current and work-in-progress
fibers share queues, clone hook nodes, abort renders, and replay from current.

The first pure Rust implementation can use typed fake handles for state,
actions, reducers, and dispatches. Public JS integration must wait for a
handle/rooting boundary:

- action functions and reducer functions must be rooted JS handles;
- eager state values must be JS-aware and compared by React `Object.is`;
- dispatch handles must validate root, fiber, queue, and environment ownership;
- thrown reducer/action errors must route through render or dispatch timing
  compatible with React;
- stale hook, queue, or update IDs must fail closed.

The core crate should not know about DOM/native host instances. Hook queue
records are renderer-agnostic, but scheduling, return-path root lookup,
render-phase detection, and hidden Offscreen context belong in reconciler
state.

## Future Implementation Slices

### 1. Core hook queue primitives

Write scope:

- `crates/fast-react-core/src/hook_state_queue.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-core-hook-state-queue-primitives.md`

Task:

- Add ID newtypes or generic ring helper traits for `HookUpdateId`,
  `HookQueueId`, and circular tail-pointer operations.
- Add lane filter result types for applied, skipped, no-lane, hidden, and
  optimistic-revert decisions.
- Keep fiber traversal, dispatch closures, JS handles, and root scheduling out
  of this slice.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Unit tests for empty/single/multiple ring append, ring merge by first-pointer
  swap, stable iteration order, no-lane inclusion, hidden-lane stripping, and
  invalid/stale ID rejection.

### 2. Reconciler hook list and queue attachment

Write scope:

- `crates/fast-react-reconciler/src/hooks/mod.rs`
- `crates/fast-react-reconciler/src/hooks/state_queue.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-hook-list-state-queues.md`

Task:

- Add hook list records on function component fibers with `memoized_state`,
  `base_state`, `base_queue`, queue, and next hook IDs.
- Add hook queue records with pending tail, queue lanes, dispatch handle,
  last rendered reducer, and last rendered state.
- Add mount/update hook cloning rules that preserve current/WIP queue sharing
  while cloning render-owned hook fields.

Verification:

- Focused reconciler unit tests for mount hook order, update hook cloning,
  "rendered more hooks" and "too few hooks" invariants, current/WIP queue
  sharing, aborted WIP preserving current queue state, and no effect ring data
  stored in state queues.

### 3. Hook reducer queue processing

Write scope:

- `crates/fast-react-reconciler/src/hooks/state_queue.rs`
- `crates/fast-react-reconciler/src/hooks/reducer.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-hook-reducer-processing.md`

Task:

- Implement pending-to-base circular merge.
- Implement lane-filtered reducer processing for `useState` and `useReducer`.
- Clone skipped updates and later applied no-lane rebase updates.
- Update `memoized_state`, `base_state`, `base_queue`, and
  `last_rendered_state`.
- Handle queue transition lane cleanup on the no-baseQueue entry path and
  later transition entanglement pruning.

Verification:

- Tests for pending/base merge, insertion order, insufficient-lane skips,
  rebase after a skip, no-lane clones, reducer identity changes, direct
  consumption of eager state carried by `useState` dispatch, hidden update
  filtering, and queue lane cleanup.
  Queue lane cleanup should distinguish the no-baseQueue entry path from later
  transition entanglement pruning.

### 4. Hook dispatch and eager bailout

Write scope:

- `crates/fast-react-reconciler/src/hooks/dispatch.rs`
- `crates/fast-react-reconciler/src/hooks/state_queue.rs`
- `crates/fast-react-reconciler/src/concurrent_updates.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-hook-dispatch-eager.md`

Task:

- Implement `useState` dispatch with lane request, eager state computation,
  no-lane eager bailout enqueue, root scheduling, and transition entanglement.
- Implement `useReducer` dispatch without the eager bailout shortcut.
- Use fake reducer/action/state handles until JS rooting and `Object.is`
  semantics exist.

Verification:

- Tests for eager equal-state bailout without scheduling, no-lane update
  retained for later rebase, eager different-state scheduling, eager reducer
  throw deferred to render, dispatch rejecting stale queue IDs, and
  `useReducer` not taking the eager shortcut.

### 5. Render-phase update rerender loop

Write scope:

- `crates/fast-react-reconciler/src/hooks/render_phase.rs`
- `crates/fast-react-reconciler/src/hooks/dispatch.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-hook-render-phase-updates.md`

Task:

- Add currently-rendering-fiber/hook dispatcher state.
- Detect render-phase hook updates.
- Append render-phase updates to queue pending rings.
- Rerender until stable or until the rerender limit is hit.
- Clear render-phase queues on unwind.

Verification:

- Tests for local setState during render, multiple rerenders, rerender limit,
  lane-free render-phase application, cleanup after thrown render, no root
  scheduler call for local hook render-phase updates, and state/base-state
  persistence only when no base queue exists.

### 6. Interleaved concurrent update staging

Write scope:

- `crates/fast-react-reconciler/src/concurrent_updates.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/hooks/dispatch.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-hook-interleaved-updates.md`

Task:

- Add a reusable staging buffer of fiber, queue, update, and lane IDs.
- Mark source fiber and alternate lanes immediately.
- Finish queueing staged updates at the same work-loop boundaries as React.
- Track interleaved root lanes separately from render-phase root lanes.
- Record hidden updates from hidden Offscreen ancestors.

Verification:

- Tests for staged append order, no-current-render visibility for interleaved
  updates, immediate fiber/alternate lane marking, child lane propagation,
  hidden update marking, no-lane eager bailout immediate flush outside render,
  and ordering of interleaved updates relative to later updates.

### 7. Optimistic updates and revert lanes

Write scope:

- `crates/fast-react-reconciler/src/hooks/optimistic.rs`
- `crates/fast-react-reconciler/src/hooks/state_queue.rs`
- `crates/fast-react-reconciler/src/hooks/dispatch.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-hook-optimistic-updates.md`

Task:

- Add `useOptimistic` queue mount/update/rerender behavior.
- Reset base state from passthrough on update.
- Add optimistic dispatch with sync lane and transition `revertLane`.
- Apply, retain, and revert optimistic updates according to render lanes.
- Keep gesture transition fields behind a loud feature policy.

Verification:

- Tests for passthrough base reset, optimistic apply, optimistic retention with
  no-lane plus revert lane, revert when transition lane renders, unsupported
  render-phase optimistic updates, async-action entanglement placeholders, and
  gesture feature fail-closed behavior.

### 8. Public conformance oracles

Write scope:

- `tests/conformance/src/hook-state-queue-*.mjs`
- `tests/conformance/scripts/*hook-state-queue*.mjs`
- `tests/conformance/test/hook-state-queue-*.test.mjs`
- `tests/conformance/oracles/react-19.2.6-hook-state-queue-*.json`
- `worker-progress/worker-hook-state-queue-conformance-oracles.md`

Task:

- Add black-box React 19.2.6 scenarios for `useState`, `useReducer`,
  render-phase updates, eager bailout behavior, transition updates,
  interleaved updates, hidden Offscreen updates, and `useOptimistic` where
  public APIs expose it.
- Keep Fast React compatibility claims false until root scheduling, function
  component rendering, and a public renderer facade route through the Rust
  queues.

Verification:

- `npm test --workspace @fast-react/conformance`
- Oracle regeneration byte-compare.
- Existing temp/local path leak guard.
- Scenario status count checks showing unsupported or known-mismatch Fast
  React observations until implementation is wired.

## Focused Rust Test Strategy

Core tests should be pure data-structure tests:

- circular pending append preserves order;
- pending/base merge preserves order through first-pointer swap;
- `NoLane` updates are never skipped;
- hidden update lanes strip `OffscreenLane` before priority checks;
- stale or wrong-owner update IDs fail closed;
- ring iteration handles empty and one-node rings.

Reconciler hook queue tests should use fake state/reducer/action handles:

- `useState` basic action and updater action;
- `useReducer` reducer invocation and reducer identity replacement;
- insufficient-lane skip and later rebase;
- applied update after first skip cloned with `NoLane`;
- base state is the state before the first skipped update;
- queue lanes are cleaned on the no-baseQueue entry path and pruned during
  later transition entanglement;
- eager state carried by `useState` dispatch is consumed directly during
  processing;
- eager equal state queues a no-lane update and does not schedule;
- eager thrown error is deferred to render;
- `useReducer` dispatch does not run eager bailout;
- render-phase updates rerender without root scheduling;
- render-phase updates are cleared on throw;
- interleaved updates are invisible to the current render and flush later;
- optimistic updates apply, stay in the base queue, and revert by
  `revertLane`.

Integration tests should wait for function component rendering and root
scheduling:

- hook dispatch schedules the correct root lane;
- transition hook updates entangle queue lanes with root pending lanes;
- higher-priority work interrupts lower-priority rendering without losing
  skipped hook updates;
- hidden Offscreen hook updates preserve root hidden-update bookkeeping;
- public React test-renderer or DOM scenarios match React 19.2.6 oracles.

## Quality, Maintainability, Performance, And Security

Quality:

- The plan follows React 19.2.6's actual queue shape and timing boundaries.
- It treats eager bailout and optimistic state as queue semantics, not surface
  shortcuts.

Maintainability:

- Keep React-adjacent names for `pending`, `baseQueue`, `baseState`,
  `lastRenderedReducer`, `lastRenderedState`, `revertLane`, and render-phase
  flags so future source comparisons are mechanical.
- Share only low-level ring helpers with class/HostRoot queues and effect
  rings.
- Keep feature-flagged gesture transition behavior behind explicit policy.

Performance:

- Use lane bitsets and arena/slab IDs on the hot path.
- Keep append and merge O(1).
- Avoid heap maps in queue processing; render-phase state can use direct queue
  pending rings plus per-render flags.
- Reuse staging buffers for concurrent updates.

Security:

- Do not store raw JS values, reducer functions, action functions, dispatches,
  thenables, or state objects in Rust queues.
- Use explicit rooted handles for JS values and callbacks in future native
  integration.
- Validate generational IDs so stale public dispatch handles cannot access
  reused fibers, hooks, queues, or updates.
- Run user reducers/actions only in the intended JS environment and phase.
- Do not include arena IDs or local paths in public errors unless a future
  diagnostics policy explicitly allows it.

## Risks Or Blockers

- Fiber topology and root lane bookkeeping are still prerequisites for real
  hook queue execution in this worktree.
- Function component rendering and hooks dispatcher state do not exist yet.
- Public JS `Object.is`, reducer/action invocation, thrown error timing, and
  callback/value rooting need a native/JS boundary before public compatibility
  claims.
- Interleaved updates depend on work-loop boundaries and root scheduler state,
  so they should not be implemented as a standalone hook queue field.
- `useOptimistic` depends on transition lane allocation and async action
  entanglement. A partial implementation should fail closed rather than
  silently treating it like `useState`.

## Commands Run

```sh
create_goal for the worker objective
get_goal after create_goal; returned status active for the worker objective
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,260p' worker-progress/worker-070-core-update-queue-plan.md
sed -n '1,260p' worker-progress/worker-078-hook-effect-ring-plan.md
wc -l WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md worker-progress/worker-007-scheduler-fiber.md worker-progress/worker-070-core-update-queue-plan.md worker-progress/worker-078-hook-effect-ring-plan.md
sed -n '260,620p' worker-progress/worker-007-scheduler-fiber.md
sed -n '260,760p' worker-progress/worker-070-core-update-queue-plan.md
sed -n '260,620p' worker-progress/worker-078-hook-effect-ring-plan.md
sed -n '260,620p' MASTER_PLAN.md
sed -n '260,620p' MASTER_PROGRESS.md
git status --short --untracked-files=all
rg --files crates worker-progress docs tests packages bindings
sed -n '1,260p' crates/fast-react-core/src/lib.rs
sed -n '1,360p' crates/fast-react-core/src/lane.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,260p' crates/fast-react-core/Cargo.toml
curl -L --fail --silent https://github.com/facebook/react/archive/refs/tags/v19.2.6.tar.gz
rg and sed over <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberHooks.js
rg and sed over <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js
rg and sed over <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberWorkLoop.js
sed over <react-19.2.6-source>/packages/react-reconciler/src/__tests__/ReactInterleavedUpdates-test.js
rg over worker-progress/worker-096-native-root-boundary-plan.md and worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,220p' docs/tasks/worker-099-core-hook-state-queue-plan.prompt.md
sed -n '1,160p' worker-progress/README.md
spawned two read-only nested explorer agents
wait_agent for both nested agents once before drafting
wait_agent for both nested agents after relaunch audit
sed -n '1,260p' worker-progress/worker-099-core-hook-state-queue-plan.md
sed -n '260,520p' worker-progress/worker-099-core-hook-state-queue-plan.md
sed -n '520,860p' worker-progress/worker-099-core-hook-state-queue-plan.md
git status --short --untracked-files=all
perl -ne 'print "$ARGV:$.:$_" if /[ \t]$/' worker-progress/worker-099-core-hook-state-queue-plan.md
rg -n '/[U]sers/|/[t]mp/|fast-react-worker-[0-9]|/[p]rivate/|/[v]ar/folders/' worker-progress/worker-099-core-hook-state-queue-plan.md
git diff --check
git diff --check -- worker-progress/worker-099-core-hook-state-queue-plan.md
git diff --no-index --check /dev/null worker-progress/worker-099-core-hook-state-queue-plan.md
git ls-files --others --exclude-standard worker-progress/worker-099-core-hook-state-queue-plan.md
```

No source tests were run because this is a report-only planning task. Scoped
verification instead checked status, trailing whitespace, local path leaks, and
diff whitespace. The no-index check exits non-zero because the report differs
from `/dev/null`; it produced no `--check` diagnostics.

## Changed Files

- `worker-progress/worker-099-core-hook-state-queue-plan.md`

## Recommended Next Tasks

1. Finish fiber topology and root lane bookkeeping workers before implementing
   hook queue execution.
2. Queue a core hook queue primitive slice with circular ring and lane-filter
   tests.
3. Queue reconciler hook list and function component dispatcher state before
   public hook behavior.
4. Implement hook reducer queue processing before dispatch eager bailout.
5. Add render-phase and interleaved update handling only after work-loop
   boundaries are available.
6. Add optimistic update support after transition lane allocation and async
   action entanglement hooks exist.
7. Add React 19.2.6 hook state queue conformance oracles after a renderer path
   can execute function components.

## Completion Checklist

- [x] Did not read `ORCHESTRATOR.md`.
- [x] Kept hook effect rings separate from hook state queues.
- [x] Covered `useState` and `useReducer` queue data.
- [x] Covered pending ring merge.
- [x] Covered `baseQueue` and `baseState`.
- [x] Covered eager state bailout.
- [x] Covered render-phase update storage and cleanup.
- [x] Covered interleaved/concurrent update staging.
- [x] Covered optimistic `revertLane` behavior.
- [x] Included future write scopes.
- [x] Included focused Rust test strategy.
- [x] Recorded `create_goal` and `get_goal` availability, active status, and
  objective.
- [x] Verified report-only scope with `git status --short --untracked-files=all`.
- [x] Verified no trailing whitespace in the report.
- [x] Verified no local path leaks in the report.
- [x] Verified `git diff --check`.
- [x] Verified the untracked report directly with `git diff --no-index --check`.
