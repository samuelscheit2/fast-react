# worker-071-core-fiber-flags-effect-plan

## Objective

Produce a report-only implementation plan for Rust core fiber flags, subtree
flags, effect lists, passive/layout/insertion effect metadata, host mutation
flags, and commit phase data flow.

Write scope honored: only `worker-progress/worker-071-core-fiber-flags-effect-plan.md`
was changed. No Rust, JavaScript, package, or test implementation was added.

## Summary

Fast React should implement React 19.2.6 commit metadata as explicit data model
primitives, not as a placeholder commit API. The root cause from worker 007 is
that React no longer commits by walking a global fiber effect list. It commits
by traversing the finished fiber tree with `flags`, `subtreeFlags`, parent-owned
`deletions`, and phase masks. Function component effects still have an ordered
list, but it is a per-fiber circular hook effect ring at the fiber update queue,
not a tree-wide `firstEffect`/`nextEffect` chain.

Worker 030 already merged the correct lane foundation in `fast-react-core`:
`Lane`, `Lanes`, `LaneIndex`, and fixed-width `LaneMap<T>`. This plan builds on
those primitives and treats active worker 047 root-lane bookkeeping as
unavailable because it is not merged in this worktree.

Recommended implementation sequence:

1. Add canonical fiber flag and hook effect flag bitsets in `fast-react-core`.
2. Add arena-backed fiber topology fields needed by flags, deletions, lanes,
   alternates, and host state handles.
3. Add per-fiber hook effect ring metadata for insertion, layout, and passive
   effects.
4. Add complete-work bubbling helpers for `childLanes`, `subtreeFlags`, and
   static flag preservation.
5. Add reconciler commit-phase state and traversal shells that consume masks
   without calling host behavior yet.
6. Add mutation-mode host effect data flow against `MutationRenderer`, then add
   layout/ref/callback and passive flush slices.

The breaking-change recommendation is to reject any design that reintroduces a
global effect list, flat priority field, FIFO root queue, or direct DOM mutation
from public roots. Those shapes patch the symptom of "commit something" while
breaking effect ordering, Suspense/offscreen behavior, passive flushing, root
switch timing, and future DOM/native renderer separation.

## Evidence Gathered

Required merged evidence:

- `worker-progress/worker-007-scheduler-fiber.md`: established that React
  19.2.6 requires lane bitsets, double-buffered fibers, circular/rebased update
  queues, `flags`/`subtreeFlags` commit traversal, parent deletion arrays, and
  per-fiber hook effect rings. It explicitly rejects simplified priorities,
  FIFO queues, and a tree-wide global effect list.
- `worker-progress/worker-030-core-lane-model.md`: documents and verifies the
  merged `Lane`, `Lanes`, `LaneIndex`, and `LaneMap<T>` primitives in
  `crates/fast-react-core/src/lane.rs`, leaving root scheduling, fibers, update
  queues, and reconciler behavior out of scope.

Additional merged evidence consulted:

- `worker-progress/worker-008-renderer-host-config.md`: core must keep host
  handles opaque and reserve fiber state for refs, portals, visibility,
  hydration, Suspense/Activity, and host effect flags without leaking DOM
  concepts into the core.
- `worker-progress/worker-012-host-config-traits.md`: current host boundary
  has `HostTypes`, `HostCreation`, `HostCommit`, `HostScheduling`,
  `MutationHost`, `MutationRenderer`, and capability diagnostics.
- `worker-progress/worker-018-test-renderer-mutation-host.md`: the in-memory
  test renderer proves mutation host operations, opaque handles, update
  payloads, visibility, and deleted-instance detachment can stay renderer-owned.
- `worker-progress/worker-019-reconciler-host-boundary-migration.md`: the
  reconciler currently validates `MutationRenderer` capability and then returns
  loud unimplemented behavior; it has no real fibers or commit traversal.
- `worker-progress/worker-040-dom-mutation-renderer-plan.md`: DOM mutation
  needs a renderer adapter layered behind the opaque host boundary, plus future
  token plumbing for node-to-fiber maps. DOM property diffing and event maps
  must not move into core.
- `worker-progress/worker-044-react-dom-client-roots-plan.md`: public
  `createRoot` must enqueue HostRoot updates and rely on reconciler scheduling
  rather than directly mutating host containers.

Current code inspected:

- `crates/fast-react-core/src/lib.rs`
- `crates/fast-react-core/src/lane.rs`
- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-dom/**`
- `packages/scheduler/**`

Pinned React 19.2.6 source evidence, using normalized source paths:

- `packages/react-reconciler/src/ReactFiberFlags.js`: flag constants,
  overloaded flag aliases, `HostEffectMask`, `StaticMask`, and commit phase
  masks.
- `packages/react-reconciler/src/ReactHookEffectTags.js`: hook effect tags:
  `HasEffect`, `Insertion`, `Layout`, and `Passive`.
- `packages/react-reconciler/src/ReactFiberHooks.js`: `useEffect`,
  `useLayoutEffect`, and `useInsertionEffect` set fiber flags and append to a
  circular per-fiber effect ring.
- `packages/react-reconciler/src/ReactFiberCompleteWork.js`: `bubbleProperties`
  merges child lanes and flags, and bailout paths preserve only static flags.
- `packages/react-reconciler/src/ReactFiberCommitWork.js`: before-mutation,
  mutation, layout, passive, deletion, and hook effect traversal by masks.
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`: commit status data
  flow, `prepareForCommit`, mutation flush, `resetAfterCommit`, `root.current`
  switch, layout flush, spawned work, and deferred passive flush.

Nested-agent hypothesis checks:

- Spawned read-only explorer `019e0eb6-dfaa-70d2-be0a-47f3d5b871d6` to inspect
  current Rust crate gaps and suggest independently mergeable write scopes.
- Spawned read-only explorer `019e0eb6-f366-7f52-a8ec-a32f5942d920` to test the
  hypothesis that React 19.2.6 requires tree/mask-driven traversal plus
  per-fiber hook effect rings rather than a global effect list.
- Both checks were still running at initial report drafting time, so the plan
  below is grounded in direct local evidence. If either returns before final
  handoff, its useful conclusions should be folded in.

## Current Repository State

What exists:

- `fast-react-core` has element metadata, compatibility target records, and the
  merged React 19.2.6 lane primitives from worker 030.
- `fast-react-host-config` has capability-grouped host traits. `HostCommit`
  already exposes `prepare_for_commit`, `reset_after_commit`, `commit_mount`,
  `commit_update`, `commit_text_update`, `reset_text_content`, hide/unhide, and
  `detach_deleted_instance`. `MutationHost` exposes append, insert, remove, and
  clear-container operations.
- `fast-react-test-renderer` implements those mutation traits with opaque
  renderer-owned handles and single-parent move behavior.
- `fast-react-reconciler` still has no fiber arena, root, update queue,
  complete work, or commit traversal. The mutation entry point only validates
  the boundary.

What is missing:

- No `FiberId`, `FiberNode`, alternate pair, parent/child/sibling topology,
  deletion storage, root current pointer, or host state handle model.
- No core `FiberFlags`, `subtreeFlags`, `FiberMode`, static flags, or commit
  phase masks.
- No function-component update queue shape that can hold the hook effect ring.
- No effect callback handle/rooting model for JS create/destroy functions.
- No complete-work `bubbleProperties` helper to merge lanes and flags upward.
- No commit-phase pending effects state, root current switch, or passive queue.
- No mapping from host mutation flags to `MutationRenderer` calls.

## Data Model Invariants

### Fiber flags and phase masks

Implement flags as a transparent fixed-width bitset newtype in
`fast-react-core`, not as an enum of mutually exclusive states. React reuses
some bits across mutually exclusive fiber tags, so the Rust model must allow
aliases and masks.

Required flag groups:

- Core commit flags: `PerformedWork`, `Placement`, `Update`, `Cloned`,
  `ChildDeletion`, `ContentReset`, `Callback`, `DidCapture`,
  `ForceClientRender`, `Ref`, `Snapshot`, `Passive`, `Hydrating`,
  `Visibility`, and `StoreConsistency`.
- Aliases: `Hydrate = Callback`, `ScheduleRetry = StoreConsistency`,
  `ShouldSuspendCommit = Visibility`, `DidDefer = ContentReset`,
  `FormReset = Snapshot`, and `AffectedParentLayout = ContentReset`.
- Static flags: `SnapshotStatic`, `LayoutStatic`, `RefStatic`,
  `PassiveStatic`, `MaySuspendCommit`, `ViewTransitionStatic`, and
  `ViewTransitionNamedStatic`.
- Phase masks: `HostEffectMask`, `StaticMask`, `BeforeMutationMask`,
  `BeforeAndAfterMutationTransitionMask`, `MutationMask`, `LayoutMask`,
  `PassiveMask`, and `PassiveTransitionMask`.

The flag module should also encode a stable feature-flag policy for masks whose
React source values depend on build flags. That policy must be explicit in
tests so future DOM/events workers can intentionally change it.

### Subtree flags and deletions

Every fiber needs both local `flags` and aggregated `subtreeFlags`. Commit
traversal must use `(subtreeFlags & mask) != NoFlags` to skip clean subtrees,
then inspect local `flags` on the current fiber.

Deletions are parent-owned. `ChildDeletion` on the parent means the parent
holds an ordered deletion list of removed child fibers. Deleted subtrees are not
found by sibling traversal from the finished tree, so deletion arrays are not
optional implementation detail.

Invariant: completing a fiber must merge each child's `childLanes`, `lanes`,
`subtreeFlags`, and `flags` into the parent. Bailout paths must preserve only
static flags, not stale per-commit mutation flags.

### Effect lists

Do not add `firstEffect`, `lastEffect`, or `nextEffect` fields to fibers as a
global commit list. React 19.2.6 keeps ordered hook effects per fiber through a
circular effect ring. The term "effect list" in Fast React should mean this
per-fiber hook ring unless explicitly qualified as historical React behavior.

Required hook effect metadata:

- `HookHasEffect`: whether this effect should run in the current commit.
- `HookInsertion`: `useInsertionEffect` create work runs during mutation.
- `HookLayout`: layout destroy/create work is partitioned across mutation and
  layout phases.
- `HookPassive`: passive destroy/create work is deferred to passive flushing.
- Ordered ring pointers by effect id, with `lastEffect.next` as the first
  effect, matching React's append order.
- Effect instance storage for create/destroy/deps handles must be separate from
  Rust lifetimes and must be ready for JS callback rooting.

Fiber flags that correspond to hook effects:

- `useInsertionEffect` sets fiber `Update` plus hook `Insertion`.
- `useLayoutEffect` sets fiber `Update | LayoutStatic` plus hook `Layout`.
- `useEffect` sets fiber `Passive | PassiveStatic` plus hook `Passive`.

### Host mutation data

Host mutation flags should remain normal fiber flags. Do not build a separate
host operation queue during render. The mutation phase should derive host calls
from the finished tree and parent deletion arrays.

Required host data on host fibers:

- Opaque host instance/text handles, stored through reconciler-owned slots or
  typed side storage. `fast-react-core` must not depend on DOM or native types.
- Old and new props handles needed by host diffing and commit.
- Host update payload handle for `commit_update`.
- Text content old/new values for `commit_text_update`.
- Visibility state for hide/unhide effects.
- Ref metadata for detach in mutation and attach in layout.
- Portal/container handle for host parent resolution.

Host parent and sibling resolution must be tree-driven. Placement should search
for the nearest host parent and stable host sibling, skipping newly placed
nodes, instead of appending blindly.

### Commit phase data flow

The commit state machine should be explicit. The minimum reconciler data flow:

1. Render produces `finishedWork`, `finishedLanes`, and `remainingLanes`.
2. Root records pending effects: root, finished work, committed lanes, remaining
   lanes, and status.
3. Before mutation phase runs if the finished tree has before-mutation or
   mutation masks. It calls host `prepare_for_commit`, runs snapshot-style work,
   and visits deletion arrays needed by the before-mutation phase.
4. Mutation phase applies host mutations, ref detaches, deletion effects,
   insertion effect unmount/mount work, content resets, visibility changes,
   text/instance updates, and form reset flags. It then calls
   `reset_after_commit`.
5. `root.current = finishedWork` happens after mutation and before layout.
6. Layout phase runs class lifecycles/callbacks, layout creates, and ref
   attaches while the finished tree is current.
7. Spawned work and passive scheduling run after layout.
8. Passive phase is separate and deferred. It runs passive unmounts before
   passive mounts and handles deleted subtree passive unmount traversal
   parent-to-child.

Reentrancy guards are not optional. Commit callbacks and effect functions can
schedule updates. The reconciler needs a commit execution context, current
update priority, and pending passive status before user code can run.

## Implementation Slices

The slices below are intentionally small enough to merge independently. They
avoid active worker 047 output and can use only worker 030 lane primitives until
root lane bookkeeping is merged.

### 1. Core fiber flag primitives

Write scope:

- `crates/fast-react-core/src/fiber_flags.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-core-fiber-flags.md`

Task:

- Add `FiberFlags(u32)` as a transparent newtype with constants, aliases, set
  operations, and named phase masks from React 19.2.6.
- Add explicit feature policy for source-feature-dependent masks.
- Add unit tests for exact bits, aliases, masks, and static-mask behavior.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features fiber_flags`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Scoped `git diff --check`

Merge dependency: none beyond worker 030.

### 2. Core hook effect tag primitives

Write scope:

- `crates/fast-react-core/src/hook_effect.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-core-hook-effect-tags.md`

Task:

- Add `HookEffectFlags(u8)` with `NoFlags`, `HasEffect`, `Insertion`,
  `Layout`, and `Passive`.
- Add filter helpers that can test phase membership without allocating.
- Add unit tests proving combinations such as `Insertion | HasEffect`,
  `Layout | HasEffect`, and `Passive | HasEffect`.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features hook_effect`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Scoped `git diff --check`

Merge dependency: none beyond worker 030.

### 3. Core fiber arena and topology

Write scope:

- `crates/fast-react-core/src/fiber.rs`
- `crates/fast-react-core/src/fiber_arena.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-core-fiber-arena.md`

Task:

- Add `FiberId`, `FiberTag`, `FiberMode`, and an arena-backed `FiberNode`
  layout with `return`, `child`, `sibling`, `index`, `alternate`, `lanes`,
  `childLanes`, `flags`, `subtreeFlags`, and parent-owned `deletions`.
- Use opaque handle slots for props/state/update queues/host state instead of
  embedding JS or host renderer values in the core crate.
- Add tests for alternate linking, parent-owned deletions, child/sibling order,
  and lane/flag storage.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features fiber`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Scoped `git diff --check`

Merge dependency: slices 1 and worker 030.

### 4. Per-fiber hook effect ring

Write scope:

- `crates/fast-react-core/src/hook_effect.rs`
- `crates/fast-react-core/src/fiber.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-core-hook-effect-ring.md`

Task:

- Add `EffectId`, `EffectNode`, and `EffectRing` storage with circular
  append-order semantics.
- Store create, destroy, deps, and resource handles as opaque callback/value
  handles pending the JS rooting model. Do not call callbacks in this slice.
- Add iterators filtered by `HookEffectFlags` for insertion, layout, and
  passive commit phases.
- Add tests for append order, circular integrity, filtered iteration, and
  cleanup metadata preservation across skipped effects.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features hook_effect`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Scoped `git diff --check`

Merge dependency: slices 1, 2, and 3.

### 5. Complete-work bubbling helpers

Write scope:

- `crates/fast-react-core/src/complete_work.rs`
- `crates/fast-react-core/src/fiber.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-core-complete-work-bubbling.md`

Task:

- Add pure helpers that bubble `childLanes`, `lanes`, `flags`, and
  `subtreeFlags` from children to parent.
- Add bailout/static-only bubbling helpers that preserve `StaticMask` while
  dropping stale per-commit flags.
- Add tests for normal completion, bailout completion, deleted child handling,
  and alternate return-pointer consistency.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features complete_work`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Scoped `git diff --check`

Merge dependency: slices 1 and 3.

### 6. Reconciler commit state machine skeleton

Write scope:

- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/root.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-commit-state-machine.md`

Task:

- Add `FiberRoot` or reconciler root shell with `current`, pending finished
  work, pending effect lanes, remaining lanes, and pending effect status.
- Add phase functions for before mutation, mutation, layout, spawned work, and
  passive scheduling that traverse by masks but initially record phase events
  rather than invoking host user callbacks.
- Enforce `root.current` switch after mutation and before layout.
- Add tests with synthetic fiber trees proving skip-by-mask traversal order and
  root current switch timing.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features commit`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Scoped `git diff --check`

Merge dependency: slices 1, 3, and 5. It can proceed without worker 047 by
using existing `Lanes` fields and leaving root lane selection out of scope.

### 7. Mutation host effect data flow

Write scope:

- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/host_effects.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs` only if trait-compatible tests
  need new observable logs
- `worker-progress/worker-reconciler-mutation-host-effects.md`

Task:

- Map `Placement`, `Update`, `ChildDeletion`, `ContentReset`, `Hydrating`,
  `Visibility`, and `FormReset` to existing `HostCommit` and `MutationHost`
  calls.
- Resolve host parent and host sibling from fiber topology.
- Process parent-owned deletion arrays in mutation phase and call
  `detach_deleted_instance` for deleted host instances after subtree cleanup.
- Add a fake/test renderer log to verify append/insert/remove/update/text
  update/reset/visibility/detach order.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features host_effects`
- `cargo test -p fast-react-test-renderer --all-features` if that crate is
  touched
- Targeted clippy for touched Rust crates with `-D warnings`
- Scoped `git diff --check`

Merge dependency: slice 6 and existing `MutationRenderer` boundary.

### 8. Layout, insertion, callbacks, and refs

Write scope:

- `crates/fast-react-core/src/hook_effect.rs`
- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/effects.rs`
- `worker-progress/worker-reconciler-layout-insertion-effects.md`

Task:

- Add commit traversal for insertion effect unmount/mount work in mutation.
- Add layout effect destroy in mutation and layout effect create in layout.
- Add callback queue and ref detach/attach data flow using opaque callback/ref
  handles. Do not expose raw JS callbacks without a rooting boundary.
- Add tests that verify all layout destroys happen before any layout creates,
  insertion effects run in the mutation partition, refs detach before host
  mutation attach, and refs attach during layout.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features hook_effect`
- `cargo test -p fast-react-reconciler --all-features effects`
- Targeted clippy for touched Rust crates with `-D warnings`
- Scoped `git diff --check`

Merge dependency: slices 4, 6, and 7.

### 9. Passive effect pending queue and flush

Write scope:

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-passive-effects.md`

Task:

- Add pending passive state on root and a flush entry point that runs passive
  unmounts before passive mounts.
- Traverse normal finished trees and deleted subtrees by `PassiveMask`.
- Ensure deleted subtree passive unmount order is parent-to-child.
- Add tests for deferred flush, unmount-before-mount ordering, nested deleted
  subtree order, and updates scheduled during passive flush remaining
  phase-safe.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features passive`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Scoped `git diff --check`

Merge dependency: slices 4, 6, and 8. Scheduler transport can remain a test
hook until public scheduler/root scheduling work is merged.

### 10. Host token and DOM/native readiness audit

Write scope:

- `crates/fast-react-host-config/**`
- `crates/fast-react-reconciler/**`
- `crates/fast-react-test-renderer/**`
- `worker-progress/worker-host-token-commit-readiness.md`

Task:

- After slices 6-9 prove the core commit data flow, audit whether host creation
  and commit hooks need an opaque phase-scoped fiber token as planned by worker
  040.
- If needed, introduce the breaking trait change once, migrate test renderer
  and reconciler together, and add tests proving the token does not expose core
  fiber internals.

Verification:

- `cargo fmt --all --check`
- `cargo test --workspace --all-features`
- Targeted clippy for touched Rust crates with `-D warnings`
- Capability and no-DOM-leak assertions in host-config/test-renderer tests
- Scoped `git diff --check`

Merge dependency: slices 6-9 and any merged DOM token boundary work. If worker
051 has already merged by then, use its output instead of duplicating it.

## Verification Strategy

Source tests were not run for this report-only task.

Future implementation tests should start at the data model level:

- Flag constants and masks match React 19.2.6.
- Hook effect tag filters match insertion/layout/passive semantics.
- `bubbleProperties` merges lanes and flags correctly.
- Bailout bubbling preserves only static flags.
- Commit traversal skips clean subtrees by phase mask.
- Parent-owned deletions are visited in phase-specific order.
- `root.current` switches after mutation and before layout.
- Layout destroys run before layout creates.
- Passive unmounts run before passive mounts.
- Deleted subtree passive unmounts run parent-to-child.
- Mutation host operations are ordered and routed through opaque host handles.

Conformance-level tests should wait until root/update queue and at least the
test renderer commit path exist. Public DOM tests before that would mostly test
facade placeholders, not commit semantics.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan encodes React's real data flow: flags and masks on fibers, deletion
  arrays on parents, hook effect rings per fiber, and commit phases on roots.
- It avoids a symptom patch such as "collect host operations into a Vec" during
  render, which would lose React's phase-specific traversal behavior.

Maintainability:

- Put React-named constants in small core modules with exact-value tests.
- Keep feature-flag-dependent mask policy explicit so event, DOM, and view
  transition workers can update it intentionally.
- Keep DOM/native behavior behind host-config traits and renderer adapters.

Performance:

- Use transparent bitsets, fixed lane maps from worker 030, arena ids, and
  skip-by-mask tree traversal.
- Avoid heap/hash maps in commit hot paths except for renderer-owned side
  storage where host adapters require it.
- Do not allocate a global effect list per commit.

Security:

- Effect callbacks, refs, host instances, DOM nodes, and wakeables need rooted
  handles and phase guards before user code can run from Rust.
- Host values must stay renderer-owned; core must not store raw DOM/native
  pointers or JS objects without the binding lifetime model.
- Commit reentrancy and deletion cleanup must fail closed so stale host/fiber
  tokens are not reused after unmount.

## Commands Run

- `git status --short`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '261,340p' MASTER_PLAN.md`
- `sed -n '261,340p' MASTER_PROGRESS.md`
- `wc -l WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md worker-progress/worker-007-scheduler-fiber.md worker-progress/worker-030-core-lane-model.md worker-progress/worker-071-core-fiber-flags-effect-plan.md`
- `sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md`
- `sed -n '261,340p' worker-progress/worker-007-scheduler-fiber.md`
- `sed -n '1,260p' worker-progress/worker-030-core-lane-model.md`
- `rg --files crates/fast-react-core crates/fast-react-host-config crates/fast-react-reconciler crates/fast-react-test-renderer`
- `sed -n '1,260p' crates/fast-react-core/src/lib.rs`
- `sed -n '1,760p' crates/fast-react-core/src/lane.rs`
- `sed -n '1,1258p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '1,760p' crates/fast-react-reconciler/src/lib.rs`
- `sed -n '1,970p' crates/fast-react-test-renderer/src/lib.rs`
- `rg -n "pub trait|fn commit|fn append|fn insert|fn remove|MutationHost|HostCommit|HostCreation|HostTypes|UpdatePayload|InitialChildrenFinalization|CommitState" crates/fast-react-host-config/src/lib.rs`
- `rg -n "impl HostTypes|impl HostIdentityAndContext|impl HostCreation|impl HostCommit|impl MutationHost|commit_|append_child|insert_before|remove_child|finalize_initial_children" crates/fast-react-test-renderer/src/lib.rs`
- `rg -n "flag|subtree|deletion|effect|commit|mutation|placement|update|passive|layout|insertion|root\\.current|host" worker-progress/worker-007-scheduler-fiber.md worker-progress/worker-030-core-lane-model.md worker-progress/worker-008-renderer-host-config.md worker-progress/worker-012-host-config-traits.md worker-progress/worker-018-test-renderer-mutation-host.md worker-progress/worker-019-reconciler-host-boundary-migration.md worker-progress/worker-040-dom-mutation-renderer-plan.md worker-progress/worker-044-react-dom-client-roots-plan.md`
- `sed -n '1,220p' worker-progress/worker-012-host-config-traits.md`
- `sed -n '1,240p' worker-progress/worker-018-test-renderer-mutation-host.md`
- `sed -n '1,220p' worker-progress/worker-019-reconciler-host-boundary-migration.md`
- `sed -n '1,220p' worker-progress/worker-040-dom-mutation-renderer-plan.md`
- `sed -n '1,220p' worker-progress/worker-044-react-dom-client-roots-plan.md`
- `rg --files packages/react-dom packages/scheduler`
- `sed -n '1,260p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberFlags.js`
- `sed -n '1,160p' <react-19.2.6-source>/packages/react-reconciler/src/ReactHookEffectTags.js`
- `rg -n "BeforeMutationMask|MutationMask|LayoutMask|PassiveMask|Insertion|commit.*Effects|root\\.current|flushPassive|deletions|subtreeFlags|flags" <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberCommitWork.js`
- `rg -n "commitHookEffectList|HookInsertion|HookLayout|HookPassive|HookHasEffect|lastEffect|updateQueue|destroy|create" <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberCommitEffects.js`
- `rg -n "bubbleProperties|subtreeFlags|flags|childLanes|appendAllChildren|Update|Ref|Visibility|Snapshot|Placement|ChildDeletion" <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberCompleteWork.js`
- `rg -n "root\\.current = finishedWork|commitRoot|commitBeforeMutationEffects|commitMutationEffects|commitLayoutEffects|flushPassiveEffects|pendingEffects|prepareForCommit|resetAfterCommit" <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `sed -n '336,356p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberCommitWork.js`
- `sed -n '3660,3895p' <react-19.2.6-source>/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `spawn_agent` read-only explorer for Rust crate gaps and mergeable slices.
- `spawn_agent` read-only explorer for React flags/effects/commit hypothesis.
- `wait_agent` for the two nested explorers, timed out after 10 seconds.

No source tests were run.

## Changed Files

- `worker-progress/worker-071-core-fiber-flags-effect-plan.md`

Untracked files already present:

- Root `Cargo.lock` is untracked. Per the worker brief and continuation
  instructions, this is a regenerable artifact and was not removed merely for
  existing.

## Risks Or Blockers

- Active worker 047 root-lane bookkeeping may alter the recommended root state
  type after it merges. This report does not depend on its unmerged output.
- The JS callback/rooting model is not settled. Effect create/destroy, refs,
  class callbacks, and wakeables must use opaque handles until the native/JS
  boundary proves lifetimes.
- Host token plumbing may need a breaking trait update before DOM events,
  hydration, and public instance lookup can be correct.
- React feature flags affect some phase masks. Fast React needs an explicit
  stable-channel feature policy before claiming exact React DOM behavior.
- Offscreen, Activity, Suspense, hydration, view transitions, forms, resources,
  and diagnostics add extra flags and traversal skips. The first commit slices
  should reserve data fields and fail closed instead of silently no-oping.
- Public conformance tests for effect order require root update queues and a
  test renderer commit path; until then, unit tests can verify only data model
  and traversal invariants.

## Recommended Next Tasks

1. Queue the core fiber flag primitive slice first. It is low-risk, independent
   of root scheduling, and gives all later workers one canonical mask type.
2. Queue hook effect tag primitives in parallel with flags if desired; the write
   scopes are disjoint except for `lib.rs` exports and can be sequenced by a
   small merge if necessary.
3. Queue fiber arena/topology after flags. Do not start commit traversal until
   fibers can store `flags`, `subtreeFlags`, `deletions`, `lanes`, and
   `alternate`.
4. Queue hook effect ring and complete-work bubbling next. These are the data
   structures that make tree/mask-driven commit traversal possible.
5. Queue reconciler commit state machine and mutation host effect data flow only
   after the core topology and bubbling helpers exist.
6. Queue layout/insertion/ref/callback effects before passive effects, because
   passive scheduling depends on the commit status model and deletion traversal.
7. Revisit host token plumbing after mutation and layout/passive tests expose
   the exact data the host adapter must see.
