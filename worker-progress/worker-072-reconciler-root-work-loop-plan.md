# worker-072-reconciler-root-work-loop-plan

## Objective

Produce a report-only implementation plan for the reconciler root work loop,
scheduling integration, render and commit phases, host mutation integration,
error boundaries, and incremental work boundaries.

Write scope honored: only
`worker-progress/worker-072-reconciler-root-work-loop-plan.md` was written.
No source implementation or source tests were added.

## Summary

Fast React should implement the reconciler root work loop as a real
lane-driven root scheduler and fiber render/commit engine, not as an extension
of the current `render_mutation_placeholder` API. The placeholder boundary is
useful evidence because it proves the reconciler no longer depends on the
legacy `HostConfig` shim, but it does not yet contain the root data, update
queues, flags, scheduler callback state, effect traversal, or host phase
contracts that React 19.2.6 behavior requires.

The recommended implementation sequence is:

1. Add root lane bookkeeping on top of the existing `Lane`, `Lanes`, and
   `LaneMap<T>` primitives.
2. Add arena-backed `FiberRoot`, HostRoot fiber, fiber IDs, alternates, flags,
   subtree flags, deletion metadata, and root lifecycle state.
3. Add React-compatible HostRoot update queues with circular pending queues,
   base queues, lane skipping, rebasing, callbacks, and transition
   entanglement hooks.
4. Define a reconciler-specific host aggregate for real roots, separate from
   placeholder rendering, that combines mutation rendering with host scheduling
   and portal hooks.
5. Implement root scheduling: scheduled-root list, microtask scheduling,
   Scheduler callback reuse/cancelation, sync flushing across roots, passive
   effect flushing before render work, and priority-to-lane mapping.
6. Implement the render work loop in narrow vertical slices: HostRoot first,
   then host component/text complete work, then function/class components after
   their data models exist.
7. Implement commit phases with strict before-mutation, mutation,
   `root.current` switch, layout, and deferred passive ordering.
8. Add error capture and root/error-boundary recovery after the root work loop
   can unwind partial work safely.
9. Add incremental render boundaries: yielding, resume, abort, higher-priority
   interruption, Suspense ping/retry hooks, Offscreen/deferred lane handling,
   and commit-suspension integration.

Breaking changes are expected and should be treated as root-cause fixes:
`MutationRenderer` alone is not a sufficient real-root host bound; root work
also needs `HostScheduling`, event-priority resolution, portal preparation, and
likely opaque fiber/instance token plumbing before DOM events and public
instance lookup can be correct. Workers 047 and 051 are active but unavailable
to this report, so this plan treats root lane bookkeeping and host token
plumbing as unmerged prerequisites unless the orchestrator later merges
equivalent work.

## Evidence Gathered

Required merged worker evidence:

- `worker-progress/worker-007-scheduler-fiber.md`: React 19.2.6 requires
  lane bitsets, explicit `FiberRoot` lane state, Scheduler task/timer heaps,
  double-buffered fibers, circular/rebased update queues, and `flags` plus
  `subtreeFlags` commit traversal. It rejects flat priority enums, FIFO
  queues, and a tree-wide global effect list.
- `worker-progress/worker-008-renderer-host-config.md`: the host boundary must
  keep host handles opaque, use capability traits, implement mutation first,
  reserve persistence/hydration shape, and keep DOM resources, events,
  singletons, forms, and security-sensitive behavior in renderer adapters.
- `worker-progress/worker-019-reconciler-host-boundary-migration.md`: the
  reconciler now exposes a canonical `MutationRenderer`-bounded placeholder and
  validates mutation capability, but real roots still need scheduling and
  host-container types.
- `worker-progress/worker-030-core-lane-model.md`: `fast-react-core` now has
  React 19.2.6 `Lane`, `Lanes`, `LaneIndex`, constants, masks, bitset helpers,
  and fixed-width `LaneMap<T>`, while root bookkeeping, transition/retry
  claiming, expiration, entanglement, and scheduling remain out of scope.
- `worker-progress/worker-040-dom-mutation-renderer-plan.md`: DOM mutation
  must remain a renderer adapter layered on opaque host traits. Reconciler owns
  effect ordering and mutation traversal; DOM owns container validation,
  namespace/property/style diffing, controlled forms, node maps, and event
  setup. It also identifies likely token-aware host boundary changes.
- `worker-progress/worker-044-react-dom-client-roots-plan.md`: `createRoot`
  and `root.render` enqueue HostRoot updates through the reconciler; they must
  not directly mutate DOM. Root scheduling must preserve lane selection,
  transition lanes, event priority, callback reuse/cancelation, cross-root
  sync flushing, `flushSync`, root-level error callbacks, and root object
  lifecycle.

Current local source evidence:

- `crates/fast-react-core/src/lane.rs` contains lane constants and helpers,
  including `LaneMap<T>`, but no root lane state.
- `crates/fast-react-core/src/lib.rs` exports element placeholders and lane
  primitives, but no fiber, root, update queue, flag, or effect metadata.
- `crates/fast-react-host-config/src/lib.rs` defines capability traits:
  `HostTypes`, `HostIdentityAndContext`, `HostCreation`, `HostCommit`,
  `HostScheduling`, `MutationHost`, `PersistenceHost`, `HydrationHost`,
  `PortalHost`, `ResourceHost`, `SingletonHost`, `ViewTransitionHost`,
  `DiagnosticsHost`, `MutationRenderer`, and the legacy `HostConfig` shim.
- `crates/fast-react-reconciler/src/lib.rs` contains `ReconcilerError`,
  `validate_mutation_renderer_boundary`, `render_mutation_placeholder`, a
  scheduler placeholder, and compatibility `render_placeholder`; it has no
  fiber root, work loop, update queues, scheduler implementation, or commit
  traversal.
- `crates/fast-react-test-renderer/src/lib.rs` implements canonical mutation
  host traits over opaque in-memory handles and can become the first verifier
  for generic host mutation commit behavior.

Nested checks:

- A read-only source-boundary explorer was asked to test whether the current
  Rust crates support a real root work loop. Its result will be consumed only
  if it returns before handoff; the report does not block on it.
- A read-only evidence-synthesis explorer was asked to cross-check the
  required worker evidence and slice ordering. Its result will be consumed only
  if it returns before handoff; the report does not block on it.

## Root-Cause Invariants

### Root scheduling is not a render shortcut

`root.render(children)` must enqueue a HostRoot update and schedule root work.
It must not call a renderer-specific mutation routine. React behavior depends
on this indirection because lane selection, transition entanglement, sync
flushing, passive effect flushing, error recovery, and root callback reuse all
happen between enqueue and commit.

### Lanes own priority; Scheduler owns callback transport

React has two layers that must remain separate:

- lanes select which root work is eligible and what may interrupt existing
  work;
- Scheduler callbacks decide when non-sync work runs and whether a callback
  continuation should resume.

A root scheduler that stores only one timer per root will miss equal-priority
ordering, delayed callbacks, cancelation tombstones, continuation behavior,
cross-root sync flushes, and `flushSync` interactions. Conversely, using the
public Scheduler priority as the only root priority will lose lane-specific
Suspense, transition, hydration, Offscreen, retry, and entanglement behavior.

### Work-in-progress fibers must be double-buffered

The render loop needs current and work-in-progress fiber trees connected by
alternates. Fields such as `pendingProps`, `memoizedProps`, `memoizedState`,
`lanes`, `childLanes`, `flags`, `subtreeFlags`, `deletions`, refs, dependencies,
update queues, and host state must be copied or reset according to phase. A
single mutable tree cannot represent interrupted renders, rebased updates,
aborted work, or layout effects that observe the newly committed tree.

### Update queues must rebase, not drain

HostRoot and class queues must preserve insertion order while skipping updates
whose lanes are not included in the current render. Skipped updates and later
applied updates are cloned into base queues so future renders rebase correctly.
This is a root-cause requirement for transitions, hidden updates, callbacks,
optimistic updates, and render-phase updates. A draining FIFO queue would make
the first compatibility bug appear in root scheduling, then reappear in hooks,
classes, Suspense, and transitions.

### Commit is phase-partitioned and non-interruptible

The commit path must be modeled as separate phases:

- before-mutation: prepare host commit state and run snapshot-style effects;
- mutation: perform host mutations, detach refs, remove/deletion cleanup, and
  insertion-effect work;
- current switch: assign `root.current = finishedWork` after mutation and
  before layout;
- layout: run layout lifecycles/effects, callbacks, and ref attaches;
- passive: schedule and later flush passive unmounts before passive mounts.

The reconciler owns this ordering. Host adapters perform operations when the
reconciler calls them; they do not decide effect traversal order.

### Host mutation is opaque and phase-scoped

The reconciler must call host traits through opaque containers, instances, text
instances, update payloads, and public instances. DOM node types, namespaces,
attributes, styles, controlled form state, event delegation, hydration markers,
resources, and singletons remain outside the core. Real DOM support probably
needs an opaque host fiber/instance token passed during creation, hydration,
commit update, and deletion detach so events and public lookup can map host
nodes back to current fibers without exposing fiber structs.

### Error recovery is root work, not logging

Root callbacks and error boundaries are part of the reconciler work loop. A
thrown render error must unwind partial work, mark captured boundaries, enqueue
boundary or root error updates, retry with the correct lanes, and report caught,
uncaught, and recoverable errors at the right phase. Calling a root error
callback directly from a failed render would bypass recovery semantics and
would make reentrancy and JS callback lifetime unsafe.

### Incremental rendering yields only at safe boundaries

Concurrent rendering may yield between units of work and resume if the same
root callback remains valid. It must not yield inside commit. Higher-priority
lanes can interrupt in-progress work; equal or lower-priority lanes usually
continue the existing work. The work loop therefore needs explicit render
status, render lanes, suspended/pinged/expired state, interleaved update
queues, and an abort path that leaves `current` untouched.

## Implementation Slices

The slices below are Rust implementation slices with concrete write scopes and
verification. They are ordered by dependency, but each is intentionally small
enough to merge independently. Names are recommendations; the orchestrator can
renumber them to avoid conflicts with active workers.

### 1. Core root lane bookkeeping

Write scope:

- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-core-root-lane-bookkeeping.md`

Task:

- Add a `RootLaneState` or equivalent renderer-agnostic structure containing
  `pending_lanes`, `suspended_lanes`, `pinged_lanes`, `warm_lanes`,
  `expired_lanes`, `error_recovery_disabled_lanes`, `entangled_lanes`, and
  fixed `LaneMap` storage for `expiration_times`, `entanglements`, and hidden
  update markers.
- Implement `mark_root_updated`, `mark_root_suspended`, `mark_root_pinged`,
  `mark_root_finished`, `mark_root_entangled`,
  `upgrade_pending_lanes_to_sync`, transition lane claiming, retry lane
  claiming, `get_highest_priority_lanes`, `get_next_lanes`, and
  `get_next_lanes_to_flush_sync`.
- Keep event priority and host callbacks out of this module. It should be pure
  lane bookkeeping.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Unit tests for pending/suspended/pinged/warm selection, idle deferral,
  expiration, WIP stickiness, transition entanglement transitivity,
  transition/retry lane rotation, hidden update cleanup, and sync upgrades.

### 2. Reconciler fiber and root arena model

Write scope:

- `crates/fast-react-reconciler/src/arena.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-fiber-root-arena.md`

Task:

- Introduce `FiberId`, `FiberRootId`, and arena storage for current and
  work-in-progress fibers.
- Define HostRoot and initial generic fiber shape with `tag`, `key`,
  element/type handles, `state_node`, `return`, `child`, `sibling`, `index`,
  `alternate`, `pending_props`, `memoized_props`, `memoized_state`,
  `update_queue`, `dependencies`, `mode`, `lanes`, `child_lanes`, `flags`,
  `subtree_flags`, `deletions`, and ref placeholders.
- Define `FiberRoot` with opaque host container handle, current HostRoot
  fiber, root lane state, callback node/priority placeholders, pending commit
  placeholders, error callback handles as abstract types, root context fields,
  identifier prefix, pending/passive effect state, and lifecycle status.
- Add constructors that build a concurrent HostRoot without DOM-specific
  container validation.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Unit tests for HostRoot construction, current/WIP alternate creation,
  arena ID stability, root lane state initialization, and absence of DOM types
  in the public reconciler root model.

### 3. Reconciler flags and commit metadata

Write scope:

- `crates/fast-react-reconciler/src/flags.rs`
- `crates/fast-react-reconciler/src/effects.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-flags-effect-metadata.md`

Task:

- Add bitflag-style `Flags`, `SubtreeFlags`, and phase masks matching React
  19.2.6 concepts: placement, update, child deletion, ref, snapshot,
  passive/layout/insertion hook markers, visibility, hydration/dehydration
  placeholders, and static flags.
- Add deletion vector metadata on parent fibers. Do not add a global fiber
  effect list.
- Add per-fiber hook effect ring placeholders only as stable storage for
  future hooks; traversal remains tree/mask-driven.
- Add `bubble_properties` helpers that OR child lanes, child lanes, flags, and
  subtree flags during complete work and preserve static flags in bailout
  paths.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Unit tests for phase masks, deletion storage order, subtree flag bubbling,
  child lane bubbling, and bailout/static-flag preservation.

### 4. HostRoot update queue and root update API

Write scope:

- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-host-root-update-queue.md`

Task:

- Implement update nodes with lane, tag, payload, callback handle, next link,
  and optional eager/hidden metadata placeholders.
- Implement shared circular pending queues plus first/last base update storage
  by arena index, not by Rust references that alias current and WIP trees.
- Implement HostRoot `create_update`, `enqueue_update`,
  `process_update_queue`, callback collection, skipped-update cloning, rebase
  state, and queue sharing between alternates.
- Add `update_container` and `update_container_sync` internal Rust entry
  points that enqueue `{element}`-shaped HostRoot payloads through abstract
  element handles. They should schedule through a trait or callback placeholder
  only after slice 6 exists.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Unit tests for insertion order, insufficient-lane skipping, rebase after
  skipped updates, updates appended during processing, callback collection,
  sync update creation, and transition entanglement hook calls.

### 5. Real root host aggregate and token boundary

Write scope option A if host token plumbing is still unmerged:

- `crates/fast-react-host-config/src/lib.rs`
- `worker-progress/worker-host-token-boundary.md`

Write scope option B after token plumbing exists:

- `crates/fast-react-reconciler/src/host.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-root-host-bound.md`

Task:

- Define the real root host bound separately from the placeholder API. The
  reconciler root path should require at least
  `MutationRenderer + HostScheduling + PortalHost` for mutation roots that can
  be scheduled and can handle portals.
- Validate required capabilities at root creation: mutation tree mode,
  microtasks for root scheduling, event-priority resolution, and portal
  preparation when portals are used.
- Add an opaque host fiber/instance token if it has not already landed. Pass it
  through creation, text creation, update, hydration attachment placeholders,
  and deletion detach hooks without exposing raw fibers to host adapters.
- Preserve `render_mutation_placeholder` as a loud scaffold until callers move
  to the real root API; do not make it grow real behavior.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-host-config --all-features` for option A
- `cargo test -p fast-react-reconciler --all-features` for option B
- `cargo clippy` for touched crates with warnings denied
- Compile-fail or unit tests proving legacy-only `HostConfig` and
  mutation-only-without-scheduling hosts cannot call the real root entry point.
- Tests using `fast-react-test-renderer` or a small fake host proving no DOM
  type is required by the generic root host bound.

### 6. Root scheduler and Scheduler bridge

Write scope:

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/scheduler_bridge.rs`
- `crates/fast-react-reconciler/src/work_loop.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-root-scheduler.md`

Task:

- Add a scheduled-root linked list or equivalent stable structure with
  `next`, callback node, callback priority, pending microtask flag, pending
  sync work marker, and render/commit reentrancy state.
- Implement `ensure_root_is_scheduled`, root-schedule microtask processing,
  starved lane expiration checks, stale callback cancelation, callback
  priority reuse, sync microtask-end flushing, and non-sync Scheduler callback
  scheduling.
- Map lanes to event priorities, then to Scheduler priorities. Host event
  priority enters through `HostScheduling`; root lanes remain core/reconciler
  state.
- Implement `flush_sync_work` across all scheduled roots when not already
  rendering or committing. Return/reveal reentrancy so `flushSync` and
  `root.unmount` can warn correctly later.
- Share semantics with the public `scheduler` package plan, but do not expose
  public JS `scheduler` APIs from this slice.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Fake-scheduler tests for sync lane microtask flushing, callback reuse,
  callback cancelation when lane priority changes, cross-root sync flush,
  passive effects flushing before scheduled work, continuation return, and
  reentrancy detection.

### 7. Work loop shell: perform, render, yield, complete

Write scope:

- `crates/fast-react-reconciler/src/work_loop.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/complete_work.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-work-loop-shell.md`

Task:

- Implement `perform_work_on_root`, `render_root_sync`,
  `render_root_concurrent`, `work_loop_sync`, `work_loop_concurrent`,
  `perform_unit_of_work`, `complete_unit_of_work`, and root render status.
- Start with HostRoot-only begin work and explicit unsupported tags for other
  component types. Unsupported tags should fail as typed reconciler errors
  before host mutation.
- Preserve work-in-progress lanes. Reuse or discard WIP depending on lane
  priority, root status, and interruption.
- Yield only between units of work in concurrent mode. Never yield during
  commit.
- Keep render-phase update restart hooks as explicit placeholders with typed
  state, not hidden side effects.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Unit tests for sync render completion, concurrent yield and resume, higher
  priority interruption, unsupported tag failure before commit, WIP reuse,
  root status transitions, and no `root.current` mutation during render.

### 8. Host complete work for mutation renderers

Write scope:

- `crates/fast-react-reconciler/src/complete_work.rs`
- `crates/fast-react-reconciler/src/host_children.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-host-complete-work.md`

Task:

- Implement complete work for host component and text fibers once their element
  and props handle strategy exists.
- Call `root_host_context`, `child_host_context`, `should_set_text_content`,
  `create_instance`, `create_text_instance`, `append_initial_child`, and
  `finalize_initial_children` only for detached work-in-progress host nodes.
- Store opaque host handles on fibers. Build host update payloads through host
  hooks; do not diff DOM props in the reconciler.
- Mark placement/update/ref/content-reset/commit-mount flags and bubble flags
  and lanes.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo test -p fast-react-test-renderer --all-features` if the test renderer
  is updated to exercise this path
- `cargo clippy` for touched crates with warnings denied
- Fake-host tests proving detached initial children are appended during render,
  mounted tree mutation does not happen during render, host context is passed
  correctly, and finalize results produce commit-mount flags.

### 9. Commit root and mutation phase skeleton

Write scope:

- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/commit_mutation.rs`
- `crates/fast-react-reconciler/src/commit_layout.rs`
- `crates/fast-react-reconciler/src/commit_passive.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-commit-root.md`

Task:

- Implement `commit_root` with phase partitioning and root status guards.
- Call `prepare_for_commit` before mutation work and `reset_after_commit` after
  mutation/layout state is safe.
- Implement mutation traversal from `flags`, `subtreeFlags`, and deletion
  lists. Call `append_child`, `append_child_to_container`, `insert_before`,
  `insert_in_container_before`, `remove_child`, `remove_child_from_container`,
  `clear_container`, `commit_update`, `commit_text_update`,
  `reset_text_content`, hide/unhide hooks, `detach_deleted_instance`, and
  portal preparation at the correct phase.
- Switch `root.current` after mutation and before layout.
- Schedule passive effects for later flush; do not run passive mounts during
  the mutation/layout commit.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo clippy` for touched crates with warnings denied
- Test-renderer integration tests for placement order, single-parent moves,
  insert-before, removals, deletions, root clear, text update, content reset,
  hide/unhide, prepare/reset commit state, `root.current` switch timing, and
  passive unmount-before-mount scheduling.

### 10. Error capture, boundaries, and root callbacks

Write scope:

- `crates/fast-react-reconciler/src/error.rs`
- `crates/fast-react-reconciler/src/throw.rs`
- `crates/fast-react-reconciler/src/work_loop.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/commit.rs`
- `worker-progress/worker-reconciler-error-boundaries.md`

Task:

- Add render error propagation, unwind state, captured-boundary markers, and
  root fatal error updates.
- Store root `on_uncaught_error`, `on_caught_error`, and
  `on_recoverable_error` as abstract callback handles with explicit lifetime
  and invocation policy.
- Implement root error update behavior first, then class error boundaries once
  class component fibers and lifecycle data exist.
- Report recoverable errors after commit with discrete priority and current
  transition cleared when the JS binding layer can express that boundary.
- Treat errors thrown by host operations and user callbacks separately so host
  capability/operation errors do not masquerade as React boundary captures.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Unit tests for root fatal render recovery, boundary capture priority,
  unwind cleanup, callback ordering, callback throw isolation, and no host
  mutation for renders that abort before commit.

### 11. Incremental work, Suspense hooks, and commit suspension

Write scope:

- `crates/fast-react-reconciler/src/work_loop.rs`
- `crates/fast-react-reconciler/src/suspense.rs`
- `crates/fast-react-reconciler/src/offscreen.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/commit.rs`
- `worker-progress/worker-reconciler-incremental-boundaries.md`

Task:

- Add root render states for incomplete, suspended, suspended-with-delay,
  errored, fatal errored, and completed work.
- Add wakeable/ping cache placeholders and `mark_root_pinged` integration for
  Suspense retries without implementing DOM hydration.
- Add Offscreen/deferred lane hooks so hidden updates keep `OffscreenLane`
  markers and clear them when revealed.
- Integrate `should_yield` checks, continuation callbacks, aborted render
  cleanup, and retry scheduling.
- Add commit-suspension hooks from `HostScheduling`: `start_suspending_commit`,
  `wait_for_commit_to_be_ready`, and post-paint callbacks. Feature support
  should fail closed when the host lacks the capability.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Fake-host/fake-scheduler tests for yield/resume, abort on higher priority,
  Suspense ping marking, retry lane scheduling, hidden update lane cleanup,
  commit suspension unsupported-capability errors, and no commit interleaving.

### 12. Generic mutation renderer integration tests

Write scope:

- `crates/fast-react-test-renderer/**`
- optional `crates/fast-react-reconciler/tests/**`
- `worker-progress/worker-reconciler-test-renderer-root-integration.md`

Task:

- Use the in-memory mutation renderer as the first end-to-end proof that the
  reconciler can create a root, enqueue HostRoot updates, schedule work, build
  host instances while detached, commit mutation effects, update the current
  tree, and unmount.
- Keep DOM behavior out of this slice. The test renderer should verify generic
  reconciler/host contracts before React DOM uses them.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo clippy` for touched crates with warnings denied
- Integration tests for initial mount, update, text update, child reorder,
  deletion cleanup, unmount, sync flush, concurrent yield/resume with fake
  Scheduler, and host operation error propagation.

## Render And Commit Phase Details

The first render loop should only implement fibers whose data model is already
sound. A HostRoot-only loop is mergeable if it proves lane scheduling and update
queue processing without pretending unsupported component tags work. Host
component and text complete work should follow after host handles and props
payloads are stable. Function components, hooks, context, class lifecycles,
memo/lazy, Suspense, and portals should enter as separate slices that reuse the
same root work loop.

Begin phase responsibilities:

- read the current fiber and render lanes;
- process HostRoot update queues into `memoized_state`;
- reconcile child element handles into child fibers when the child reconciler
  exists;
- mark lanes consumed or skipped;
- return the next child unit of work.

Complete phase responsibilities:

- create or update detached host instances/text instances;
- append detached initial children;
- compute update payloads through host hooks;
- mark flags and subtree flags;
- bubble child lanes and flags;
- return sibling or parent work.

Commit responsibilities:

- reject committing stale or mismatched finished work;
- flush passive effects before new scheduled work when React would;
- prepare host commit state once per root;
- run before-mutation effects before host mutations;
- apply all host mutations and deletion cleanup;
- switch `root.current`;
- run layout effects, class callbacks, and ref attaches;
- schedule passive effects for deferred flushing;
- mark root lanes finished and reschedule remaining work.

## Scheduling Integration Details

Root scheduling should own these contracts:

- `request_update_lane` maps render-phase updates, current transition, host
  event priority, and default priority to lanes.
- `schedule_update_on_fiber` marks the updated fiber and alternate, walks to
  the root, marks pending lanes, handles interleaved/render-phase updates, and
  calls `ensure_root_is_scheduled`.
- `ensure_root_is_scheduled` records the root in the root schedule and asks
  the host for a microtask when needed.
- The microtask recomputes every scheduled root, marks starved lanes expired,
  cancels stale callbacks, and flushes sync work at the end.
- Non-sync callbacks call `perform_work_on_root_via_scheduler_task`, flush
  pending passive effects first, recompute `get_next_lanes`, run the work
  loop, and return a continuation only when the same callback remains valid.
- `flush_sync_work` flushes all roots outside render/commit. `root.unmount`
  and public `flushSync` must use this cross-root boundary.

The public `scheduler` package implementation should share behavior with this
root scheduler, but it is a package/API task. The reconciler should depend on a
small Rust Scheduler bridge so tests can use deterministic fake callbacks.

## Host Mutation Integration Details

The reconciler should treat host mutation as an effect of commit traversal, not
as renderer-owned rendering. The host adapter owns storage and platform rules;
the reconciler owns ordering and root atomicity.

Required host integration rules:

- Instance and text creation during complete work must produce detached host
  handles.
- `append_initial_child` is allowed during render only for detached instances.
- Mounted tree operations are allowed only in the mutation commit phase.
- `prepare_for_commit` and `reset_after_commit` bracket the commit for
  selection/focus/event gating in DOM and equivalent native behavior.
- Deletion traversal must call detach and cleanup hooks in phase-specific
  order and must not leave host-node-to-fiber maps alive.
- Portal children use host containers that are opaque to the reconciler; DOM
  listener installation remains a DOM adapter concern.
- Hydration, persistence, resources, singletons, forms, diagnostics, and view
  transitions should fail closed unless their explicit capabilities are
  implemented and verified.

## Error Boundary Details

Error support should not be introduced as a logger around `perform_work_on_root`.
It needs work-loop state:

- an unwind path that can complete or discard partial WIP safely;
- flags or metadata for captured work;
- root and boundary error update creation;
- root callback handles and component stack payloads;
- commit-time reporting for caught, uncaught, and recoverable errors;
- async rethrow behavior for callback failures once the JS boundary exists;
- recovery lane selection that does not starve higher-priority work.

Initial mergeable scope should implement root fatal-error recovery and typed
error callback storage. Class boundary capture should wait until class
component rendering and lifecycle metadata are available.

## Incremental Work Boundaries

Incremental work must be added where it changes correctness, not as a timer
wrapper around synchronous rendering.

Required boundaries:

- Yield checks happen between fiber units.
- Commit is atomic and non-yielding.
- The WIP tree can be reused only when the next lanes are compatible with the
  in-progress render.
- Higher-priority updates can interrupt lower-priority work and restart from
  the root.
- Default lanes should not unnecessarily interrupt an in-progress transition.
- Suspense pings must mark pinged lanes only when those lanes were suspended.
- Offscreen and hidden updates need hidden lane markers so reveal/finish can
  clear or preserve work correctly.
- Commit suspension is a host capability and must not silently no-op.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan is anchored in merged evidence and current source. It explicitly
  avoids implementing observable behavior through placeholder APIs.
- Each future slice has a concrete write scope and verification plan.
- Active worker outputs for 047 and 051 were not used; equivalent work is
  included as prerequisites if not merged later.

Maintainability:

- Root lane state, fiber arenas, update queues, host bounds, scheduling, render
  work, commit work, errors, and incremental behavior are separated into
  modules with narrow ownership.
- React naming should be kept close for lane/root/work-loop concepts so future
  conformance failures can be mapped back to source behavior.
- DOM-specific work remains outside the Rust core and generic reconciler.

Performance:

- Lane and flag hot paths stay bitset-based and allocation-free where possible.
- Fibers and updates should use arenas or slab storage with stable indices
  instead of pointer-heavy reference graphs.
- Scheduler callback reuse/cancelation and cross-root sync flushing avoid
  over-scheduling.
- Host trait calls should remain monomorphized for mutation renderers until
  there is evidence that dynamic dispatch is needed.

Security:

- JS callback handles, refs, host instances, wakeables, and error callbacks
  must be explicitly rooted and phase-scoped at the binding boundary.
- Host fiber/instance tokens must not expose raw fiber memory or keep deleted
  host nodes alive.
- DOM security-sensitive writes such as HTML, URLs, styles, scripts,
  resources, and event handler-like props stay in the DOM adapter with
  dedicated oracles.
- Reentrant user callbacks during commit/error handling must not observe or
  mutate half-committed roots.

## Risks And Blockers

- No merged root lane bookkeeping exists in this worktree beyond lane bitset
  primitives.
- No fiber arena, root model, update queue, effect flags, or commit traversal
  exists yet.
- `MutationRenderer` currently excludes host scheduling; real roots need a
  stronger host aggregate or a breaking host-config update.
- Host fiber/instance token plumbing is likely required for DOM events,
  public instance lookup, hydration attachment, deletion cleanup, and test
  selectors. The active token-boundary worker is unavailable to this report.
- Public `scheduler` package work is running separately; root scheduling must
  not grow incompatible duplicate semantics.
- Error callback lifetime and async rethrow behavior depend on the future JS
  binding contract.
- Hydration, resources, singletons, forms, view transitions, and Fizz must be
  reserved in data structures but not claimed until their own oracles and
  implementation tracks land.

## Commands Run

No source tests were run. Commands were read-only except for writing this
report.

```sh
git status --short
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
ls -la worker-progress
test -f worker-progress/worker-072-reconciler-root-work-loop-plan.md && sed -n '1,260p' worker-progress/worker-072-reconciler-root-work-loop-plan.md || true
sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,260p' worker-progress/worker-008-renderer-host-config.md
sed -n '1,260p' worker-progress/worker-019-reconciler-host-boundary-migration.md
sed -n '1,260p' worker-progress/worker-030-core-lane-model.md
sed -n '1,320p' worker-progress/worker-040-dom-mutation-renderer-plan.md
sed -n '1,360p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '361,760p' worker-progress/worker-044-react-dom-client-roots-plan.md
rg -n "^(pub trait|pub struct|pub enum|pub type|pub const|pub fn|impl|mod|pub mod|fn |type )" crates/fast-react-host-config/src/lib.rs crates/fast-react-reconciler/src/lib.rs crates/fast-react-core/src/lib.rs crates/fast-react-core/src/lane.rs crates/fast-react-test-renderer/src/lib.rs
find crates -maxdepth 3 -type f | sort
sed -n '700,1265p' crates/fast-react-host-config/src/lib.rs
sed -n '1,220p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,260p' crates/fast-react-core/src/lane.rs
sed -n '260,560p' crates/fast-react-core/src/lane.rs
test -f docs/tasks/worker-072-reconciler-root-work-loop-plan.prompt.md && sed -n '1,260p' docs/tasks/worker-072-reconciler-root-work-loop-plan.prompt.md || true
sed -n '1,180p' worker-progress/README.md
rg -n "root work|work loop|performWorkOnRoot|commit|error|boundary|incremental|Root|FiberRoot|worker-072|reconciler" MASTER_PLAN.md MASTER_PROGRESS.md worker-progress/worker-007-scheduler-fiber.md worker-progress/worker-008-renderer-host-config.md worker-progress/worker-019-reconciler-host-boundary-migration.md worker-progress/worker-030-core-lane-model.md worker-progress/worker-040-dom-mutation-renderer-plan.md worker-progress/worker-044-react-dom-client-roots-plan.md
git ls-files worker-progress/worker-072-reconciler-root-work-loop-plan.md --error-unmatch >/dev/null 2>&1; echo tracked:$?
```

Nested-agent commands:

- Spawned one read-only source-boundary explorer for the current Rust crates.
- Spawned one read-only evidence-synthesis explorer for required worker reports.

## Changed Files

- `worker-progress/worker-072-reconciler-root-work-loop-plan.md`

## Handoff Summary

Recommended implementation sequence:

1. Root lane bookkeeping in `fast-react-core`.
2. Reconciler fiber/root arena model.
3. Flags, subtree flags, deletions, and commit metadata.
4. HostRoot update queue and root update APIs.
5. Real root host aggregate plus token-aware host boundary if not already
   merged.
6. Root scheduler and Scheduler bridge.
7. Work loop shell with HostRoot-only behavior first.
8. Host complete work for mutation renderers.
9. Commit root and mutation/layout/passive phase skeleton.
10. Error capture and root/error-boundary recovery.
11. Incremental work boundaries, Suspense ping/retry hooks, Offscreen/deferred
    hooks, and commit suspension.
12. Generic test-renderer integration before DOM client roots depend on the
    path.

No source tests were run because this was a report-only task. Verification
still needs the final path-leak, trailing-whitespace, and scoped-status checks
after this file is written.
