# Worker 104: Reconciler Root Model Implementation Plan

## Goal Setup

- Active goal status: `active`
- Active goal objective: Produce a report-only implementation plan for the first `fast-react-reconciler` FiberRoot/HostRoot data model slice, including root records, HostRoot fiber initialization, current/alternate wiring, root lifecycle fields, callback handles, fake-host tests, and the migration path away from placeholder render APIs.
- `get_goal` availability: available and called successfully after goal creation.

## Progress Log

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Confirmed `worker-progress/worker-080-reconciler-host-root-update-queue-plan.md` is not present in this worktree, while master tracking still lists worker 080 as running. This report treats worker 080 evidence as unavailable/provisional.
- Spawned three read-only explorer subagents to test planning assumptions against merged reconciler reports, DOM/root boundary reports, and current source/test topology.

## Summary

The first `fast-react-reconciler` FiberRoot/HostRoot implementation should be a data-model slice, not a render-compatibility slice. It should introduce internal root records, HostRoot fiber creation, current/work-in-progress alternate wiring, root lifecycle/work status fields, typed callback-handle placeholders, root lane/scheduler shell fields, and token-aware fake-host tests that prove root construction is renderer-opaque and side-effect free.

The root cause is the same across the merged reports: public `root.render`, test-renderer updates, `root.unmount`, and future native integration all need a real reconciler `FiberRoot` that owns the current HostRoot fiber and root-wide scheduling/lifecycle state. The current `render_mutation_placeholder` and `render_placeholder` APIs prove only host-boundary scaffolding. Growing them into fake render APIs would bypass HostRoot queues, lanes, scheduler callback reuse, commit ordering, callback lifetimes, and root disposal semantics.

The first implementation worker should therefore change only reconciler source files and tests. It should not implement `update_container`, DOM mutation, public React DOM root objects, hydration, hooks, function components, public Scheduler package behavior, or native/public JS root handles.

## Evidence Gathered

Required context read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`

Merged root/reconciler reports read:

- `worker-progress/worker-019-reconciler-host-boundary-migration.md`
- `worker-progress/worker-044-react-dom-client-roots-plan.md`
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`
- `worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `worker-progress/worker-079-reconciler-fiber-root-model-plan.md`
- `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md`
- `worker-progress/worker-082-reconciler-commit-ordering-plan.md`
- `worker-progress/worker-090-dom-node-map-public-instance-plan.md`
- `worker-progress/worker-094-root-unmount-flushsync-plan.md`
- `worker-progress/worker-096-native-root-boundary-plan.md`

Worker 080 status:

- `worker-progress/worker-080-reconciler-host-root-update-queue-plan.md` is absent in this worktree.
- `MASTER_PLAN.md` and `MASTER_PROGRESS.md` still list worker 080 as running.
- This plan does not depend on unmerged worker 080 evidence. HostRoot update queues are treated as reserved slots only, with queue behavior delegated to worker 080 or an equivalent future implementation.

Current source evidence:

- `crates/fast-react-reconciler/src/lib.rs` currently contains `ReconcilerError`, `validate_mutation_renderer_boundary`, `render_mutation_placeholder`, legacy `render_placeholder`, and a scheduler placeholder. It has no root records, fiber records, arenas, HostRoot state, update queues, work loop, scheduler, or commit code.
- `crates/fast-react-core/src/lane.rs` exports React 19.2.6 lane bitsets and `LaneMap<T>`. Root lane bookkeeping algorithms are not present in this worktree.
- `crates/fast-react-host-config/src/lib.rs` has canonical `HostTypes`, `HostFiberTokenRef`, token-aware `HostCreation`/`HostCommit`, `HostScheduling`, and `MutationRenderer`. This means new fake hosts must use token-aware signatures.
- `crates/fast-react-test-renderer/src/lib.rs` still shows useful in-memory mutation-host storage, but local method signatures are not yet token-aware in the inspected worktree. The first root-model tests should use in-crate fake hosts, not depend on test-renderer migration.

Delegated checks:

- Reconciler reports explorer read workers 019, 072, 079, 081, and 082. It confirmed the first slice should create real `FiberRoot`/HostRoot records, keep root construction independent from `MutationRenderer`, initialize current HostRoot state, add alternate wiring early, separate lifecycle from work status, keep user callback handles distinct from scheduler callback handles, and leave worker 080 queue behavior provisional.
- DOM/root boundary explorer read workers 044, 055, 090, 094, and 096. It confirmed the slice must avoid public `ReactDOMRoot`, DOM markers/listeners/node maps, DOM mutation, hydration, hooks/effects, public Scheduler package APIs, and public/native root exposure. It also listed the now-needed fields: opaque `containerInfo`, current HostRoot, root options, error callback handles, lane maps, scheduler placeholders, context placeholders, and update queue slots.
- Source-topology explorer inspected current Rust crates. It recommended new future files `crates/fast-react-reconciler/src/root.rs`, `crates/fast-react-reconciler/src/fiber.rs`, optional `crates/fast-react-reconciler/src/host_root.rs`, and `crates/fast-react-reconciler/src/lib.rs` exports. It also identified the current placeholder APIs and the token-aware fake-host migration issue.

Did not read `ORCHESTRATOR.md`.

## Root-Cause Conclusions

### FiberRoot Is The Internal Root, Not A Public Facade

React DOM client roots, test-renderer roots, and future native root handles should all point into an internal reconciler root. Public root objects can own warnings, option parsing, DOM validation, marker installation, and JS callback rooting, but they should not own lanes, scheduled callback handles, pending commit state, or HostRoot current fibers.

This is why the first slice belongs in `crates/fast-react-reconciler`, not `packages/react-dom`, `crates/fast-react-core`, or `bindings/node`.

### HostRoot Is A Fiber With Root Back-Reference

The HostRoot fiber should be the current tree entry point. It needs normal fiber topology and render fields: tag, mode, parent/child/sibling links, alternate, lanes, child lanes, flags, subtree flags, deletions, memoized state, and an update queue slot. It should point back to the owning `FiberRootId` through `state_node` or a typed root back-reference.

Root-wide scheduling, lifecycle, options, callback handles, and host container ownership belong on `FiberRoot`, not on every fiber.

### Alternate Wiring Comes Before Queue Semantics

Current/work-in-progress alternates are a precondition for skipped update rebasing, interrupted render, aborted work, and `root.current` switch timing. The first slice should create the initial current HostRoot and add an explicit HostRoot work-in-progress helper, while still leaving `root.current` unchanged until a future commit slice.

### Callback Handles Are Not Scheduler Handles

Root error callbacks and root scheduler callbacks have different lifetimes and invocation rules. The model should keep user callback handles (`on_uncaught_error`, `on_caught_error`, `on_recoverable_error`) separate from scheduler handles (`callback_node`, `timeout_handle`, `cancel_pending_commit`). Rust should store typed opaque handles, not raw JS values or background-callable closures.

### Placeholder Render APIs Should Shrink, Not Grow

`render_mutation_placeholder` and `render_placeholder` are scaffold compatibility APIs. The migration path should add real internal root APIs (`create_container` or `FiberRoot::new`) and move new callers to those. Do not add behavior to `render_mutation_placeholder` beyond boundary validation or loud errors.

## First Implementation Slice

Recommended future write scope:

- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/root.rs`
- `crates/fast-react-reconciler/src/host_root.rs`
- `crates/fast-react-reconciler/src/work_in_progress.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- future implementation worker progress file

`host_root.rs` may be folded into `root.rs` if the first implementation stays small, but the plan should still name `HostRootState` explicitly so future queue/hydration/cache fields have a stable home.

Do not change in this slice:

- `packages/react-dom/**`
- `bindings/node/**`
- `crates/fast-react-napi/**`
- `crates/fast-react-test-renderer/**`
- `crates/fast-react-core/**`, unless a separately assigned core root-lane worker has already merged and only imports are needed

### Module Ownership

`fiber.rs` should own:

- `FiberId`
- `FiberTag`, with at least `HostRoot`
- `FiberMode`
- `FiberFlags`/empty flag shell if core flag work has not merged
- `Fiber`
- generic topology fields
- root back-reference field
- `create_host_root_fiber`

`root.rs` should own:

- `FiberRootId`
- `FiberRoot<H: HostTypes>`
- `RootTag`
- `RootKind`
- `RootOptions`
- `RootLifecycleState`
- `RootWorkStatus`
- `RootSchedulingState`
- `RootLaneStateShell` if core root lane bookkeeping has not merged
- `RootCallbackHandle` and scheduler callback handle placeholder types
- `create_container` or `FiberRoot::new`

`host_root.rs` should own:

- `HostRootState`
- inert handles for `element`, hydration state, cache/form placeholders, and pending suspense boundaries
- empty HostRoot update queue handle type or imported queue handle when worker 080 or equivalent merges

`work_in_progress.rs` should own:

- `create_work_in_progress`
- `ensure_host_root_alternate`
- field-copy/reset rules for the first HostRoot-only alternate path

`test_support.rs` should own only `#[cfg(test)]` fake-host fixtures:

- `MinimalMutationHost`
- `FakeContainer`
- `FakeHostFiberToken`
- operation log helpers proving root construction performs no host lifecycle calls

`lib.rs` should:

- export the new root/fiber model types needed by sibling modules and tests
- preserve `ReconcilerError`, `validate_mutation_renderer_boundary`, `render_mutation_placeholder`, and legacy `render_placeholder` until all scaffold callers migrate
- avoid exporting a public render-compatibility claim

## Root Records

Minimum `FiberRoot` state for this first slice:

- `id: FiberRootId`
- `tag: RootTag`
- `kind: RootKind`
- `container_info: H::Container`
- `current: FiberId`
- `options: RootOptions`
- `lifecycle: RootLifecycleState`
- `work_status: RootWorkStatus`
- `context: RootContextHandle`
- `pending_context: Option<RootContextHandle>`
- `pending_children: PendingChildrenHandle`
- `lanes: RootLaneStateShell`
- `scheduling: RootSchedulingState<H>`
- `finished_work: Option<FiberId>`
- `finished_lanes: Lanes`
- `pending_commit: Option<PendingCommitHandle>`
- `pending_passive: PendingPassiveState`

Supported initial root shape:

- `RootTag::Concurrent`
- `RootKind::Client`

Reserved but inert:

- `RootKind::Hydration`
- hydration callback handles
- form state handle
- cache handle
- transition/default indicator handles

The first slice should not add a legacy public root mode. If a `RootTag::Legacy` variant is included for internal shape parity, tests should assert it is not used by the default client constructor.

### Root Lane State Shell

If core root lane bookkeeping is not merged yet, keep the first shell mechanical:

- `pending_lanes: Lanes`
- `suspended_lanes: Lanes`
- `pinged_lanes: Lanes`
- `warm_lanes: Lanes`
- `expired_lanes: Lanes`
- `error_recovery_disabled_lanes: Lanes`
- `entangled_lanes: Lanes`
- `expiration_times: LaneMap<Option<RootExpirationTime>>`
- `entanglements: LaneMap<Lanes>`
- `hidden_updates: LaneMap<HiddenUpdateSetHandle>`

All fields initialize to no work. The shell should not implement `get_next_lanes`, transition claiming, retry claiming, expiration, or entanglement algorithms in this slice.

### Root Scheduling State

Add typed placeholders only:

- `next_scheduled_root: Option<FiberRootId>`
- `callback_node: Option<RootSchedulerCallbackHandle>`
- `callback_priority: RootCallbackPriority`
- `timeout_handle: Option<H::TimeoutHandle>`
- `cancel_pending_commit: Option<PendingCommitCancelHandle>`
- `work_in_progress: Option<FiberId>`
- `work_in_progress_root_render_lanes: Lanes`
- `render_exit_status: RootRenderExitStatus`
- `pending_passive_lanes: Lanes`
- `pending_passive_root: Option<FiberRootId>`

This state should not call `HostScheduling`, public Scheduler, act queues, microtasks, timers, or continuation callbacks.

## Root Options And Callback Handles

`RootOptions` should be structured, with defaults:

- `is_strict_mode: bool`, default `false`
- `identifier_prefix: String`, default `""`
- `on_uncaught_error: RootErrorCallbackHandle`, default handle
- `on_caught_error: RootErrorCallbackHandle`, default handle
- `on_recoverable_error: RootRecoverableErrorCallbackHandle`, default handle
- `hydration_callbacks: HydrationCallbackHandle`, inert
- `transition_callbacks: FeatureGatedCallbackHandle`, inert
- `default_transition_indicator: FeatureGatedCallbackHandle`, inert
- `form_state: FormStateHandle`, inert

Callback policies:

- User callback handles are root-owned and disposed when the root is disposed.
- The handle types should be opaque newtypes with no JS callback invocation.
- The first slice may use sentinel/default handles and tests should prove they are stored and distinct from scheduler callback handles.
- Do not store raw `napi_value`, JS functions, DOM containers, or Rust `Box<dyn Fn>` user callbacks on `FiberRoot`.

## Lifecycle And Work Status

Add root lifecycle as a separate enum:

- `RootLifecycleState::Created`
- `RootLifecycleState::Active`
- `RootLifecycleState::UnmountScheduled`
- `RootLifecycleState::Unmounted`
- `RootLifecycleState::Disposed`

Add root work status separately:

- `RootWorkStatus::Idle`
- `RootWorkStatus::Scheduled`
- `RootWorkStatus::Rendering`
- `RootWorkStatus::Committing`
- `RootWorkStatus::FlushingPassive`

Initial root creation should end in `Created` or `Active` according to the constructor naming. The report recommendation is:

- `FiberRoot::new` returns `Created`
- `create_container` returns `Active`

If the first implementation exposes only one constructor, choose `Active` for roots that can later accept HostRoot updates, and document that no update API exists yet.

Do not conflate lifecycle with scheduler state. An active root can be idle; an unmount-scheduled root can still need sync work; a disposed root must reject handle access and callback disposal should already have happened.

## HostRoot Fiber Initialization

Root creation should allocate:

- one stable `FiberRootId`
- one current `FiberId` tagged `FiberTag::HostRoot`
- root table/arena entry storing `container_info`
- HostRoot `state_node` or back-reference to `FiberRootId`

Initial HostRoot fiber fields:

- `tag = FiberTag::HostRoot`
- `return = None`
- `child = None`
- `sibling = None`
- `index = 0`
- `alternate = None`
- `key = None`
- element/type handles empty
- `state_node = FiberStateNode::HostRoot(root_id)` or equivalent
- `pending_props = EmptyPropsHandle`
- `memoized_props = EmptyPropsHandle`
- `memoized_state = HostRootState { element: None, is_dehydrated: false, cache: inert, pending_suspense_boundaries: empty, form_state: inert }`
- `update_queue = HostRootUpdateQueueHandle::empty()` or reserved empty handle
- `dependencies = None`
- `mode` derived from `RootTag::Concurrent` and `RootOptions::is_strict_mode`
- `lanes = Lanes::NO`
- `child_lanes = Lanes::NO`
- `flags = empty`
- `subtree_flags = empty`
- `deletions = empty`
- ref-related fields empty
- host token slot empty until host instance/text fibers exist

Root creation must not:

- call `root_host_context`
- call `create_instance` or `create_text_instance`
- call `prepare_for_commit` or `reset_after_commit`
- mutate the host container
- install DOM listeners
- create DOM markers or node maps
- allocate public React DOM root objects
- enqueue HostRoot updates
- schedule microtasks, timeouts, or Scheduler callbacks

## Current And Alternate Wiring

Initial state:

- `root.current` points at the current HostRoot fiber.
- The current HostRoot may have `alternate = None`.

First alternate helper:

- `ensure_host_root_alternate(root_id)` or `create_work_in_progress(current, pending_props)`
- Allocates a distinct `FiberId` for the alternate on first call.
- Reuses the same alternate on later calls when one exists.
- Links `current.alternate = Some(wip)` and `wip.alternate = Some(current)`.
- Copies stable fields: tag, key, state node/root back-reference, type handles, mode, child topology as appropriate for the future render path, memoized props/state, update queue handle, lanes, child lanes.
- Resets render/commit fields: flags, subtree flags, deletions, effect placeholders, render-only scratch state.
- Applies new pending props.
- Preserves the shared HostRoot update queue handle, because current and WIP views must see the same queue structure until queue processing clones base updates.
- Leaves `root.current` unchanged.

Completion tests must prove an aborted WIP creation does not switch current. `root.current` switching belongs only to the commit slice after mutation and host reset and before layout, as worker 082 requires.

## Fake-Host Test Plan

Use in-crate fake hosts in `crates/fast-react-reconciler/src/test_support.rs` or module-local `#[cfg(test)]` blocks. Do not use DOM. Do not depend on `fast-react-test-renderer` until its token-aware signatures are migrated in a separate worker.

Fake host types:

- `FakeContainer`, opaque and not a DOM node
- `FakeInstance`
- `FakeTextInstance`
- `FakePublicInstance`
- `FakeHostContext`
- `FakeCommitState`
- `FakeHostFiberToken`
- `FakeTimeoutHandle`
- `FakeEventPriority`

`MinimalMutationHost` should implement:

- `HostTypes`, including `type HostFiberToken = FakeHostFiberToken`
- `HostIdentityAndContext`
- `HostCreation`
- `HostCommit`
- `MutationHost`

The fake host should record every host lifecycle method in an operation log. Root creation tests should assert the log remains empty except for explicit capability validation tests. This catches accidental host context, creation, commit, mutation, or cleanup calls during data-model construction.

Exact future test names/classes:

- `crates/fast-react-reconciler/src/root.rs`
  - `creates_concurrent_client_fiber_root`
  - `stores_opaque_host_container_without_clone_requirement`
  - `initializes_root_options_and_callback_handles`
  - `initializes_root_lifecycle_and_work_status`
  - `initializes_empty_root_lane_state`
  - `initializes_empty_scheduler_callback_handles`
  - `root_creation_does_not_call_host_lifecycle_methods`
  - `mutation_boundary_validation_remains_separate_from_root_record_creation`

- `crates/fast-react-reconciler/src/fiber.rs`
  - `creates_host_root_current_fiber`
  - `host_root_fiber_points_back_to_root`
  - `host_root_fiber_starts_with_empty_topology`
  - `host_root_fiber_starts_with_empty_lanes_flags_and_deletions`
  - `host_root_state_starts_with_no_element_and_not_dehydrated`
  - `host_root_update_queue_slot_is_reserved_but_unprocessed`

- `crates/fast-react-reconciler/src/work_in_progress.rs`
  - `initial_host_root_current_has_no_alternate`
  - `creates_distinct_host_root_work_in_progress`
  - `links_current_and_work_in_progress_reciprocally`
  - `reuses_existing_host_root_alternate`
  - `work_in_progress_preserves_update_queue_handle`
  - `work_in_progress_resets_flags_and_deletions`
  - `aborted_work_in_progress_leaves_root_current_unchanged`

- `crates/fast-react-reconciler/src/test_support.rs`
  - `minimal_mutation_host_uses_token_aware_creation_signatures`
  - `minimal_mutation_host_uses_token_aware_commit_signatures`
  - `fake_host_operation_log_catches_unexpected_root_creation_calls`

Required commands for the implementation worker:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check -- crates/fast-react-reconciler worker-progress/<future-worker>.md`

No JS conformance test should be added for this first slice because it claims no public React DOM or JS package behavior.

## Migration Path Away From Placeholder Render APIs

Step 1: Add root model APIs without removing placeholders.

- Add `FiberRoot::new` or `create_container` as internal APIs.
- Keep `render_mutation_placeholder` returning `ReconcilerError::Unimplemented`.
- Keep legacy `render_placeholder` for scaffold dependents until all callers migrate.
- Update only reconciler tests to use new root model APIs.

Step 2: Move future internal root callers to `create_container`.

- Test-renderer root API workers should create a real reconciler root and enqueue HostRoot updates after queue/scheduler slices land.
- React DOM facade workers should call a private bridge that creates a reconciler root after DOM validation and before DOM marker/listener setup.
- Native boundary workers should expose private root-handle creation only after the root model exists.

Step 3: Deprecate placeholder render names.

- Add doc comments marking `render_mutation_placeholder` as scaffold-only.
- Add tests proving it still validates mutation capability and still returns the unimplemented error.
- Do not add child/element parameters to the placeholder APIs.

Step 4: Remove legacy placeholder only after dependents migrate.

- Remove or hide `render_placeholder` after `fast-react-test-renderer` and any smoke tests no longer call it.
- Keep host-boundary validation as a reusable helper for real root host bounds if still useful.

Step 5: Introduce real render/update APIs separately.

- Add `update_container` only in the HostRoot update queue worker.
- Add root scheduling only in the scheduler worker.
- Add work loop/commit behavior only after queues, flags, and root scheduling are present.

Breaking changes are acceptable here. If existing scaffold tests or callers expect `render_placeholder` to be the only reconciler entry point, change them to explicit root-model constructors or leave them on loud placeholders. Do not fake render behavior to preserve a scaffold API.

## Explicitly Deferred Work

Defer to later workers:

- HostRoot update queue algorithms: circular pending queue, base queue rebasing, `{element}` payload processing, callback queue draining, and transition entanglement.
- `update_container` and `update_container_sync`.
- Root scheduler: scheduled-root list, microtask scheduling, public Scheduler bridge, callback reuse/cancellation, continuation callbacks, cross-root `flush_sync_work`, and act queue routing.
- Render work loop: begin/complete work, yielding, interruption, render status, and unsupported component tags.
- Commit phases: before-mutation, mutation, host reset, `root.current` switch, layout, passive scheduling, and deletion cleanup.
- DOM public root facade: `createRoot`, `hydrateRoot`, public `Root` object, warnings, invalid container errors, `_internalRoot`, listener installation, markers, and node maps.
- DOM mutation and host config implementation.
- Hydration: dehydrated HostRoot state beyond inert placeholders, Fizz markers, hydratable cursors, event replay, explicit hydration targets, `unstable_scheduleHydration`.
- Hooks, function components, context propagation, refs lifecycle, effects, Suspense, cache, forms, resources, singletons, view transitions, and profiling.
- Public `scheduler` package APIs and `scheduler/unstable_mock`.
- Native public/private root handles, callback rooting tables, and N-API exports.

## Completion Gates For The First Slice

The future implementation worker can claim the root data model exists only when all of these gates pass:

1. `FiberRoot` can be constructed for a concurrent client root with an opaque host container and no DOM-specific type.
2. A current HostRoot fiber is allocated, tagged, points back to the root, and is stored as `root.current`.
3. HostRoot state starts with no element, not dehydrated, inert cache/form/suspense placeholders, and an empty or reserved update queue handle.
4. Root options store strict mode, identifier prefix, and typed error callback handles without storing raw JS values.
5. Root lifecycle and work status fields initialize deterministically.
6. Root lane and scheduler placeholder fields initialize to no work and no callback handles.
7. Initial current HostRoot has no alternate, and the WIP helper creates a distinct reciprocally linked alternate.
8. WIP creation preserves shared queue handles, resets render/effect fields, and leaves `root.current` unchanged.
9. Fake hosts compile against token-aware `HostTypes`, `HostCreation`, and `HostCommit` signatures.
10. Root construction does not call host context, creation, commit, mutation, scheduling, DOM, or hydration hooks.
11. Placeholder render APIs remain loud and do not claim render compatibility.
12. `cargo fmt`, reconciler tests, reconciler clippy, and scoped diff checks pass.

Do not claim any of these:

- `root.render` compatibility
- `createRoot` compatibility
- DOM mutation compatibility
- hydration compatibility
- Scheduler package compatibility
- hooks/effects compatibility
- unmount or `flushSync` compatibility

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan keeps the first slice narrow and testable. It proves root identity and HostRoot wiring without pretending to render.
- Worker 080 is not used as evidence because it is absent in this worktree.
- The plan uses fake hosts to catch accidental side effects during root construction.

Maintainability:

- Root-owned state is separated from fiber-owned state, public DOM facade state, DOM adapter maps, and native binding handles.
- The placeholder migration is explicit, so scaffold APIs do not become hidden compatibility traps.
- New modules are named around stable responsibilities rather than temporary tests.

Performance:

- The plan keeps lane state as compact `Lanes`/`LaneMap<T>` fields and does not add dynamic scheduling allocations to root creation.
- It avoids clone bounds on host containers unless a fake host chooses copyable handles in tests.
- It keeps public/native callbacks out of root construction, avoiding accidental cross-thread or heap-heavy callback storage.

Security:

- The root record stores opaque host containers and opaque callback handles only.
- No DOM nodes, JS functions, raw `napi_value`s, or public native handles are exposed.
- Callback disposal is modeled before callback invocation exists.
- DOM string mutation, hydration parsing, and event dispatch are out of scope.

## Risks Or Blockers

- Worker 080 is absent, so HostRoot queue behavior is unresolved. The first slice must reserve a queue handle without processing it.
- Core root lane bookkeeping may not be merged in this worktree. Use a reconciler-local shell or consume the merged core type if available at implementation time.
- Local `fast-react-test-renderer` appears not fully migrated to token-aware signatures. Root-model tests should use in-crate fake hosts until that migration lands.
- Current placeholders may still be referenced by scaffold crates. Removing `render_placeholder` too early would break unrelated work; growing it into a render path would be worse.
- Commit ordering depends on flags/deletions/effect metadata outside this slice. The WIP helper should reset available fields but not invent full commit metadata.

## Recommended Next Tasks

1. Implement `crates/fast-react-reconciler/src/root.rs`, `fiber.rs`, `host_root.rs`, `work_in_progress.rs`, and token-aware fake-host tests as the first root data-model slice.
2. Implement or consume core root lane bookkeeping before adding `get_next_lanes` or root scheduling.
3. Implement HostRoot update queues and `update_container` only after root IDs, HostRoot fibers, and alternate queue-sharing tests are green.
4. Add a root scheduler worker with cross-root sync flush and act routing after queues exist.
5. Migrate `fast-react-test-renderer` to token-aware host signatures before using it as the end-to-end root canary.
6. Keep React DOM facade and native root handles blocked until the internal root path can enqueue, schedule, render, and commit through shared reconciler semantics.

## Commands Run

Tool actions:

- `create_goal` for this worker objective.
- `get_goal` after goal setup.
- Spawned three read-only explorer subagents.
- Waited for the source-topology explorer.
- `apply_patch` to create and update this report.

Shell commands:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files worker-progress | rg 'worker-(019|044|055|072|079|080|081|082|090|094|096|104)-'
rg --files crates/fast-react-reconciler crates/fast-react-core crates/fast-react-host-config crates/fast-react-test-renderer
git status --short
sed -n '1,260p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '1,260p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,260p' worker-progress/worker-019-reconciler-host-boundary-migration.md
sed -n '261,560p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '261,620p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,320p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,280p' crates/fast-react-host-config/src/lib.rs
sed -n '1,240p' crates/fast-react-core/src/lib.rs
sed -n '1,240p' crates/fast-react-core/src/lane.rs
sed -n '260,560p' crates/fast-react-reconciler/src/lib.rs
rg -n "HostFiberToken|HostScheduling|trait HostTypes|trait MutationRenderer|type HostFiberToken|struct HostChild|HostFiberTokenRef" crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-test-renderer/src/lib.rs
sed -n '840,1145p' crates/fast-react-host-config/src/lib.rs
sed -n '1130,1455p' crates/fast-react-host-config/src/lib.rs
rg -n "impl HostTypes|type HostFiberToken|fn create_instance|fn commit_mount|HostFiberTokenRef" crates/fast-react-test-renderer/src/lib.rs
sed -n '560,830p' crates/fast-react-test-renderer/src/lib.rs
sed -n '1,320p' worker-progress/worker-082-reconciler-commit-ordering-plan.md
sed -n '1,300p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,320p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,320p' worker-progress/worker-090-dom-node-map-public-instance-plan.md
sed -n '1,320p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '1,320p' worker-progress/worker-096-native-root-boundary-plan.md
sed -n '1,260p' worker-progress/worker-104-reconciler-root-model-implementation-plan.md
sed -n '261,620p' worker-progress/worker-104-reconciler-root-model-implementation-plan.md
sed -n '500,760p' worker-progress/worker-104-reconciler-root-model-implementation-plan.md
git diff --check -- worker-progress/worker-104-reconciler-root-model-implementation-plan.md
git status --short --untracked-files=all
rg -n '^(## (Root Records|HostRoot Fiber Initialization|Current And Alternate Wiring|Root Options And Callback Handles|Lifecycle And Work Status|Fake-Host Test Plan|Migration Path Away From Placeholder Render APIs|Completion Gates For The First Slice|Completion Audit|Changed Files))' worker-progress/worker-104-reconciler-root-model-implementation-plan.md
rg -n 'worker-progress/worker-(019|044|055|072|079|080|081|082|090|094|096)' worker-progress/worker-104-reconciler-root-model-implementation-plan.md
git diff -- worker-progress/worker-104-reconciler-root-model-implementation-plan.md | sed -n '1,260p'
git diff --stat
rg -n '[ \t]+$|<{7}|={7}|>{7}' worker-progress/worker-104-reconciler-root-model-implementation-plan.md
wc -l worker-progress/worker-104-reconciler-root-model-implementation-plan.md
```

No source tests were run because this worker is report-only and changes no source code.

## Completion Audit

Objective restated as concrete deliverables:

- Produce one report-only implementation plan in `worker-progress/worker-104-reconciler-root-model-implementation-plan.md`.
- The plan must cover root records, HostRoot fiber initialization, current/alternate wiring, root lifecycle fields, callback handles, fake-host tests, and migration away from placeholder render APIs.
- The plan must be anchored in merged root/reconciler reports, especially workers 019, 044, 055, 072, 079, 081, 082, 090, 094, and 096.
- Worker 080 must be treated as absent/provisional unless its report exists locally.
- The first implementation slice must stay independent from React DOM public root objects, DOM mutation, hydration, hooks, and public Scheduler package APIs.
- The report must specify exact future source files, exact test classes/tests, and completion gates that prove the data model exists without claiming render compatibility.
- The report must summarize delegated checks, commands run, changed files, risks, follow-up tasks, and quality/maintainability/performance/security review.

Prompt-to-artifact checklist:

| Requirement | Evidence in this report | Current-state verification |
| --- | --- | --- |
| Use goal tools and record active status/objective | `Goal Setup` section | `create_goal` and `get_goal` returned active objective before research. |
| Read worker brief and master files first | `Progress Log`, `Evidence Gathered`, `Commands Run` | `sed` commands are listed for all three files. |
| Do not read `ORCHESTRATOR.md` | `Evidence Gathered` states this explicitly | No command listed for `ORCHESTRATOR.md`. |
| Write only scoped report | `Changed Files` section | `git status --short --untracked-files=all` showed only `?? worker-progress/worker-104-reconciler-root-model-implementation-plan.md`. |
| Report-only, no source implementation | `Summary`, `Commands Run`, `Changed Files` | No source files changed in `git status`; no source tests were needed or run. |
| Anchor in workers 019, 044, 055, 072, 079, 081, 082, 090, 094, 096 | `Evidence Gathered` lists every named report and report-specific conclusions are used throughout | `rg --files` confirmed those reports exist locally; `sed` reads are listed. |
| Treat worker 080 as provisional | `Worker 080 status`, `Risks Or Blockers` | `rg --files worker-progress ... worker-080` did not find a report; master files list it as running. |
| Keep slice independent from React DOM public roots, DOM mutation, hydration, hooks, Scheduler package APIs | `Summary`, `Explicitly Deferred Work`, `Completion Gates` "Do not claim" list | The future write scope excludes `packages/react-dom/**`, native bindings, test renderer, and Scheduler package files. |
| Specify exact source files expected to change later | `First Implementation Slice`, `Module Ownership` | Exact paths are listed: `fiber.rs`, `root.rs`, `host_root.rs`, `work_in_progress.rs`, `test_support.rs`, `lib.rs`. |
| Plan root records | `Root Records` | Field list covers IDs, tag/kind, container, current, options, lifecycle, context, lanes, scheduling, pending commit/passive state. |
| Plan HostRoot fiber initialization | `HostRoot Fiber Initialization` | Initial field values and "must not call" side-effect list are explicit. |
| Plan current/alternate wiring | `Current And Alternate Wiring` | Initial no-alternate state, WIP creation, reciprocal links, queue sharing, flag reset, current preservation are listed. |
| Plan lifecycle fields | `Lifecycle And Work Status` | Separate lifecycle and work status enums are listed. |
| Plan callback handles | `Root Options And Callback Handles` | Error callback handles, feature-gated inert handles, disposal/no-raw-JS policy are listed. |
| Plan fake-host tests | `Fake-Host Test Plan` | Fake types, token-aware traits, operation log policy, and exact tests are listed. |
| Plan migration away from placeholder render APIs | `Migration Path Away From Placeholder Render APIs` | Five-step migration path preserves loud placeholders and blocks fake render behavior. |
| Specify exact test classes/tests | `Fake-Host Test Plan` | Exact `#[cfg(test)]` module locations and test function names are listed. |
| Specify completion gates | `Completion Gates For The First Slice` | Twelve gates state what must be true before claiming the data model exists. |
| Summarize delegated checks | `Evidence Gathered` delegated checks bullets | Three subagent results are summarized with their conclusions. |
| Include quality/maintainability/performance/security review | `Quality, Maintainability, Performance, And Security Review` | Each required review category has concrete notes. |
| Include unresolved risks/follow-ups | `Risks Or Blockers`, `Recommended Next Tasks` | Risks and six follow-up tasks are listed. |
| Include commands run | `Commands Run` | Tool actions and shell commands are listed. |

Audit result:

- Achieved. The report covers every requested planning area and keeps evidence labels aligned with the current worktree.
- No source tests were run because the artifact is report-only. The relevant verification for this worker is scoped file/status inspection and diff hygiene.
- `git status --short --untracked-files=all` showed only this report as changed.
- `git diff --check -- worker-progress/worker-104-reconciler-root-model-implementation-plan.md` produced no output.
- The scoped whitespace/conflict-marker `rg` check produced no matches.
- Remaining implementation risks are intentionally listed as future work, not unresolved requirements for this report.

## Changed Files

- `worker-progress/worker-104-reconciler-root-model-implementation-plan.md`
