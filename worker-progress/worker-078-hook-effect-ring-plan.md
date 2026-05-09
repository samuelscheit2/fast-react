# worker-078-hook-effect-ring-plan

## Objective

Produce a report-only plan for per-fiber hook effect rings, insertion/layout/passive effect metadata, and callback storage.

Write scope honored: this worker only writes `worker-progress/worker-078-hook-effect-ring-plan.md`. No Rust, JavaScript, package, or test implementation is included in this plan.

## Summary

Fast React should model function-component effects as per-fiber circular rings, not as a global fiber effect list. React 19.2.6 keeps commit traversal tree-driven through `flags`, `subtreeFlags`, and parent-owned `deletions`; the ordered list that still exists is scoped to one function component fiber through `finishedWork.updateQueue.lastEffect`.

The implementation root cause is callback lifetime, not only list shape. Each effect node needs stable effect identity, phase flags, create callback storage, destroy callback storage through a separate effect instance, dependency handles, and explicit JS rooting. Rust must not store raw JS function or value references, and an aborted render must release create/deps handles that never commit.

If worker 076 lands first, this plan should consume its `FiberFlags` and `HookEffectFlags` bitsets directly. Worker 076 should remain the flag primitive slice; the effect ring slice should add `EffectId`, `EffectNode`, `EffectRing`, callback/deps handle types, and filtered traversal helpers without duplicating flag constants.

## Evidence Gathered

Required merged worker evidence:

- `worker-progress/worker-007-scheduler-fiber.md`: rejects flat priorities, FIFO queues, and a global effect list. It records that React 19.2.6 commits by `flags`/`subtreeFlags`/`deletions`, while hook effects remain in a per-fiber circular ring at `finishedWork.updateQueue.lastEffect`.
- `worker-progress/worker-071-core-fiber-flags-effect-plan.md`: defines the broader flags and commit-phase plan, including insertion/layout/passive hook tags, static flags, and the requirement to keep effect callback storage separate from Rust lifetimes.
- `worker-progress/worker-073-test-renderer-update-model-plan.md`: confirms test-renderer updates must use shared root/update/commit semantics rather than direct renderer mutation, so effect ordering must live in reconciler commit traversal.

Additional local evidence:

- `docs/tasks/worker-076-core-fiber-flags.prompt.md`: worker 076 is scoped to `fiber_flags.rs`, `hook_effect_flags.rs`, `lib.rs`, and its report. It explicitly does not implement fibers, roots, update queues, or commit traversal.
- Current `fast-react-core` exports lanes and element placeholders but has no fiber, hook effect, or update queue modules yet.
- Current `fast-react-reconciler` remains a placeholder and has no root, fiber arena, update queue, function component queue, or commit traversal.
- Current `fast-react-host-config` already has renderer-neutral `HostFiberTokenRef` support for host instances. That helps DOM/native host mapping, but it is separate from JS effect callback rooting.
- Worker 006 and worker 070 both require JS-owned public values and rooted native handles. Rust must not store raw JS callbacks across turns, aborts, or Node environments.

Pinned React 19.2.6 source evidence, using normalized source paths:

- `packages/react-reconciler/src/ReactInternalTypes.js`: Fiber stores `updateQueue`, `flags`, `subtreeFlags`, and `deletions`; there are no fiber `firstEffect`/`lastEffect`/`nextEffect` fields.
- `packages/react-reconciler/src/ReactHookEffectTags.js`: hook flags are `NoFlags`, `HasEffect`, `Insertion`, `Layout`, and `Passive`.
- `packages/react-reconciler/src/ReactFiberHooks.js`: `FunctionComponentUpdateQueue` stores `lastEffect`; `Effect` stores `tag`, `inst`, `create`, `deps`, and `next`; `EffectInstance` stores `destroy`.
- `packages/react-reconciler/src/ReactFiberHooks.js`: `pushEffectImpl` appends by tail pointer. Empty rings set `lastEffect = effect.next = effect`; non-empty rings splice after the tail and then make the new node the tail.
- `packages/react-reconciler/src/ReactFiberHooks.js`: effect updates append even when dependencies are equal, but equal deps omit `HasEffect` and reuse the existing effect instance.
- `packages/react-reconciler/src/ReactFiberCommitEffects.js`: commit helpers read `finishedWork.updateQueue.lastEffect`, start at `lastEffect.next`, filter with `(effect.tag & flags) === flags`, run until returning to the first effect, store create return values in `inst.destroy`, and clear `inst.destroy` before calling destroy.
- `packages/react-reconciler/src/ReactFiberCommitWork.js`: insertion effects run in the mutation partition, layout destroys run in mutation before layout creates, and passive unmounts/mounts run in deferred passive traversal.

Nested-agent hypothesis checks:

- Spawned read-only explorer `019e0ecb-16bf-7a42-bc67-39b4926ed50c` to challenge the upstream React hook-effect model and callback storage assumptions.
- Spawned read-only explorer `019e0ecb-21f2-7840-8b71-fa13f5e6ee02` to challenge the local integration plan, especially the worker 076 dependency boundary.
- Both agents were still running when the initial report was drafted. The conclusions above are grounded in direct local and upstream evidence; any late useful findings should be folded into a follow-up note before merge.

## Reject Global Effect Lists

Fast React should not add global `firstEffect`, `lastEffect`, or `nextEffect` fiber fields.

Reasons:

- React 19.2.6 no longer has the old tree-wide effect list on fibers. A global list would be a compatibility regression from the target model, not an optimization.
- Commit phases need different tree traversals and masks. Before-mutation, mutation, layout, passive, deletion, hidden/offscreen, hydration, and Suspense paths do not all visit the same effects in one flat order.
- Parent-owned `deletions` are not discoverable from the finished sibling chain. A global list would either miss deleted-subtree cleanup or duplicate tree-specific deletion logic.
- Per-fiber hook order matters only inside one function component. Inter-fiber ordering comes from commit tree traversal, not from a renderer-assembled global list.
- A global list would make aborted work and alternate reuse harder to reason about because effect nodes from a discarded work-in-progress render could accidentally stay reachable.

Use this naming rule in future code and reports: "effect list" should mean the per-fiber hook effect ring unless explicitly called a historical global fiber effect list.

## Required Data Model

### IDs and ownership

Use stable IDs instead of Rust references inside effect nodes:

- `FiberId`: arena handle for the owning function component fiber.
- `HookId`: optional handle to the hook slot whose `memoized_state` points at the current effect.
- `EffectId`: generational arena handle for an effect node in a render-owned effect arena.
- `EffectInstanceId`: stable handle for the effect instance that stores the last committed destroy callback.
- `JsFunctionHandle`: rooted JS function handle for create or destroy callbacks.
- `JsValueHandle`: rooted JS value handle for dependency arrays and any future resource values.

`EffectId` should be generational or otherwise validated. Stale effect IDs from discarded work-in-progress trees must fail closed rather than resolving to reused nodes.

### Function component update queue

Model a function component update queue separately from class/HostRoot update queues:

```text
FunctionComponentUpdateQueue {
  last_effect: Option<EffectId>,
  events: optional future useEffectEvent payload storage,
  stores: optional useSyncExternalStore consistency storage,
  memo_cache: optional memo cache handle,
}
```

The ring belongs to the function component fiber's `update_queue`. It is not a root queue and not a host operation queue.

### Effect node

The initial core shape should be renderer-agnostic:

```text
EffectNode {
  id: EffectId,
  tag: HookEffectFlags,
  instance: EffectInstanceId,
  create: JsFunctionHandle,
  deps: DepsHandle,
  next: EffectId,
}

EffectInstance {
  destroy: Option<JsFunctionHandle>,
}
```

Do not inline destroy into `EffectNode`. React deliberately keeps `destroy` on a separate effect instance that can be reused across renders. That matters when an update appends a new effect node with equal deps and no `HasEffect`: the prior destroy callback remains associated with the effect instance, but no create/destroy work runs in that commit.

### Dependency handles

Use an explicit dependency handle enum:

```text
DepsHandle {
  AlwaysRun,
  Array(JsValueHandle),
}
```

React normalizes omitted deps to `null`, and a null deps slot means the effect is always eligible to fire. Array deps must remain JS-owned/rooted and compared by React's element-wise `Object.is` semantics through a JS-aware comparison boundary or a value representation that proves equivalent behavior.

The ring stores the deps handle used for this render. A changed dependency set appends `HasEffect | phase`; an equal dependency set appends only the phase flag and reuses the prior `EffectInstanceId`.

## Ring Invariants

Append invariants:

- `last_effect = None` means the ring is empty.
- First append sets `effect.next = effect.id` and `last_effect = effect.id`.
- Later appends read `first = last.next`, set `last.next = effect.id`, set `effect.next = first`, and then set `last_effect = effect.id`.
- `last_effect.next` is always the first effect in hook call order.
- Iteration starts from `last_effect.next`, visits each node once, and stops when the cursor returns to the first effect.
- Append preserves hook declaration order within the owning function component.
- Every render that processes hooks rebuilds the function component effect ring for the work-in-progress fiber. It must not mutate the current fiber's committed ring in place.

Traversal invariants:

- Filter with "contains all requested flags", matching React's `(effect.tag & flags) === flags`.
- `Insertion | HasEffect` runs in the mutation partition.
- `Layout | HasEffect` destroy runs in mutation; layout create runs in layout.
- `Passive | HasEffect` destroy and create run in the deferred passive flush, with passive unmounts before passive mounts.
- Effects without `HasEffect` remain in the ring for ordering and state retention but do not run in that commit.
- Deleted-subtree passive unmount traversal must not rely only on the finished tree's ring traversal; it must be reached from parent-owned deletions and passive masks.

Reset and abort invariants:

- Starting a fresh function component render resets the work-in-progress queue's `last_effect` to `None` while preserving memo cache policy separately.
- If a render aborts before commit, create and deps handles allocated only for that work-in-progress ring must be released.
- If a commit replaces or unmounts an effect, clear/release the stored destroy handle before invoking it so reentrant work cannot call it twice.

## Fiber Flag Integration

The ring does not replace fiber flags. Hook render code must set fiber flags so commit traversal can find the fiber:

- `useInsertionEffect`: set fiber `Update`; append hook `Insertion`, with `HasEffect` when mount or deps changed.
- `useLayoutEffect`: set fiber `Update | LayoutStatic` on mount; set `Update` on changed updates; append hook `Layout`.
- `useEffect`: set fiber `Passive | PassiveStatic` on mount; set `Passive` on changed updates; append hook `Passive`.
- Development StrictEffects flags, if modeled by worker 076 or a later dev-mode slice, must compose with the same ring rather than creating a second effect store.

If worker 076 lands first:

- Import `FiberFlags` and `HookEffectFlags` from `fast-react-core` and use their exact constants and mask helpers.
- Do not create duplicate hook flag types in the ring module.
- Add any ring-specific filter helpers as methods or extension helpers over the worker 076 type.
- Keep worker 076's scope intact: no `EffectId`, `EffectNode`, callback handles, deps handles, function component update queues, or commit traversal should be backfilled into the flag worker.
- Update the ring tests to assert against worker 076 constants instead of numeric literals, while worker 076 keeps the exact-bit tests.

If worker 076 has not landed:

- Sequence the hook ring worker after the flag worker, or first add only a private prototype in a report/fixture. Implementing ring storage before canonical flags would create throwaway types and increase merge risk.

## Callback Storage And Rooting Risks

Effect callbacks are user JS. The Rust core must treat them as opaque rooted handles, not raw pointers or raw `napi_value`s.

Required rooting policy:

- `create` handles are rooted when captured for a work-in-progress effect node.
- `deps` handles are rooted while the current or work-in-progress effect can compare or commit them.
- `destroy` handles returned by create are rooted in `EffectInstance.destroy` until cleared by unmount, replacement, hidden/offscreen cleanup, or root disposal.
- Handles allocated for aborted renders are released when the work-in-progress tree is discarded.
- Handles belonging to the current tree remain alive across renders until the effect is destroyed or the root unmounts.
- Callback invocation must happen on the owning JS environment through a trampoline. Rust must not call user JS from background threads.
- Commit reentrancy guards must be active before create/destroy callbacks run. User callbacks may schedule updates, throw, or unmount roots.
- Errors from create/destroy must route through commit-phase error capture with fiber context. They should not expose arena IDs, local paths, or renderer-private storage unless a diagnostics policy explicitly permits it.

The native boundary should expose typed handle APIs before any real JS effect implementation lands. Until then, core unit tests can use fake callback handles and deterministic fake invokers.

## Future Implementation Slices

1. `core-hook-effect-ring-types`
   - Write scope: `crates/fast-react-core/src/hook_effect.rs` or `hook_effect_ring.rs`, `crates/fast-react-core/src/lib.rs`, worker report.
   - Depends on worker 076 flags.
   - Add `EffectId`, `EffectInstanceId`, `EffectNode`, `EffectInstance`, `DepsHandle`, and ring append/iteration helpers with fake callback/value handles.

2. `core-function-component-update-queue`
   - Write scope: core or reconciler queue module chosen by the fiber topology worker.
   - Depends on fiber topology and hook ring types.
   - Add function component update queue storage with `last_effect`, future `events`, future `stores`, and memo cache slot.

3. `reconciler-hook-effect-render-integration`
   - Write scope: reconciler hook render module.
   - Depends on hook state/update queues and function component fibers.
   - Wire mount/update effect helpers, dependency comparison, `HasEffect` decisions, and fiber flag setting.

4. `reconciler-insertion-layout-effect-commit`
   - Write scope: reconciler commit/effects modules.
   - Depends on commit skeleton, hook render integration, and host mutation path.
   - Implement insertion effect unmount/mount in mutation and layout destroy/create partitioning.

5. `reconciler-passive-effect-queue`
   - Write scope: reconciler passive effects module and root pending passive state.
   - Depends on commit state machine.
   - Implement deferred passive unmount-before-mount flushing for normal finished trees and deletion subtrees.

6. `native-js-callback-handle-boundary`
   - Write scope: native binding boundary and JS facade tests.
   - Depends on private root/fiber APIs.
   - Add rooted callback/value handles, environment cleanup, aborted-render disposal, and trampoline-based invocation tests.

## Verification Plan For Future Code

Core unit tests:

- Empty ring and first append self-loop.
- Multi-effect append order and `last.next` first-effect invariant.
- Filtered traversal for insertion/layout/passive with and without `HasEffect`.
- Equal deps append without `HasEffect` and preserve the prior effect instance.
- Changed deps append with `HasEffect`.
- Destroy handle is stored on the effect instance, not the effect node.
- Stale `EffectId` or wrong-owner `EffectId` fails closed.
- Aborted work-in-progress ring releases create/deps handles without touching current destroy handles.

Reconciler tests:

- Function component render sets the correct fiber flags for insertion, layout, and passive effects.
- Layout destroys all run before any layout creates.
- Insertion effects run in the mutation partition.
- Passive unmounts run before passive mounts in a deferred flush.
- Deleted subtree passive unmounts run parent-to-child through deletion traversal.
- Reentrant updates from create/destroy are guarded and scheduled through root scheduling.

Conformance tests should wait until root update queues, function component rendering, and test-renderer or DOM commit paths exist. Before that, unit tests can prove data model and traversal invariants but cannot claim public `useEffect` compatibility.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan follows React 19.2.6's actual shape: tree/mask commit traversal plus per-fiber hook effect rings.
- It rejects a global effect list because that would mask the current scaffold gap while creating wrong cleanup and phase behavior.

Maintainability:

- Keep flag constants in worker 076's modules and keep effect storage in separate ring modules.
- Keep callback handles abstract until the native boundary proves the JS rooting model.
- Keep function component effect queues distinct from class/HostRoot update queues even if they share arena and ID utilities.

Performance:

- Tail-pointer circular append is O(1) and allocation-light when backed by an arena.
- Commit traversal remains skip-by-mask at the fiber tree level; the ring is only scanned when the owning fiber's flags indicate possible effect work.
- Do not allocate a global list per commit.

Security:

- Raw JS callbacks, deps arrays, destroy functions, refs, and wakeables must not be stored directly in Rust arenas.
- Destroy handles must be cleared before invocation to avoid double calls under reentrancy.
- Root disposal and aborted renders must release rooted JS handles deterministically.
- Errors should be structured and path-free.

## Commands Run

- `create_goal` for the worker objective.
- Read required context with `sed`: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-007-scheduler-fiber.md`, `worker-progress/worker-071-core-fiber-flags-effect-plan.md`, and `worker-progress/worker-073-test-renderer-update-model-plan.md`.
- Inspected related local context with `rg --files`, `git status --short --untracked-files=all`, `sed`, and `rg` over worker reports and current Rust crates.
- Read worker 076 and worker 078 task prompts.
- Downloaded pinned React 19.2.6 source to a temporary directory for local inspection.
- Inspected normalized React source files with `rg`, `nl`, and `sed`: `ReactInternalTypes.js`, `ReactHookEffectTags.js`, `ReactFiberHooks.js`, `ReactFiberCommitEffects.js`, and `ReactFiberCommitWork.js`.
- Spawned two read-only explorers for upstream and local integration hypothesis checks.
- Waited once for both explorers; they had not returned by initial draft time.
- Ran a scoped local/temp path leak check on the report.
- `git diff --check -- worker-progress/worker-078-hook-effect-ring-plan.md`

No source tests were run because this is a report-only planning task.

## Changed Files

- `worker-progress/worker-078-hook-effect-ring-plan.md`

## Risks Or Blockers

- Worker 076 is active but not present as a merged report or source change in this worktree. The hook ring implementation should wait for or consume its flag names to avoid duplicate bitsets.
- Fiber topology is still unimplemented. Ring ownership and stale ID validation depend on the final fiber arena and alternate model.
- The JS callback/rooting model is unresolved. Real effect callbacks must wait for a native handle boundary and JS trampoline policy.
- Offscreen, Activity, Suspense, hydration, StrictEffects, and future feature flags add traversal cases. The first implementation should reserve the model and fail closed rather than silently skipping them.
- Public effect conformance cannot be claimed until function component render, root scheduling, and commit paths exist.

## Recommended Next Tasks

1. Merge or finish worker 076's `FiberFlags` and `HookEffectFlags` primitives.
2. Queue a core hook effect ring implementation worker after fiber topology is settled enough to define owner IDs and generational effect IDs.
3. Queue a native callback/value handle boundary before real JS create/destroy callbacks can be stored or invoked.
4. Queue reconciler hook render integration only after hook state queues and function component fibers exist.
5. Queue insertion/layout commit traversal before passive effects, because passive scheduling depends on the root commit state machine and deletion traversal.
