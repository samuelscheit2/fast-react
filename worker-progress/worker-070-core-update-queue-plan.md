# worker-070-core-update-queue-plan

## Objective

Produce a report-only implementation plan for React-compatible update queue
data structures in the Rust core. The plan covers class/component queues,
HostRoot queues, hook queues, priority lanes, eager state, base queues, skipped
updates, hidden updates, and a test strategy.

Write scope honored: only this report file was created. No Rust, JavaScript,
package, test, or orchestration file was modified.

## Summary

Fast React should model React 19.2.6 update queues as lane-filtered, rebased
linked structures over arena indices. The root cause is not "store pending
state somewhere"; it is preserving insertion order while rendering only the
updates whose lanes are included in the current render, then retaining skipped
updates plus later applied updates so a future lower-priority render can
produce the deterministic final state React users observe.

A draining FIFO queue, a flat priority enum, or a queue owned by a renderer
adapter would be a root-cause mismatch. It would break transitions, hidden
Offscreen updates, eager hook bailouts, render-phase updates, class callbacks,
optimistic updates, transition entanglement, and interrupted render rebasing.

Recommended implementation sequence:

1. Finish root lane bookkeeping in `fast-react-core` on top of the merged
   `Lane`, `Lanes`, and `LaneMap<T>` primitives.
2. Add arena-backed queue node IDs, circular pending ring helpers, base queue
   helpers, and update tags as renderer-agnostic core data structures.
3. Add fiber/root records and alternate queue ownership in the reconciler so
   queues can be shared or cloned without aliasing current and work-in-progress
   fibers.
4. Implement concurrent update staging that records `(fiber, queue, update,
   lane)`, flushes into circular pending rings, and immediately marks source
   fiber lanes for eager bailout checks.
5. Implement HostRoot/class update queue processing with pending-to-base
   transfer, skipped update cloning, no-lane clones after skips, callback
   collection, hidden callback deferral, and transition entanglement hooks.
6. Implement hook queue storage and reducer/state queue processing with
   `baseState`, circular `baseQueue`, eager state, render-phase queues, and
   optimistic `revertLane` handling.
7. Wire `request_update_lane`, scheduler/root work loop, and commit callbacks
   only after the data structures above are independently tested.

Breaking changes are acceptable if they remove any scaffold or future shortcut
that represents updates as one FIFO, puts update priority in a renderer-local
field, stores raw JS callbacks in Rust without explicit rooting, or mutates a
host container directly from `root.render`.

## Evidence Gathered

Required merged evidence:

- `worker-progress/worker-007-scheduler-fiber.md`: establishes that React
  19.2.6 requires lane bitsets, root lane bookkeeping, double-buffered fibers,
  circular/rebased update queues, concurrent update staging, hook queue eager
  state, optimistic update `revertLane`s, hidden callbacks, and per-fiber hook
  effect rings. It rejects flat priorities, FIFO queues, and global effect
  lists.
- `worker-progress/worker-030-core-lane-model.md`: documents the merged
  `fast-react-core` lane foundation: transparent `Lane`/`Lanes` newtypes,
  exact React 19.2.6 lane constants and masks, lane/index conversion, group
  predicates, and fixed-width `LaneMap<T>`. It explicitly leaves root
  scheduling, fibers, update queues, hooks, and root bookkeeping out of scope.

Additional merged evidence consulted:

- `worker-progress/worker-044-react-dom-client-roots-plan.md`: `root.render`
  must create a HostRoot update with payload `{element}`, enqueue it, schedule
  work, and entangle transitions instead of mutating the DOM directly.
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`:
  root state, lane maps, update queues, scheduler work, and host effects should
  be owned by Rust core/reconciler code while JS owns public root objects and
  callback handles.
- `worker-progress/worker-071-core-fiber-flags-effect-plan.md`: flags and
  hook effect rings must integrate with update queues without reviving a
  tree-wide effect list.
- `worker-progress/worker-072-reconciler-root-work-loop-plan.md`: places
  HostRoot update queues after root lane bookkeeping and fiber/root records,
  with circular pending queues, base queues, lane skipping, rebasing,
  callbacks, and transition entanglement.
- `worker-progress/worker-073-test-renderer-update-model-plan.md`: test
  renderer updates must route through shared reconciler update queues and root
  scheduling, not through direct host storage mutation.

Current local source evidence:

- `crates/fast-react-core/src/lib.rs`: exports element records and lane
  primitives, but no fiber, root, hook, or update queue types.
- `crates/fast-react-core/src/lane.rs`: contains the current lane constants,
  bitset helpers, and `LaneMap<T>` storage that update queue and root lane
  work must reuse.
- `crates/fast-react-reconciler/src/lib.rs`: remains a placeholder with no
  fiber arena, root model, update queue, work loop, or real scheduler.
- `crates/fast-react-host-config/src/lib.rs`: exposes opaque host types and
  scheduling/mutation traits; update queues must not store DOM/native values
  directly.

Pinned React 19.2.6 source evidence, using normalized source paths:

- `packages/react-reconciler/src/ReactFiberClassUpdateQueue.js`: class and
  HostRoot queue fields, pending circular queue, base queue transfer, skipped
  update rebase, callbacks, hidden callbacks, capture updates, and transition
  entanglement.
- `packages/react-reconciler/src/ReactFiberHooks.js`: hook update shape,
  `baseState`, circular `baseQueue`, pending merge, eager state, render-phase
  updates, optimistic updates, and `revertLane` behavior.
- `packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`: concurrent
  update staging, immediate fiber/alternate lane marking, pending ring append,
  root lookup, hidden update marking, and no-lane eager bailout queueing.

Worker 047 is active but unavailable for this report because its output is not
merged in this worktree. Root lane bookkeeping is therefore treated as an
unmerged prerequisite.

## Current Gaps

What exists:

- Renderer-agnostic element metadata and placeholder errors.
- `Lane`, `Lanes`, `LaneIndex`, and `LaneMap<T>` in `fast-react-core`.
- Capability-grouped host traits and a mutation test renderer.
- A reconciler placeholder that validates mutation host capability.

What is missing:

- No root lane state, transition/retry lane claiming, entanglement map, hidden
  update lane map, or `get_next_lanes` equivalent.
- No `FiberId`, `FiberRoot`, alternate pair, `HookId`, or update node arena.
- No class/HostRoot `UpdateQueue`, `SharedQueue`, pending ring, base queue, or
  callback storage.
- No hook list, hook queue, hook update node, eager state, render-phase queue,
  or optimistic update state.
- No concurrent update staging buffer.
- No safe JS handle/rooting model for payload functions, reducers, callbacks,
  dispatch closures, eager state values, wakeables, refs, or action thenables.

## Data Model Invariants

### Lanes are the queue filter

Every update node must carry a `Lane` or `Lanes` value from the existing
`fast-react-core` lane model. Queue processing must test whether an update's
lane is included in the current render lanes. `Lane::NO` is meaningful: it is
used by rebased clones that must never be skipped, and by eager bailout hook
updates that are queued without scheduling new work.

Hidden Offscreen updates add `OffscreenLane` to the update lane. Processing
must strip that bit before normal priority checks and use root render lanes
when deciding whether the hidden update is eligible.

Queue transition lanes are separate from root pending lanes. Shared queue
`lanes` records a superset used for entangling transition updates, and root
bookkeeping must intersect it with still-pending root lanes before calling
`mark_root_entangled`.

### Queue storage must be ID based

Use stable arena IDs such as `FiberId`, `HookId`, `UpdateId`, and `QueueId`
instead of Rust references inside update nodes. React's current and
work-in-progress fibers can share queue storage, diverge in render-owned base
queue fields, and be discarded after interrupted renders. Raw references or
`Rc<RefCell<_>>` would make aliasing, stale callbacks, and work-in-progress
aborts harder to reason about.

The core queue storage should provide O(1) append to a circular pending ring.
The class/HostRoot base queue is processed as a linear first/last range after
pending updates are transferred. Hook base queues remain circular with the
tail pointer stored on the hook.

### Class and HostRoot queues are similar but not identical to hooks

Class/HostRoot queue fields:

- `base_state`
- `first_base_update`
- `last_base_update`
- shared `pending` circular tail
- shared transition `lanes`
- shared hidden callbacks
- render-owned callbacks collected for commit

Update node fields:

- `lane`
- `tag`: update state, replace state, force update, or capture update
- `payload` handle
- callback handle
- `next`

Processing rules:

- Transfer pending circular updates to the base queue before processing.
- Append transferred updates to the current queue too when the current queue is
  distinct from work-in-progress, so aborted renders do not lose updates.
- Preserve insertion order. Do not sort by lane.
- Skip insufficient-lane updates by cloning them into the new base queue and
  merging their lanes into remaining work.
- After the first skipped update, clone later applied updates into the base
  queue with `NoLane` and no callback so they are rebased later without firing
  callbacks twice.
- Process updates appended during queue processing in the same pass where
  React does.
- Collect callbacks onto the render-owned queue and set the callback flag for
  commit. Hidden callbacks move to shared hidden callback storage until reveal.
- Capture updates are work-in-progress-only and must be discarded if the render
  is aborted.

HostRoot should use the same queue shape but payloads are renderer-agnostic
root payload handles, initially `{element}` or `null` unmount payloads from the
JS/reconciler boundary.

### Hook queues require reducer history

Hook queue fields:

- circular `pending` tail
- transition `lanes`
- dispatch handle
- `last_rendered_reducer`
- `last_rendered_state`

Hook fields:

- `memoized_state`
- `base_state`
- circular `base_queue` tail
- queue handle
- next hook handle

Hook update fields:

- `lane`
- `revert_lane` for optimistic updates
- action handle
- `has_eager_state`
- eager state handle
- optional gesture metadata behind an explicit feature policy
- `next`

Processing rules:

- Merge pending and base circular queues by swapping their first pointers.
- Process from `base_queue.next`, preserving insertion order.
- Skip insufficient-lane updates into a new base queue and mark skipped lanes.
- After any skip, clone later applied normal updates with `NoLane` so future
  renders rebase them.
- If `has_eager_state` is true and the reducer identity still matches, use the
  eager value instead of calling the reducer again.
- Render-phase updates are stored on the hook queue's pending ring, applied
  during rerender without lane checks, and cleared after that render pass.
- Optimistic updates are applied until their `revert_lane` is rendered; then
  they are skipped as if they no longer exist. If still pending, clone them
  with `NoLane` plus the original `revert_lane`.

Do not force hooks and classes through one generic processor. They share ring
helpers and lane filtering, but class callbacks/capture updates and hook
eager/revert behavior are distinct invariants.

### Eager state is a scheduling optimization with queue consequences

Hook dispatch may compute eager state only when the fiber and alternate have no
pending lanes and the queue has a last rendered reducer. If the eager result is
React-`Object.is` equal to the last rendered state, the update is still queued
with `NoLane` for possible future rebase but no root work is scheduled.

Fast React should not hide this behind a "skip setState if equal" shortcut.
The queued no-lane update is required if a later update causes the reducer or
base queue to rebase differently.

### Concurrent staging is part of the queue model

React stages concurrent updates before appending them to hook/class queues. The
Rust model needs an equivalent buffer of `(fiber, queue, update, lane)` entries
that can be flushed after the current render segment. Enqueueing must still
mark the source fiber and alternate lanes immediately because eager bailout and
work detection rely on those lane fields before the pending ring is flushed.

Root lookup should walk the fiber return path until a HostRoot is found. Hidden
Offscreen ancestors must mark hidden updates on the root lane state. A future
optimization may add a root backpointer, but the initial model should preserve
React's observable semantics first.

## Implementation Slices

The following slices are independently mergeable Rust tasks. Names are
suggestions; the orchestrator can renumber them. Each slice should include its
own worker report.

### 1. Core root lane bookkeeping

Write scope:

- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-core-root-lane-bookkeeping.md`

Task:

- Add root lane state around `LaneMap<T>`: pending, suspended, pinged, warm,
  expired, error-recovery-disabled, entangled, hidden, and indicator lanes.
- Implement transition/retry lane claiming, `mark_root_updated`,
  `mark_root_suspended`, `mark_root_pinged`, `mark_root_finished`,
  `mark_root_entangled`, `get_highest_priority_lanes`, and `get_next_lanes`.
- Keep update queues, host scheduling, and event priority outside this slice.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Unit tests for pending/suspended/pinged/warm selection, transition
  entanglement transitivity, retry rotation, hidden update cleanup, WIP lane
  stickiness, idle deferral, expiration, and sync upgrades.

### 2. Core queue ring primitives

Write scope:

- `crates/fast-react-core/src/update_queue.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-core-update-queue-primitives.md`

Task:

- Add `UpdateId`, `QueueId`, ring append helpers, ring-to-linear transfer
  helpers, and base queue range types over arena IDs.
- Add common update tags and lane-filter helper results without embedding JS
  payload behavior or fiber scheduling.
- Support explicit `NoLane` updates and Offscreen-lane stripping helpers.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Unit tests for empty/single/multiple circular append, stable insertion
  order, linear transfer, appending during processing, invalid ID rejection,
  and lane filtering including `NoLane` and `OffscreenLane`.

### 3. Reconciler fiber/root and queue attachment

Write scope:

- `crates/fast-react-reconciler/src/arena.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-fiber-root-queues.md`

Task:

- Introduce `FiberId`, `FiberRootId`, `HookId`, queue handles, and update node
  arena ownership.
- Define HostRoot and initial fiber fields required by queues: alternates,
  return/child/sibling links, `memoized_state`, `update_queue`, `lanes`,
  `child_lanes`, `flags`, and root state handle.
- Implement queue clone/share rules for current and work-in-progress fibers.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Tests for HostRoot construction, alternate pair creation, shared queue
  identity, cloned render-owned queue fields, stable arena IDs, and no
  renderer-specific values in core queue records.

### 4. Concurrent update staging

Write scope:

- `crates/fast-react-reconciler/src/concurrent_updates.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-concurrent-update-staging.md`

Task:

- Add a staging buffer for `(fiber, queue, update, lane)` entries.
- Flush staged entries into circular pending rings and mark lanes from updated
  fibers to HostRoot.
- Immediately mark source fiber and alternate `lanes` during enqueue.
- Mark `child_lanes` up the return path and record hidden updates when an
  Offscreen ancestor is hidden.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Tests for staged append order, immediate lane marking, alternate lane
  marking, child lane propagation, root lookup, hidden update marking, no-lane
  eager bailout flushing, and unmounted-fiber no-root behavior.

### 5. HostRoot and class update queues

Write scope:

- `crates/fast-react-reconciler/src/class_update_queue.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-class-host-root-update-queue.md`

Task:

- Implement class/HostRoot update records with lane, tag, payload handle,
  callback handle, and next link.
- Implement `initialize_update_queue`, `clone_update_queue`, `create_update`,
  `enqueue_update`, `enqueue_captured_update`, `process_update_queue`,
  callback collection, hidden callback deferral, and transition entanglement
  hooks.
- Add internal `update_container` and `update_container_sync` entry points
  that create HostRoot `{element}` or `null` payload updates without invoking
  host mutation.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Tests for insertion order, the `A1 B2 C1 D2` rebase example, pending-to-base
  transfer, appending pending updates during processing, current/WIP sharing,
  captured update WIP-only behavior, callbacks firing once, hidden callback
  deferral/reveal, force update marker, and transition entanglement calls.

### 6. Hook queue storage and reducer processing

Write scope:

- `crates/fast-react-reconciler/src/hooks/mod.rs`
- `crates/fast-react-reconciler/src/hooks/update_queue.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-hook-update-queue.md`

Task:

- Add hook records, hook queue records, and hook update nodes with lane,
  `revert_lane`, action handle, eager-state fields, and next link.
- Implement pending/base circular queue merge, reducer processing, skipped
  update cloning, no-lane rebase clones, queue lane cleanup, and
  `last_rendered_state` updates.
- Keep dispatch public API and JS facade wiring out of this slice; use typed
  reducer/action/state handles or test reducers.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Tests for pending/base merge, insufficient lane skipping, rebase after skip,
  no-lane clones, eager state reuse, reducer identity changes, hook queue lane
  cleanup, and Offscreen hidden update filtering.

### 7. Hook dispatch, eager bailout, render-phase, and optimistic updates

Write scope:

- `crates/fast-react-reconciler/src/hooks/dispatch.rs`
- `crates/fast-react-reconciler/src/hooks/update_queue.rs`
- `crates/fast-react-reconciler/src/concurrent_updates.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-hook-dispatch-queue-semantics.md`

Task:

- Implement dispatch helpers that create hook updates, compute eager state only
  under React-compatible lane conditions, enqueue no-lane eager bailout
  updates, and schedule only when needed.
- Implement render-phase update detection and rerender queue processing.
- Implement optimistic updates with `revert_lane` and explicit feature-policy
  placeholders for gesture transition metadata.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Tests for eager equal-state bailout without scheduling, eager queued update
  rebasing after later work, eager error deferred to render, render-phase
  rerender loop semantics, render-phase queue cleanup on throw, optimistic
  update apply/revert, and skipped `revert_lane` propagation.

### 8. Conformance and regression oracles

Write scope:

- `tests/conformance/src/update-queue-*.mjs`
- `tests/conformance/scripts/*update-queue*.mjs`
- `tests/conformance/test/update-queue-*.test.mjs`
- `tests/conformance/oracles/react-19.2.6-update-queue-*.json`
- `worker-progress/worker-update-queue-conformance-oracles.md`

Task:

- Add React 19.2.6 black-box scenarios for class `setState`, callbacks,
  `forceUpdate`, root `render`/`unmount` queueing, `useState`, `useReducer`,
  eager bailout behavior, render-phase updates, transition entanglement, hidden
  Offscreen updates, and optimistic updates where public APIs expose them.
- Keep Fast React compatibility claims false until the Rust queues are wired
  through a public facade.

Verification:

- `npm test --workspace @fast-react/conformance`
- Oracle regeneration byte-compare.
- Existing temp/local path leak guard.
- Scenario status count checks showing unsupported or known-mismatch Fast
  React observations until the implementation is wired.

## Test Strategy

Unit tests should come before public JS compatibility claims.

Core lane and queue tests:

- Lane constants and masks remain covered by worker 030 tests.
- Queue ring tests should prove insertion order, circular append, pending
  transfer, and no-lane behavior without any renderer.
- Rebase tests should include React's documented `A1 B2 C1 D2` shape and
  randomized lane sequences where the final full-priority render equals
  insertion-order application from the original base state.

Reconciler queue tests:

- Use tiny deterministic state reducers and payload evaluators instead of JS
  callbacks.
- Check current/work-in-progress sharing by aborting a processed WIP queue and
  recreating WIP from current.
- Check callbacks are collected during render but not invoked until commit
  slices own callback phase ordering.
- Check hidden callbacks move to shared hidden callback storage and fire only
  on reveal.
- Check no host mutation happens from HostRoot queue processing.

Hook tests:

- `useState`/`useReducer` queue processing with skipped lanes and later
  rebase.
- Eager state reuse when reducer identity matches.
- Eager equal-state bailout queues a no-lane update and does not schedule
  root work.
- Render-phase updates restart and apply to the work-in-progress hook only.
- Optimistic updates apply while `revert_lane` is pending and disappear when
  that lane renders.

Integration tests after scheduler/work loop exists:

- `root.render` enqueues HostRoot updates and returns before host mutation when
  work is not sync-flushed.
- Higher-priority lanes interrupt lower-priority WIP without losing queued
  updates.
- Transitions in one event share/entangle lanes.
- Suspense retry and hidden Offscreen updates preserve queue rebasing.

Public conformance oracles should remain black-box and pinned to React 19.2.6.
They should gate claims only after Rust queue behavior is routed through
React-compatible JS entry points.

## Quality, Maintainability, Performance, And Security

Quality:

- The plan models queue semantics as data invariants: lanes select eligible
  updates, insertion order is preserved, skipped updates remain, and later
  applied updates are rebased.
- It avoids placeholder APIs that would look compatible while hiding a FIFO or
  renderer-local mutation shortcut.

Maintainability:

- Keep React names close for lanes, update tags, base queues, shared queues,
  render lanes, and entanglement. This makes future source comparisons
  mechanical.
- Share only low-level ring helpers between class and hook queues. Keep their
  processors separate because callbacks/capture updates and eager/revert
  updates have different invariants.
- Feature-flagged paths such as gesture transitions, Activity, View
  Transition, and Offscreen should have explicit policy constants before
  implementation.

Performance:

- Use bitsets and fixed `LaneMap<T>` storage on priority hot paths.
- Use arenas/slabs and ID links for update nodes so append and clone operations
  are predictable and allocator pressure can be controlled.
- Avoid hash maps in queue processing and root lane selection. The concurrent
  staging buffer can be a reusable vector cleared after flush.

Security:

- Rust must not store raw JS function/value references. Payload functions,
  reducers, callbacks, dispatches, eager states, wakeables, refs, and action
  thenables need explicit rooted handles owned by the JS/native boundary.
- User callbacks must run only in commit or dispatch contexts that have
  reentrancy guards. A callback should not observe half-mutated queues or freed
  fibers.
- Arena IDs should be generational or otherwise validated so stale public
  handles cannot access reused fibers or update nodes.
- Structured errors should avoid leaking renderer-private storage IDs unless a
  future diagnostics policy explicitly permits it.

## Risks Or Blockers

- Root lane bookkeeping is not merged locally beyond the lane bitset
  primitives. Update queue workers should not guess `get_next_lanes` or
  entanglement behavior inline.
- No fiber/root arena exists yet. Queue design depends on stable alternate and
  return-path ownership.
- JS callback/value rooting is unresolved. Any queue implementation that stores
  raw JS references would be unsafe across N-API, render aborts, and callback
  reentrancy.
- Some React 19.2.6 queue behavior is feature-flagged or tied to Offscreen,
  Activity, gesture transitions, Suspense, async actions, and `useOptimistic`.
  Initial slices should either implement the data fields behind explicit policy
  flags or keep loud unsupported paths.
- DEV warnings for render-phase class updates, updates inside updater
  functions, invalid callbacks, `act`, and invalid hook calls need a separate
  diagnostics/conformance pass.
- Exact public timing cannot be claimed until root scheduling, microtasks,
  Scheduler callback transport, and commit phases exist.

## Commands Run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md
sed -n '260,520p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,260p' worker-progress/worker-030-core-lane-model.md
rg --files crates/fast-react-core worker-progress
git status --short
sed -n '1,260p' crates/fast-react-core/src/lib.rs
sed -n '1,360p' crates/fast-react-core/src/lane.rs
sed -n '1,240p' crates/fast-react-core/src/element.rs
sed -n '1,220p' worker-progress/worker-071-core-fiber-flags-effect-plan.md
rg -n "update queue|HostRoot|class|baseQueue|eager|skipped|rebase|lane" worker-progress/*.md
sed -n '1,220p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '214,380p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,220p' worker-progress/worker-073-test-renderer-update-model-plan.md
sed -n '1,200p' crates/fast-react-core/Cargo.toml
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,260p' crates/fast-react-host-config/src/lib.rs
rg -n "EventPriority|HostScheduling|MutationRenderer|Update|LaneMap|Lane" crates/fast-react-host-config/src/lib.rs crates/fast-react-reconciler/src/lib.rs crates/fast-react-test-renderer/src/lib.rs
rg -n "pub (struct|enum|trait|type)|mod |fn |impl " crates/fast-react-core/src/lane.rs
sed -n '1,260p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberClassUpdateQueue.js
sed -n '260,620p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberClassUpdateQueue.js
sed -n '620,980p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberClassUpdateQueue.js
rg -n "baseQueue|pending|eager|revertLane|render phase|RenderPhase|updateReducerImpl|dispatchSetStateInternal|lastRenderedState|lastRenderedReducer|NoLane|OffscreenLane" <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberHooks.js
sed -n '140,210p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberHooks.js
sed -n '1300,1585p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberHooks.js
sed -n '1585,1645p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberHooks.js
sed -n '3628,3708p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberHooks.js
sed -n '3804,3832p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberHooks.js
sed -n '1,240p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js
sed -n '240,420p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js
```

Nested agents:

- Spawned a read-only explorer to challenge class/HostRoot update queue
  invariants and Rust slice boundaries.
- Spawned a read-only explorer to challenge hook queue invariants, eager
  state, render-phase updates, and optimistic update slice boundaries.

At drafting time both checks were still running, so this report is grounded in
direct local evidence. If a result arrives before handoff, useful conclusions
will be folded into this file.

## Changed Files

- `worker-progress/worker-070-core-update-queue-plan.md`

## Recommended Next Tasks

1. Implement or merge core root lane bookkeeping before queue processing.
2. Add core queue ring primitives with pure lane/filter tests.
3. Add reconciler fiber/root queue attachment and concurrent update staging.
4. Implement HostRoot/class update queues and internal root update entry
   points.
5. Implement hook queue storage, reducer processing, eager bailout, render-
   phase updates, and optimistic `revertLane` behavior.
6. Add black-box React 19.2.6 conformance oracles after the Rust data
   structures exist, keeping compatibility claims false until a public facade
   routes through them.

## Completion Checklist

- [x] Did not read `ORCHESTRATOR.md`.
- [x] Wrote only the scoped worker progress report.
- [x] Used merged evidence from workers 007 and 030.
- [x] Treated active worker 047 as unavailable.
- [x] Focused on root causes and data model invariants, not placeholder APIs.
- [x] Split future work into independently mergeable Rust implementation
  slices with concrete write scopes and verification.
- [x] Covered quality, maintainability, performance, and security.
