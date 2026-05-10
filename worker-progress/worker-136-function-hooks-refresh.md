# worker-136-function-hooks-refresh

## Objective

Produce a report-only refresh for the first function component and hook queue
vertical slice, sequenced after the root HostRoot path is stable.

Write scope honored so far: this worker writes only
`worker-progress/worker-136-function-hooks-refresh.md`.

## Goal Setup

- `create_goal` was called as the first action for the objective above.
- `get_goal` was called immediately after goal setup and returned status
  `active` with objective
  `Produce report-only refresh for the first function component and hook queue
  vertical slice, sequenced after the root HostRoot path is stable.`
- Goal thread ID returned by the tool: `019e0f9e-47db-72a0-b5b8-42408518999c`.

## Summary

The first function component and hook queue source work should start only after
the HostRoot render-phase path is accepted and stable. The current tree now has
core lane bookkeeping, event priorities, fiber topology, fiber flags, hook
effect flags, HostRoot/FiberRoot records, HostRoot update queues, concurrent
HostRoot staging, root scheduling records, and HostRoot work-in-progress
helpers. It still has no begin-work loop, no function component render path, no
hook list storage, no hook state queue, no function component update queue, no
effect ring storage, and no commit effect execution.

The refreshed split below keeps the first vertical slice mergeable by
separating:

1. hook list/data structures,
2. hook state update queues,
3. effect ring data,
4. reconciler dispatcher and `render_with_hooks`,
5. function component begin-work integration,
6. effect registration and commit-phase effect execution.

Public `react` hook facade compatibility remains out of scope for these source
workers. `packages/react/index.js` still exports hook placeholders, and no
public `useState`, `useReducer`, `useEffect`, or React DOM/test-renderer hook
behavior should be claimed until a native dispatcher bridge and React 19.2.6
black-box oracles prove it.

## HostRoot Gate

Do not start the reconciler function-component workers until the root HostRoot
path can, at minimum:

- create or reuse a HostRoot work-in-progress fiber from the current root,
- drain staged HostRoot updates into the HostRoot queue at the render boundary,
- process the HostRoot queue by `render_lanes` without losing skipped lanes,
- write the computed HostRoot state to the work-in-progress fiber,
- preserve current versus work-in-progress queue invariants across aborts,
- bubble child lanes and subtree flags without mutating current incorrectly,
- leave commit, host mutation, and public package behavior explicitly outside
  that gate if those slices are not yet accepted.

Core-only hook queue and effect ring primitives can be prepared immediately
after the HostRoot path lands because their tests do not need public renderers.
Reconciler `render_with_hooks`, function component `begin_work`, and effect
commit workers should wait for the HostRoot render path to provide stable
render-lane ownership and work-in-progress lifecycle hooks.

## Evidence Gathered

Required local reports:

- `worker-progress/worker-078-hook-effect-ring-plan.md`: per-fiber hook effect
  rings belong to the function component fiber update queue; commit traversal
  is tree/mask based, not a global fiber effect list.
- `worker-progress/worker-099-core-hook-state-queue-plan.md`: hook state
  queues need pending/base circular queues, lane filtering, eager state,
  render-phase updates, interleaved staging, hidden Offscreen handling, and
  optimistic `revertLane` behavior.
- `worker-progress/worker-100-reconciler-function-component-render-plan.md`:
  function component rendering is a retry state machine over hook cursors,
  dispatcher modes, context dependency bailouts, and unwind cleanup.
- `worker-progress/worker-112-core-hook-queue-implementation-plan.md`: first
  hook queue implementation should be pure Rust, lane-aware, JS-free, and
  below public hook facades.
- `worker-progress/worker-113-function-component-implementation-plan.md`:
  first function component source work should use fake invokers and fake host
  tests below DOM/test-renderer public APIs.

Current source evidence:

- `crates/fast-react-core/src/root_lanes.rs`, `event_priority.rs`,
  `fiber.rs`, `fiber_arena.rs`, `fiber_bubbling.rs`, `fiber_deletions.rs`,
  `fiber_flags.rs`, and `hook_effect_flags.rs` are present and exported.
- `FiberNode` already has React-shaped `memoized_state`, `update_queue`,
  `dependencies`, `lanes`, `child_lanes`, `flags`, `subtree_flags`, and
  `deletions` fields.
- `crates/fast-react-core/src/hook_effect_flags.rs` already has
  `HAS_EFFECT`, `INSERTION`, `LAYOUT`, and `PASSIVE` bitsets plus phase helpers.
- `crates/fast-react-reconciler/src/update_queue.rs` is explicitly a
  HostRoot/class-style queue module and currently implements HostRoot updates
  only.
- `crates/fast-react-reconciler/src/concurrent_updates.rs` stages
  HostRoot-shaped `(fiber, queue, update, lane)` tuples and marks source fiber
  lanes, but it is typed to `UpdateQueueHandle` and HostRoot `UpdateId`.
- `crates/fast-react-reconciler/src/work_in_progress.rs` only creates
  HostRoot work-in-progress fibers and rejects non-HostRoot fibers.
- `crates/fast-react-reconciler/src/lib.rs` still describes reconciliation as
  placeholder work and has no begin-work, complete-work, function component,
  hook, or commit modules.
- `packages/react/index.js` keeps public hooks as loud unimplemented functions.

React 19.2.6 source evidence from
`/Users/user/Developer/Developer/react-reference`, commit
`eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`, tag `v19.2.6`:

- `ReactFiberHooks.js` defines `Hook` as `memoizedState`, `baseState`,
  `baseQueue`, `queue`, and `next`.
- `ReactFiberHooks.js` defines hook updates with `lane`, `revertLane`,
  `action`, `hasEagerState`, `eagerState`, and circular `next`.
- `ReactFiberHooks.js` defines `UpdateQueue` with circular `pending`,
  transition `lanes`, `dispatch`, `lastRenderedReducer`, and
  `lastRenderedState`.
- `ReactFiberHooks.js` defines `FunctionComponentUpdateQueue` with
  `lastEffect`, `events`, `stores`, and `memoCache`.
- `ReactFiberHooks.js` resets `workInProgress.memoizedState`,
  `workInProgress.updateQueue`, and `workInProgress.lanes` at the start of
  `renderWithHooks`.
- `ReactFiberHooks.js` rerenders locally for render-phase updates with a fixed
  limit of 25 passes and resets the function component update queue between
  passes.
- `ReactFiberHooks.js` clears render-phase queue updates during unwind so they
  do not persist to the next root render.
- `ReactFiberHooks.js` appends hook effects to a per-fiber circular ring via
  `currentlyRenderingFiber.updateQueue.lastEffect`.
- `ReactFiberBeginWork.js` calls `prepareToReadContext`, `renderWithHooks`,
  `bailoutHooks`, and `bailoutOnAlreadyFinishedWork` for function components.
- `ReactFiberCommitEffects.js` iterates `finishedWork.updateQueue.lastEffect`,
  starts at `lastEffect.next`, filters with `(effect.tag & flags) === flags`,
  stores create return values on `effect.inst.destroy`, and clears destroy
  before invoking it on unmount.
- `ReactFiberCommitWork.js` runs insertion effects in the mutation partition,
  layout unmounts before layout mounts, and passive unmounts/mounts through the
  deferred passive traversal including deletion subtrees.

## Mergeable Source Workers

### 1. Core Hook List Data Structures

Purpose: add hook slot/list storage without reducer processing, dispatcher
state, effects, or public hook facades.

Suggested write scope:

- `crates/fast-react-core/src/hook.rs`
- `crates/fast-react-core/src/lib.rs`
- optionally `crates/fast-react-core/src/fiber_handles.rs` only for new opaque
  hook handles if the worker chooses to extend the existing handle macro.
- worker report only.

Exact boundary:

- Add stable ID or handle types for hook lists and hook slots.
- Add `HookSlot` storage shaped around `memoized_state`, `base_state`,
  `base_queue`, `queue`, and `next`.
- Store only opaque handles such as `StateHandle` plus hook queue/effect
  handles; do not store raw JS values, Rust references into the arena, or
  callback pointers.
- Provide append, first/next iteration, clone-from-current, and stale-ID
  validation helpers.
- Keep `FiberNode.memoized_state` as the fiber-level pointer to the first hook
  list entry.

Non-goals:

- no `useState` or `useReducer` semantics,
- no render-phase update retry logic,
- no effect ring nodes,
- no reconciler dispatcher,
- no `packages/react` changes.

Focused tests:

- first hook append sets the fiber hook head and a null/empty `next`,
- multiple hook appends preserve call order,
- update render clones current hooks into work-in-progress hooks without
  mutating current,
- stale or wrong-arena hook IDs fail closed,
- aborted work-in-progress hook lists can be discarded without changing current
  hook slots.

### 2. Core Hook State Update Queues

Purpose: implement the lane-aware hook state queue processor as pure Rust
primitives over the existing `Lane` and `Lanes` types.

Suggested write scope:

- `crates/fast-react-core/src/hook_state_queue.rs`
- `crates/fast-react-core/src/lib.rs`
- worker report only.

Exact boundary:

- Add `HookQueueId`, `HookUpdateId`, `HookUpdateLane`, `HookRevertLane`,
  `HookUpdate`, `HookQueue`, `HookQueueStore`, and process input/output types.
- Represent hook update lanes as `Lanes`, not a single `Lane`, so hidden
  updates can carry `update_lane | OffscreenLane` without weakening
  `Lane`.
- Implement circular pending-ring append and pending/base merge by swapping
  first pointers.
- Implement queue processing for `base_state`, `base_queue`, skipped updates,
  no-lane clones after the first skip, hidden updates, eager state reuse, and
  optimistic `revert_lane`.
- Add render-phase queue helpers that process pending updates without lane
  checks and clear those updates on unwind.
- Add generic staged hook update records for later concurrent staging, but do
  not wire them into the root scheduler yet.

Non-goals:

- no function component invocation,
- no public dispatch closures,
- no HostRoot queue refactor,
- no effect rings,
- no public JS state or action values.

Focused tests:

- pending updates append as a circular tail ring,
- pending and base rings merge in insertion order,
- insufficient lanes clone skipped updates and accumulate skipped lanes,
- applied updates after the first skip are cloned with no lane for rebase,
- hidden updates strip `OffscreenLane` and test eligibility against root render
  lanes,
- eager state is used when present and reducer identity is still valid,
- eager equal-state updates can be queued with no scheduling metadata without
  being dropped,
- render-phase updates process without lane checks and are cleared on unwind,
- optimistic updates apply until their `revert_lane` is included, then are
  skipped/reverted,
- stale update IDs and corrupt rings return errors instead of panicking.

### 3. Core Hook Effect Ring

Purpose: add per-function-fiber effect ring storage using the landed
`HookEffectFlags`.

Suggested write scope:

- `crates/fast-react-core/src/hook_effect.rs`
- `crates/fast-react-core/src/lib.rs`
- worker report only.

Exact boundary:

- Add `EffectId`, `EffectInstanceId`, `EffectNode`, `EffectInstance`,
  `DepsHandle`, and `FunctionComponentUpdateQueue` primitives.
- Store `destroy` on `EffectInstance`, not inline on `EffectNode`.
- Store create/deps/destroy as opaque handles suitable for later JS rooting.
- Implement O(1) circular ring append with `last_effect` as the tail.
- Implement ordered iteration from `last_effect.next`.
- Implement filtered iteration with `HookEffectFlags::contains_all`, matching
  React's `(effect.tag & flags) === flags`.

Non-goals:

- no dependency comparison against JS values,
- no create/destroy callback invocation,
- no fiber flag setting,
- no commit traversal,
- no public effect hooks.

Focused tests:

- empty ring has no effects,
- first append creates a self-loop and stores `last_effect`,
- later appends preserve hook declaration order,
- filtered iteration returns insertion/layout/passive effects only when all
  requested flags are present,
- equal-deps-style append can omit `HAS_EFFECT` while preserving the previous
  `EffectInstanceId`,
- stale effect IDs and corrupt rings fail closed,
- aborting an uncommitted ring releases fake create/deps handles without
  touching a committed destroy handle.

### 4. Reconciler Function Component Queue Store

Purpose: integrate function component update queues with `FiberNode.update_queue`
without regressing the stable HostRoot queue path.

Suggested write scope:

- `crates/fast-react-reconciler/src/function_component_queue.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- possibly `crates/fast-react-reconciler/src/update_queue.rs` if the worker
  performs a narrow queue-kind refactor.
- worker report only.

Exact boundary:

- Add a queue-kind layer or a separate validated store so
  `FiberNode.update_queue` can reference either a HostRoot queue or a function
  component queue without handle collisions.
- Preserve all existing HostRoot `UpdateQueueStore` behavior and public
  reconciler exports.
- Add function component queue records with `last_effect`, `events`, `stores`,
  and `memo_cache` fields, using opaque handles where later slices need real
  storage.
- Add helpers to create, attach, reset-for-rerender, and clone/copy a function
  component update queue.
- Reject wrong-kind queue access with a structured error.

Non-goals:

- no hook state queue processing,
- no dispatcher,
- no effect registration logic,
- no commit phases,
- no public hooks.

Focused tests:

- HostRoot queue tests continue passing unchanged,
- a function component fiber can attach a function component update queue,
- HostRoot queue APIs reject function component queue handles and vice versa,
- rerender reset clears effect/events/stores while preserving memo cache policy,
- bailout copying can point work-in-progress at the current queue without
  mutating current,
- stale queue handles fail closed.

### 5. Reconciler Dispatcher And `render_with_hooks`

Purpose: prove the internal hook render state machine with fake component
invokers and fake handles.

Suggested write scope:

- `crates/fast-react-reconciler/src/hooks/mod.rs`
- `crates/fast-react-reconciler/src/hooks/cursor.rs`
- `crates/fast-react-reconciler/src/hooks/dispatcher.rs`
- `crates/fast-react-reconciler/src/hooks/render.rs`
- `crates/fast-react-reconciler/src/hooks/render_phase.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker report only.

Exact boundary:

- Add `HookRenderState` with currently rendering fiber, current hook,
  work-in-progress hook, render lanes, render-phase update flags, rerender
  count, and processed render-phase queues.
- Add internal dispatcher modes: `ContextOnly`, `Mount`, `Update`, and
  `Rerender`.
- Implement fake/internal `use_state`, `use_reducer`, `use_ref`, `use_memo`,
  and `use_context` dispatcher methods over opaque handles.
- Implement `render_with_hooks` and `render_with_hooks_again`.
- Enforce the React rerender limit of 25.
- Add `reset_hooks_after_throw` and `reset_hooks_on_unwind` equivalents.
- Keep render-phase retries local to the component render attempt; do not
  schedule root work for them.

Non-goals:

- no `packages/react` dispatcher bridge,
- no real JS component invocation,
- no DOM/test-renderer public APIs,
- no Suspense replay beyond typed placeholders,
- no effect commit.

Focused tests:

- mount render allocates hook slots in call order,
- update render clones/reuses current hook slots in call order,
- rerender reuses work-in-progress hook slots from the previous pass,
- more hooks than previous render returns a structured error,
- fewer hooks than previous render returns a structured error at finish,
- render-phase updates rerender until stable,
- the 26th pass returns the React-shaped infinite rerender error path,
- unwind clears render-phase pending updates from processed queues,
- hooks outside render fail in `ContextOnly` mode,
- no HostRoot queue or scheduler state is mutated by render-phase retries.

### 6. Function Component Begin-Work Integration

Purpose: connect function component fibers to the internal hook renderer after
the HostRoot begin-work path is stable.

Suggested write scope:

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/hooks/render.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker report only.

Exact boundary:

- Add a minimal `begin_work` route for `FiberTag::FunctionComponent`.
- Call `prepare_to_read_context` placeholder before rendering.
- Call `render_with_hooks` with the root-owned `render_lanes`.
- Add `bailout_hooks` that copies current update queue and clears dynamic
  `PASSIVE`/`UPDATE` flags while preserving static flags.
- Set `FiberFlags::PERFORMED_WORK` only when the component actually renders.
- Integrate a fake child reconciliation boundary or return fake children below
  public renderer APIs; do not build host children unless the host/complete
  worker has landed.

Non-goals:

- no public React DOM root behavior,
- no `react-test-renderer` serialization,
- no real host mutation,
- no context propagation beyond bailout placeholders,
- no public hook facade compatibility claims.

Focused tests:

- mount function component renders through the fake invoker,
- update with changed props renders and sets `PERFORMED_WORK`,
- update with no scheduled lanes and unchanged context bails out,
- scheduled hook lanes force render even with unchanged props,
- context dependency placeholder can force render,
- bailout copies the update queue and removes dynamic effect flags only,
- child lanes determine whether a bailed-out fiber returns `None` or clones
  children for continued work.

### 7. Effect Registration Render Integration

Purpose: wire internal effect hooks to the effect ring and fiber flags without
running effect callbacks.

Suggested write scope:

- `crates/fast-react-reconciler/src/hooks/effect.rs`
- `crates/fast-react-reconciler/src/hooks/dispatcher.rs`
- `crates/fast-react-reconciler/src/hooks/render.rs`
- `crates/fast-react-reconciler/src/function_component_queue.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker report only.

Exact boundary:

- Add internal `mount_effect`, `update_effect`, `mount_layout_effect`,
  `update_layout_effect`, `mount_insertion_effect`, and
  `update_insertion_effect` helpers.
- Normalize omitted deps to an always-run/null handle.
- Compare deps through a fake `Object.is`-equivalent comparison boundary, not
  ad hoc Rust string/value comparisons.
- On mount or changed deps, append `HAS_EFFECT | phase` to the effect ring and
  set the correct fiber flags.
- On equal deps, append the phase without `HAS_EFFECT`, reuse the existing
  effect instance, and avoid setting dynamic fiber flags.
- Use the landed core `FiberFlags` and `HookEffectFlags` constants.

Non-goals:

- no callback invocation,
- no native JS rooting implementation,
- no passive queue flush,
- no public `useEffect` facade behavior.

Focused tests:

- insertion effects set `FiberFlags::UPDATE` and append
  `HookEffectFlags::INSERTION_EFFECT`,
- layout effects set `UPDATE | LAYOUT_STATIC` on mount and `UPDATE` on changed
  update,
- passive effects set `PASSIVE | PASSIVE_STATIC` on mount and `PASSIVE` on
  changed update,
- strict-effects mode composes `MOUNT_LAYOUT_DEV` and `MOUNT_PASSIVE_DEV`
  without changing the ring shape,
- equal deps append no-`HAS_EFFECT` nodes and preserve the prior effect
  instance,
- changed deps append `HAS_EFFECT` nodes with fresh deps handles,
- rerender reset rebuilds the work-in-progress ring without mutating current,
- abort releases fake create/deps handles allocated for the discarded ring.

### 8. Commit Effect Phases And Passive Queue

Purpose: execute effect rings in React phase order once minimal commit/root
current switching exists.

Suggested write scope:

- `crates/fast-react-reconciler/src/commit_effects.rs`
- `crates/fast-react-reconciler/src/commit_work.rs`
- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker report only.

Exact boundary:

- Traverse finished fibers by `flags` and `subtree_flags`.
- For function component fibers, read the per-fiber effect ring from
  `finishedWork.updateQueue.lastEffect`.
- Run insertion effects in the mutation partition.
- Run layout destroys in mutation before layout creates in layout.
- Queue passive unmounts before passive mounts for deferred flushing.
- Reach deleted-subtree passive unmounts through parent-owned deletion lists,
  not only through the finished child chain.
- Clear a destroy handle before invoking it so reentrant work cannot call it
  twice.
- Route callback errors through commit-phase error capture placeholders with
  fiber context.

Non-goals:

- no public hook behavior claim,
- no DOM-specific mutation behavior,
- no N-API callback rooting implementation,
- no hydration-specific effect behavior.

Focused tests:

- insertion unmount/mount runs in mutation order,
- all layout destroys run before any layout creates,
- passive unmounts run before passive mounts in a deferred flush,
- effects without `HAS_EFFECT` stay in the ring but do not run,
- deleted-subtree passive unmounts are reached from deletion lists,
- destroy is cleared before the fake invoker is called,
- commit errors are captured with the owning fiber and do not expose raw arena
  internals.

## Queue Handle Risk

The main merge risk is the current `UpdateQueueHandle` ownership boundary.
`FiberNode.update_queue` is generic, but the reconciler currently stores only a
HostRoot/class-style `UpdateQueueStore`. Function component update queues need
React's separate shape: `lastEffect`, `events`, `stores`, and `memoCache`, while
state queues live on individual hook slots.

Do not force function component queues into the current HostRoot `UpdateQueue`
record. The safe path is either:

- a queue-kind layer that keeps HostRoot and function component queues in one
  validated store behind `UpdateQueueHandle`, or
- a deliberately separate function component queue handle plus a small
  `FiberNode`/store refactor that makes the queue kind explicit.

Whichever route is chosen, it must land after HostRoot path stability and must
preserve all HostRoot queue tests unchanged before hook render workers depend
on it.

## Public Facade Boundary

These source workers must not claim public hook compatibility. The public hook
facade needs separate later work:

- a private current-dispatcher bridge from `packages/react` into the native
  reconciler,
- rooted JS handles for component functions, reducers, actions, state values,
  refs, effect create/destroy callbacks, deps arrays, context values, and
  thenables,
- React 19.2.6 black-box oracles for invalid hook calls, dispatch identity,
  state queue rebasing, render-phase update errors, effect ordering, and
  cleanup behavior,
- renderer-backed DOM or test-renderer roots that route through the Rust
  reconciler and commit path.

Until those are present, reports and PR descriptions should say only that
internal hook data structures or internal render machinery are implemented.

## Risks Or Blockers

- HostRoot render work is not yet present in this worktree, so reconciler hook
  workers must wait for the accepted HostRoot render-phase path.
- The current concurrent update staging module is HostRoot-typed; hook updates
  need queue/update identifiers that do not collide with HostRoot IDs.
- Function component queues and hook state queues are different React
  structures. Collapsing them into one generic queue would hide bugs around
  effect rings, base queues, eager state, and memo cache reset.
- JS callback/value rooting is not implemented. First hook and effect tests
  should use fake handles and fake invokers only.
- Context dependencies, Suspense replay, Offscreen hidden tree state, and
  passive flush scheduling are not complete enough for public conformance
  claims.

## Recommended Next Tasks

1. After worker 129 or its successor lands the stable HostRoot render path,
   run a queue-kind design worker focused only on `FiberNode.update_queue` and
   HostRoot preservation.
2. Land core hook list and hook state queue primitives with pure Rust unit
   tests.
3. Land core effect ring primitives using the existing `HookEffectFlags`.
4. Land reconciler dispatcher/render tests with fake component invokers.
5. Land function component begin-work integration below public renderer APIs.
6. Land effect registration and commit-phase effect traversal only after a
   minimal commit/current-switch path exists.
7. Add public hook facade and React 19.2.6 oracle workers only after the native
   dispatcher bridge and commit behavior exist.

## Commands Run

- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `git status --short`
- `sed -n '1,260p' worker-progress/worker-078-hook-effect-ring-plan.md`
- `sed -n '1,280p' worker-progress/worker-099-core-hook-state-queue-plan.md`
- `sed -n '1,300p' worker-progress/worker-100-reconciler-function-component-render-plan.md`
- `sed -n '1,320p' worker-progress/worker-112-core-hook-queue-implementation-plan.md`
- `sed -n '1,340p' worker-progress/worker-113-function-component-implementation-plan.md`
- `rg --files crates/fast-react-core crates/fast-react-reconciler packages/react`
- `rg -n "FiberFlags|HookEffectFlags|FunctionComponent|HostRoot|hook|effect|update_queue|UpdateQueue|FiberRoot|begin_work|beginWork|render_with|renderWith" crates/fast-react-core crates/fast-react-reconciler packages/react`
- `sed -n '1,260p' crates/fast-react-core/src/fiber_flags.rs`
- `sed -n '1,260p' crates/fast-react-core/src/hook_effect_flags.rs`
- `sed -n '1,560p' crates/fast-react-core/src/fiber.rs`
- `sed -n '1,220p' crates/fast-react-core/src/lib.rs`
- `sed -n '1,280p' crates/fast-react-core/src/fiber_handles.rs`
- `sed -n '1,560p' crates/fast-react-core/src/fiber_arena.rs`
- `sed -n '1,240p' crates/fast-react-core/src/fiber_bubbling.rs`
- `sed -n '1,740p' crates/fast-react-reconciler/src/update_queue.rs`
- `sed -n '1,320p' crates/fast-react-reconciler/src/concurrent_updates.rs`
- `sed -n '1,260p' crates/fast-react-reconciler/src/work_in_progress.rs`
- `sed -n '1,260p' crates/fast-react-reconciler/src/fiber_store.rs`
- `sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs`
- `git -C /Users/user/Developer/Developer/react-reference rev-parse HEAD`
- `git -C /Users/user/Developer/Developer/react-reference describe --tags --exact-match HEAD`
- `rg -n "export type Hook|type Hook|type UpdateQueue|type Update<S|type FunctionComponentUpdateQueue|type Effect|function renderWithHooks|function renderWithHooksAgain|function finishRenderingHooks|function updateReducerImpl|function dispatchSetStateInternal|function enqueueRenderPhaseUpdate|function pushEffectImpl|mountEffectImpl|updateEffectImpl|bailoutHooks|resetHooksAfterThrow|resetHooksOnUnwind" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js`
- `sed -n '150,280p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js`
- `sed -n '503,860p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js`
- `sed -n '905,980p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js`
- `sed -n '1288,1665p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js`
- `sed -n '2550,2810p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js`
- `sed -n '3615,3850p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js`
- `sed -n '141,325p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitEffects.js`
- `sed -n '1420,1530p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js`
- `sed -n '3650,3865p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js`
- `sed -n '4091,4175p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js`
- `sed -n '1,220p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`
- `git diff --check`
- `git status --short`
- `git diff --name-only && git ls-files --others --exclude-standard`
- `git status --short -- worker-progress/worker-136-function-hooks-refresh.md`
- `git diff --name-only -- worker-progress/worker-136-function-hooks-refresh.md`
- `git diff --no-index --check /dev/null worker-progress/worker-136-function-hooks-refresh.md`
- `git status --short -- . ':(exclude)worker-progress/worker-136-function-hooks-refresh.md' ':(exclude).worker-logs'`

## Changed Files

- `worker-progress/worker-136-function-hooks-refresh.md`

## Verification

- `git diff --check` passed with no output.
- `git diff --no-index --check /dev/null worker-progress/worker-136-function-hooks-refresh.md`
  emitted no whitespace errors. It returned the expected no-index diff status
  because the report file is new.
- `git status --short -- worker-progress/worker-136-function-hooks-refresh.md`
  returned only `?? worker-progress/worker-136-function-hooks-refresh.md`.
- `git status --short -- . ':(exclude)worker-progress/worker-136-function-hooks-refresh.md' ':(exclude).worker-logs'`
  passed with no output, confirming there are no scoped changes outside the
  single allowed report file. `.worker-logs/` was already untracked before this
  worker wrote the report.
