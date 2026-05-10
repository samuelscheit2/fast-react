# Worker 139: Passive Effects And Refs Refresh

## Goal Evidence

- `create_goal` was called first with objective: "Produce a report-only refresh for passive effects, layout effects, insertion effects, and ref lifecycle sequencing after minimal commit begins landing, writing only worker-progress/worker-139-passive-ref-refresh.md."
- `get_goal` returned status `active` for the same objective.

## Summary

Fast React now has enough landed root/fiber scaffolding to split effects and
refs into source slices instead of keeping them as a generic commit footnote.
The next work should still stay report/canary first: use the landed
`FiberFlags`, `HookEffectFlags`, fiber topology, parent-owned deletions,
`FiberRoot` current/finished fields, root scheduler shell, and host token store,
but do not run JS effect or ref callbacks until a rooted JS handle/trampoline
boundary exists.

The refreshed sequencing target is:

1. Preserve React 19.2.6 phase masks and per-fiber hook rings.
2. Add fake-handle effect/ref data flow and operation-log tests around the
   minimal commit path.
3. Run insertion effect unmount/mount and layout destroy work in mutation.
4. Switch `root.current` only after host mutation/reset and before layout.
5. Run layout creates and ref attaches only after `root.current` is current.
6. Schedule passive work after layout while flushing passive unmounts before
   passive mounts in a separate passive phase.
7. Keep public JS callback execution and full hook compatibility behind
   explicit gates.

This report makes no Fast React compatibility claim for `useEffect`,
`useLayoutEffect`, `useInsertionEffect`, callback refs, object refs, React DOM,
or test-renderer public roots.

## Current Local State

- `crates/fast-react-core/src/fiber_flags.rs` is landed and exports React
  19.2.6 flag constants and masks, including `MUTATION_MASK`, `LAYOUT_MASK`,
  `PASSIVE_MASK`, `STATIC_MASK`, `REF`, `PASSIVE`, `LAYOUT_STATIC`,
  `PASSIVE_STATIC`, and feature-policy constants.
- `crates/fast-react-core/src/hook_effect_flags.rs` is landed and exports
  `HookEffectFlags::{HAS_EFFECT, INSERTION, LAYOUT, PASSIVE}` with phase
  helpers.
- `crates/fast-react-core/src/fiber.rs` has `FiberNode` fields for
  `ref_handle`, `update_queue`, `flags`, `subtree_flags`, and parent-owned
  `deletions`. It does not have an effect ring model yet.
- `crates/fast-react-core/src/fiber_deletions.rs` keeps deleted fibers
  reachable until explicit cleanup, which is required for later passive
  deleted-subtree traversal.
- `crates/fast-react-reconciler/src/fiber_root.rs` has `FiberRoot.current`,
  `finished_work`, `finished_lanes`, `pending_commit`, and
  `RootSchedulingState.pending_passive`, but there are no commit/effect modules
  yet.
- `crates/fast-react-reconciler/src/root_scheduler.rs` schedules roots and
  collects sync flush plans, but explicitly does not render, commit, flush, or
  mutate host containers.
- `crates/fast-react-reconciler/src/host_tokens.rs` can issue and validate
  phase/target-scoped host tokens for creation, commit, and deletion.
- `crates/fast-react-test-renderer/src/lib.rs` is token-aware and validates
  creation/commit/deletion token phases in direct host operations. It is still
  not a reconciler root and does not provide a reconciler operation log.

## Evidence Gathered

Required project context:

- `WORKER_BRIEF.md`: compatibility target is `react`/`react-dom` 19.2.6 and
  local source reference is `/Users/user/Developer/Developer/react-reference`
  at `v19.2.6`, commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- `MASTER_PLAN.md`: workers 130-139 are report-only while worker 129 advances
  HostRoot render-phase work; near-term focus remains minimal root render,
  sync flush, host tokens, and commit sequencing.
- `MASTER_PROGRESS.md`: accepted history includes root lanes, fiber flags,
  hook effect flags, fiber topology, FiberRoot/HostRoot, HostRoot queues, and
  root scheduler foundation.

Prior reports:

- Worker 066 supplies a checked React DOM 19.2.6 callback-ref oracle covering
  nested attach/detach order, stable and replaced refs, callback cleanup
  returns, object-ref relative ordering, StrictMode replay, and error routing
  through root `onUncaughtError`.
- Worker 071 established that commit traversal must use fiber
  `flags`/`subtreeFlags`/deletions plus per-fiber hook rings, not a global
  effect list.
- Worker 078 scoped the hook effect ring as `lastEffect.next` ordered storage
  with `EffectInstance.destroy` separate from effect nodes and JS callbacks
  rooted outside Rust arenas.
- Worker 082 fixed the commit order contract: prepare, before-mutation,
  mutation, host reset, `root.current` switch, layout, passive scheduling, and
  later passive flush.
- Worker 109 scoped the first minimal commit implementation as a generic
  mutation commit canary with fake/logging hosts, no public root or hook
  compatibility claim, and no JS callback execution.

React 19.2.6 source evidence from the local reference clone:

- `ReactFiberFlags.js` defines `MutationMask`, `LayoutMask`, `PassiveMask`,
  and `StaticMask`; the landed Rust flag module matches this shape.
- `ReactHookEffectTags.js` defines only `HasEffect`, `Insertion`, `Layout`,
  and `Passive`; the landed Rust hook flag module matches this shape.
- `ReactFiberHooks.js` appends hook effects into a per-fiber circular ring and
  sets fiber flags for passive, insertion, and layout effects.
- `ReactFiberCommitEffects.js` traverses a fiber update queue's
  `lastEffect.next` ring, filters with `(effect.tag & flags) === flags`, stores
  create returns on `inst.destroy`, and clears destroy before invoking it.
- `ReactFiberCommitEffects.js` attaches refs in layout and detaches refs by
  calling cleanup returns, callback refs with `null`, or object-ref `current =
  null`.
- `ReactFiberWorkLoop.js` flushes older pending effects before a new commit,
  records pending effect root/work/lanes, schedules passive work early, runs
  mutation, switches `root.current`, runs layout, then marks passive work for a
  later flush.
- `ReactFiberCommitWork.js` processes parent-owned deletions before children in
  mutation traversal, runs insertion effects and layout destroys in mutation,
  runs layout creates and ref attaches in layout, and flushes passive unmounts
  before passive mounts.

No delegated checks were used for this worker.

## Refreshed Source Slices

### 1. Core Hook Effect Ring Storage

Future write scope:

- `crates/fast-react-core/src/hook_effect_ring.rs`
- `crates/fast-react-core/src/fiber_handles.rs`
- `crates/fast-react-core/src/lib.rs`
- Future worker report

Purpose:

- Add `EffectId`, `EffectInstanceId`, `EffectNode`, `EffectInstance`,
  `DepsHandle`, and `EffectRing`.
- Store create, destroy, deps, ref cleanup, and future resource handles as
  opaque handles. Do not store raw JS values or call callbacks.
- Use landed `HookEffectFlags`; do not duplicate flag constants.
- Keep destroy storage separate from effect nodes so equal-deps updates can
  append an effect node without `HAS_EFFECT` while preserving the previous
  destroy handle.

Required tests:

- Empty ring and first append self-loop.
- Multiple append order with `last_effect.next` as first effect.
- Filtered iteration for `INSERTION | HAS_EFFECT`,
  `LAYOUT | HAS_EFFECT`, and `PASSIVE | HAS_EFFECT`.
- Effects without `HAS_EFFECT` remain in the ring but do not appear in
  fireable traversals.
- Equal-deps update reuses the prior `EffectInstanceId`.
- Destroy handle is cleared before fake invocation to prevent double cleanup
  under reentrancy.
- Aborted work-in-progress ring releases fake create/deps handles without
  touching current destroy handles.

Gate:

- This slice is data-model only. Real JS create/destroy execution waits for the
  native JS callback handle boundary.

### 2. Reconciler Commit Effect Traversal

Future write scope:

- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/commit_effects.rs`
- `crates/fast-react-reconciler/src/commit_mutation.rs`
- `crates/fast-react-reconciler/src/commit_layout.rs`
- `crates/fast-react-reconciler/src/commit_passive.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- Future worker report

Purpose:

- Consume landed `FiberFlags::{MUTATION_MASK, LAYOUT_MASK, PASSIVE_MASK}` and
  `subtree_flags` to skip clean subtrees.
- Enter parent-owned deletion lists when a parent has `CHILD_DELETION`.
- Keep the minimal commit canary host-only at first, but include typed markers
  for fake insertion/layout/passive/ref work.
- Fail closed on unsupported fiber tags before host mutation.

Required tests:

- Traversal skips subtrees with no phase mask.
- Parent-owned deletions are visited before child mutation work.
- Deletion lists stay reachable until passive deleted-subtree cleanup markers
  have been recorded.
- Unsupported function/hook work in the host-only commit canary returns a typed
  error before host calls, unless the test explicitly uses fake effect handles.
- No global effect list is added to fibers.

Gate:

- Full hook compatibility waits for function component rendering, hook state
  queues, dependency comparison, and public root/test-renderer integration.

### 3. Insertion And Layout Ordering

Future write scope:

- `crates/fast-react-reconciler/src/effects.rs`
- `crates/fast-react-reconciler/src/commit_mutation.rs`
- `crates/fast-react-reconciler/src/commit_layout.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- Future worker report

Purpose:

- Run insertion effect unmount and mount markers in the mutation partition for
  function-like fibers with `UPDATE`.
- Run layout effect destroy markers in mutation before any layout creates.
- Run layout creates in layout after `root.current` has switched.
- Keep real effect callback invocation behind fake invokers until JS rooting
  is available.

Required tests:

- `insertion_effects_run_in_mutation_before_layout`
- `layout_destroys_all_run_before_any_layout_creates`
- `layout_creates_see_finished_tree_as_current`
- `layout_destroy_error_is_captured_without_running_create`
- `strict_effects_dev_replay_is_reserved_but_not_claimed`

Gate:

- Development StrictEffects replay should remain a reserved test marker until
  function component rendering and dev-mode effect replay are implemented.

### 4. Ref Detach And Attach Data Flow

Future write scope:

- `crates/fast-react-reconciler/src/refs.rs`
- `crates/fast-react-reconciler/src/commit_mutation.rs`
- `crates/fast-react-reconciler/src/commit_layout.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- Future worker report

Purpose:

- Use the existing `FiberNode.ref_handle` as an opaque ref slot, then add a
  reconciler-owned `RefStore` for fake callback/object refs and cleanup-return
  handles.
- Detach changed refs and deleted refs during mutation.
- Attach new refs during layout after `root.current` switches.
- Obtain public host instances through `HostIdentityAndContext::get_public_instance`
  when attaching host component refs.
- Mirror worker 066 ordering with fake handles first, not JS callbacks.

Required tests:

- `ref_detach_for_deleted_host_parent_runs_before_host_removal`
- `changed_callback_ref_detaches_old_before_attaching_new`
- `object_ref_is_cleared_before_sibling_callback_detach_observes_it`
- `callback_cleanup_return_replaces_null_detach_for_fake_refs`
- `ref_attach_runs_after_current_switch_and_after_commit_mount`
- `ref_attach_error_routes_to_fake_root_error_without_claiming_js`

Gate:

- Real callback refs, cleanup return functions, object ref mutation through JS,
  and root `onUncaughtError` callback invocation wait for the JS callback/value
  handle boundary and public root error policy.

### 5. Passive Scheduling And Flush

Future write scope:

- `crates/fast-react-reconciler/src/commit_passive.rs`
- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- Future worker report

Purpose:

- Expand `PendingPassiveState` beyond `root + lanes` to include finished work,
  unmount/mount presence, deleted-subtree retention, and deterministic test
  flush hooks.
- Schedule passive work after layout while preserving React's rule that passive
  effects do not execute inside mutation or layout.
- Flush passive unmounts before passive mounts.
- Traverse deleted subtrees parent-to-child for passive unmounts, then detach
  after-effects fields and allow deletion list cleanup.
- Route updates scheduled during passive flush through root scheduling, not a
  direct commit recursion.

Required tests:

- `passive_work_is_marked_after_layout_and_not_flushed_in_commit`
- `flush_passive_runs_unmounts_before_mounts`
- `deleted_subtree_passive_unmounts_are_parent_before_child`
- `passive_flush_rejects_render_or_commit_reentrancy`
- `passive_flush_scheduled_update_reschedules_root`
- `no_passive_effects_clears_pending_passive_state`

Gate:

- Passive callback execution waits for effect ring storage, JS callback
  rooting, and scheduler/act integration. The first slice should record fake
  invocations only.

### 6. Host Token Interactions

Future write scope:

- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/commit_mutation.rs`
- `crates/fast-react-reconciler/src/commit_layout.rs`
- `crates/fast-react-reconciler/src/refs.rs`
- `crates/fast-react-test-renderer/src/lib.rs` only if an operation log is
  added there
- Future worker report

Purpose:

- Issue creation tokens in complete work, commit tokens for
  `commit_update`/`commit_mount`, and deletion tokens for
  `detach_deleted_instance`.
- Validate root, fiber, phase, and target before host calls.
- Invalidate deletion tokens and ref/public-instance mappings after deleted
  instance cleanup.
- Do not call `detach_deleted_instance` for text nodes because the host hook is
  instance-only.

Required tests:

- `host_update_uses_commit_phase_instance_token`
- `commit_mount_uses_commit_phase_instance_token_after_current_switch`
- `deleted_instance_detach_uses_deletion_phase_instance_token`
- `text_deletion_removes_text_without_instance_detach_token`
- `wrong_phase_or_target_token_aborts_before_host_mutation`
- `deleted_token_is_stale_after_detach_cleanup`

Gate:

- DOM node maps, event lookup, hydration lookup, and public instance exposure
  stay renderer-specific and must not leak core fiber internals through tokens.

## Oracle And Conformance Plan

Use worker 066's React DOM ref oracle as the public behavior target once DOM
root rendering and host mutation exist. Until then, keep effect/ref tests as
Rust fake-handle unit tests and operation-order canaries.

Future conformance additions should be separate from the internal slices:

- React DOM callback-ref dual-run using the existing
  `dom-ref-callback-*` oracle only after DOM host mutation and root rendering
  are implemented.
- React DOM effect-order oracle for `useInsertionEffect`, `useLayoutEffect`,
  and `useEffect` only after function component rendering and hook effect rings
  execute through a rooted JS trampoline.
- Test-renderer effect/ref oracle only after test-renderer public root API and
  serialization are connected to the shared reconciler commit path.

## Risks Or Blockers

- There is no landed reconciler commit module yet. Effect/ref work should not
  bypass the minimal commit phase machine.
- There is no landed hook effect ring or function component update queue. Hook
  execution must not be simulated with a global effect list.
- JS callback/value rooting is unresolved. Raw JS callbacks, ref cleanup
  returns, deps arrays, and destroy functions must not be stored directly in
  Rust arenas.
- `PendingPassiveState` is currently too small for deleted-subtree passive
  cleanup and deterministic passive flush tests.
- Ref semantics need a fake `RefStore` before real callback refs, object refs,
  or root error callbacks can run.
- Host token validation exists, but the minimal commit path still needs
  phase-correct token issuance and invalidation tied to fiber/root ownership.
- DOM compatibility remains unclaimed. DOM props, events, hydration, resources,
  focus/selection, forms, and root facade behavior are outside this refresh.

## Recommended Next Tasks

1. Add a report/implementation worker for core hook effect ring storage using
   landed `HookEffectFlags` and opaque fake callback/value handles.
2. Add the minimal commit phase modules with test-only operation logs before
   adding any real JS effect/ref callback execution.
3. Add fake ref detach/attach data flow and tests immediately after the
   mutation/layout commit skeleton can switch `root.current`.
4. Expand pending passive state and add deterministic passive flush tests
   before scheduler/act public integration.
5. Add host token issuance/invalidation tests around commit, deletion, and ref
   public-instance access.
6. Convert worker 066's DOM ref oracle into a dual-run conformance gate only
   after DOM root render and mutation host integration are real.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The refresh consumes current landed source instead of treating workers 071,
  078, 082, and 109 as the whole state of the repo.
- It preserves React 19.2.6 ordering: insertion/layout cleanup in mutation,
  layout creates/ref attaches after current switch, and passive unmounts before
  passive mounts.

Maintainability:

- Source slices are split by data model, traversal, refs, passive work, and
  token validation.
- Existing `FiberFlags`, `HookEffectFlags`, `RefHandle`, deletion lists, and
  host token types remain the shared primitives.

Performance:

- Tree traversal remains mask-driven with `subtree_flags` skips.
- Hook effects remain per-fiber circular rings. No per-commit global effect
  list or production operation log is introduced.

Security:

- JS callbacks and refs stay opaque and gated.
- Host tokens remain phase/target scoped and must be invalidated on deletion.
- DOM-specific node maps and event/hydration identities stay outside core and
  shared reconciler data structures.

## Commands Run

Goal and project context:

```sh
create_goal
get_goal
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
ls -la worker-progress
```

Required reports:

```sh
sed -n '1,260p' worker-progress/worker-066-dom-ref-callback-oracle.md
sed -n '1,560p' worker-progress/worker-071-core-fiber-flags-effect-plan.md
sed -n '1,560p' worker-progress/worker-078-hook-effect-ring-plan.md
sed -n '1,700p' worker-progress/worker-082-reconciler-commit-ordering-plan.md
sed -n '1,760p' worker-progress/worker-109-reconciler-commit-minimum-implementation-plan.md
```

Current Fast React source:

```sh
rg --files crates packages tests | sort | rg '(fiber_flags|hook_effect|commit|fiber|host|reconciler|test-renderer|react-dom)'
sed -n '1,620p' crates/fast-react-core/src/fiber.rs
sed -n '1,280p' crates/fast-react-core/src/fiber_flags.rs
sed -n '1,240p' crates/fast-react-core/src/hook_effect_flags.rs
sed -n '1,260p' crates/fast-react-core/src/fiber_bubbling.rs
sed -n '1,560p' crates/fast-react-core/src/fiber_deletions.rs
sed -n '1,260p' crates/fast-react-core/src/fiber_handles.rs
sed -n '1,700p' crates/fast-react-reconciler/src/fiber_root.rs
sed -n '1,760p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,620p' crates/fast-react-reconciler/src/root_updates.rs
sed -n '1,700p' crates/fast-react-reconciler/src/fiber_store.rs
sed -n '1,320p' crates/fast-react-reconciler/src/work_in_progress.rs
sed -n '1,720p' crates/fast-react-reconciler/src/host_tokens.rs
sed -n '1,760p' crates/fast-react-reconciler/src/test_support.rs
sed -n '1,1460p' crates/fast-react-host-config/src/lib.rs
sed -n '1,430p' crates/fast-react-reconciler/src/root_config.rs
sed -n '1,1180p' crates/fast-react-test-renderer/src/lib.rs
sed -n '1420,1565p' crates/fast-react-test-renderer/src/lib.rs
rg -n "Effect|effect|ref|Ref|Passive|Layout|Insertion|commit|Commit|current|finished|pending_passive" crates/fast-react-core/src crates/fast-react-reconciler/src crates/fast-react-host-config/src/lib.rs crates/fast-react-test-renderer/src/lib.rs
```

React 19.2.6 reference source:

```sh
git -C /Users/user/Developer/Developer/react-reference rev-parse HEAD
git -C /Users/user/Developer/Developer/react-reference describe --tags --exact-match HEAD
find /Users/user/Developer/Developer/react-reference -maxdepth 4 -path '*ReactFiberCommit*' -o -path '*ReactFiberHooks.js' -o -path '*ReactFiberFlags.js' -o -path '*ReactHookEffectTags.js' | sort
rg -n "export const (NoFlags|Placement|Update|ChildDeletion|Ref|Passive|BeforeMutationMask|MutationMask|LayoutMask|PassiveMask|StaticMask)|enableCreateEventHandleAPI|enableUseEffectEventHook" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberFlags.js
rg -n "export const (NoFlags|HasEffect|Insertion|Layout|Passive)" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactHookEffectTags.js
rg -n "pushEffectImpl|mountEffectImpl|updateEffectImpl|useInsertionEffect|useLayoutEffect|useEffect\\(|HookLayout|HookPassive|HookInsertion|HasEffect" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js
rg -n "commitHookEffectListUnmount|commitHookEffectListMount|commitHookPassiveMountEffects|commitHookPassiveUnmountEffects|commitHookLayoutEffects|commitHookLayoutUnmountEffects|commitHookInsertionEffects|safelyCallDestroy|inst.destroy|lastEffect" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitEffects.js
rg -n "commitRoot\\(|flushPendingEffects|flushPassiveEffects|pendingEffectsStatus|PENDING_MUTATION_PHASE|flushMutationEffects\\(|root.current = finishedWork|flushLayoutEffects\\(|commitBeforeMutationEffects|commitMutationEffects|commitLayoutEffects|ensureRootIsScheduled" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js
rg -n "commitMutationEffects\\(|commitMutationEffectsOnFiber|recursivelyTraverseMutationEffects|commitDeletionEffects|safelyDetachRef|safelyAttachRef|commitHookPassiveUnmountEffects|commitHookPassiveMountEffects" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js | sed -n '2570,2795p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitEffects.js | sed -n '90,335p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitEffects.js | sed -n '740,915p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '3416,4050p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '4489,4660p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js | sed -n '1320,1665p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js | sed -n '1940,2035p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js | sed -n '3418,3610p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js | sed -n '4500,5075p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitHostEffects.js | sed -n '480,680p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberFlags.js | sed -n '18,140p'
```

Ref oracle details:

```sh
sed -n '1,240p' tests/conformance/src/dom-ref-callback-scenarios.mjs
sed -n '115,380p' tests/conformance/test/dom-ref-callback-oracle.test.mjs
rg -n "callback-ref|object-ref|StrictMode|cleanup|attach|detach|error" tests/conformance/oracles/react-19.2.6-dom-ref-callback-oracle.json
```

Status checks before final verification:

```sh
git status --short --untracked-files=all
git diff --check
git diff --name-only -- worker-progress/worker-139-passive-ref-refresh.md
git status --short --untracked-files=all -- worker-progress/worker-139-passive-ref-refresh.md
bash -lc 'output=$(git diff --no-index --check -- /dev/null worker-progress/worker-139-passive-ref-refresh.md 2>&1); status=$?; printf "%s" "$output"; if [ "$status" -gt 1 ]; then exit "$status"; fi; test -z "$output"'
rg -n "Pending final|TODO|ORCHESTRATOR|compatibility claim|Gate:|Changed Files|Verification|Recommended Next Tasks|Risks Or Blockers" worker-progress/worker-139-passive-ref-refresh.md
sed -n '1,220p' worker-progress/worker-139-passive-ref-refresh.md
sed -n '220,520p' worker-progress/worker-139-passive-ref-refresh.md
sed -n '520,900p' worker-progress/worker-139-passive-ref-refresh.md
```

## Changed Files

- `worker-progress/worker-139-passive-ref-refresh.md`

## Verification

- `git diff --check` passed.
- `git diff --no-index --check -- /dev/null worker-progress/worker-139-passive-ref-refresh.md`
  produced no whitespace warnings for the untracked report file.
- Scoped changed-path check passed:
  `git status --short --untracked-files=all -- worker-progress/worker-139-passive-ref-refresh.md`
  showed only `?? worker-progress/worker-139-passive-ref-refresh.md`.
- Full `git status --short --untracked-files=all` also showed
  `?? .worker-logs/worker-139-passive-ref-refresh.log`, which is outside this
  worker report scope and was not modified by this report.
