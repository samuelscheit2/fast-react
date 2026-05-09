# worker-079-reconciler-fiber-root-model-plan

## Objective

Produce a report-only implementation plan for reconciler FiberRoot and HostRoot
records.

Write scope honored: this worker should change only
`worker-progress/worker-079-reconciler-fiber-root-model-plan.md`. No source code
is implemented by this report.

## Goal Tool State

- `create_goal` was called before research for the exact objective:
  "Produce a report-only implementation plan for reconciler FiberRoot and
  HostRoot records."
- `get_goal` was available immediately after goal setup and returned status
  `active` with the same objective.

## Summary

Fast React should introduce FiberRoot and HostRoot records as the first real
reconciler root model, not as a public React DOM facade and not as a direct
mutation renderer shortcut. The root cause across the client-root, work-loop,
and test-renderer plans is that `root.render`, test-renderer `update`, and
future root integrations all enqueue HostRoot updates into a FiberRoot. The
root owns scheduling, lane bookkeeping, lifecycle state, root options, and
callback handles. Renderer adapters own opaque host containers and host
operations.

The first implementation slice should therefore add the data model only:
root tags, typed root/container handles, HostRoot fiber initialization, current
and work-in-progress alternate wiring, root options, root lifecycle state, and
callback handle placeholders. It should not implement `update_container`,
render work, commit traversal, React DOM container markers, public root objects,
hydration matching, or DOM mutation behavior.

Breaking changes are acceptable and likely needed. The merged host-config token
boundary already changed canonical trait signatures, while current reconciler
and test-renderer skeletons still show older method shapes locally. A future
implementation worker should migrate fake hosts and tests to token-aware
`MutationRenderer` signatures instead of adding compatibility shims that hide
the root identity problem.

## Evidence Gathered

Required reports read first:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-019-reconciler-host-boundary-migration.md`
- `worker-progress/worker-044-react-dom-client-roots-plan.md`
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`
- `worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `worker-progress/worker-073-test-renderer-update-model-plan.md`

Additional local evidence consulted:

- `crates/fast-react-reconciler/src/lib.rs` still contains only placeholder
  rendering and scheduling entry points. It has no FiberRoot, HostRoot fiber,
  root arena, root scheduling state, update queue, render loop, or commit
  state.
- `crates/fast-react-core/src/lane.rs` provides React 19.2.6 `Lane`, `Lanes`,
  `LaneIndex`, and fixed-width `LaneMap<T>` primitives. Root lane bookkeeping
  and root scheduling are still separate future work.
- `crates/fast-react-host-config/src/lib.rs` owns opaque host associated types,
  capability groups, `MutationRenderer`, `HostScheduling`, and token-aware
  host lifecycle signatures through `HostFiberTokenRef`.
- `crates/fast-react-test-renderer/src/lib.rs` is still a direct in-memory
  mutation host and snapshot tool. It is useful for fake-host tests, but it is
  not a reconciler root implementation.
- `worker-progress/worker-070-core-update-queue-plan.md` confirms HostRoot
  queues must use circular pending/base queue rebase semantics and should wait
  for stable fiber/root IDs.
- `worker-progress/worker-071-core-fiber-flags-effect-plan.md` confirms commit
  metadata depends on flags, subtree flags, deletions, and a `root.current`
  switch after mutation and before layout.
- `worker-progress/worker-051-dom-host-token-boundary.md` confirms future DOM
  maps need reconciler-issued opaque tokens, not raw fiber pointers or DOM
  state in core.

Nested subagents:

- Spawned one read-only explorer to challenge the source-level split between
  generic fiber data and reconciler-owned root scheduling state. It confirmed
  that HostRoot should be a normal fiber tag with generic topology/render
  fields, while FiberRoot should own root-wide lanes, scheduling handles,
  lifecycle, options, callbacks, pending commit/passive state, and the opaque
  host container.
- Spawned one read-only explorer to challenge the fake-host/no-DOM test
  strategy. It confirmed that token-aware fake hosts are the right verifier and
  that the current `fast-react-test-renderer` should not be reused for this
  slice until it migrates to `HostFiberTokenRef` signatures.
- Both explorers recommended concrete corrections that are incorporated below:
  make the fake host's `HostFiberToken` associated type explicit, keep pure
  root-record construction generic over container ownership instead of forcing
  `MutationRenderer`, separate mutation-boundary validation into its own test
  path, and log every host lifecycle method so accidental host calls are
  visible.

Did not read `ORCHESTRATOR.md`.

## Root-Cause Conclusions

### A FiberRoot Is Not A Renderer Facade

React DOM and react-test-renderer both create a reconciler root and then drive
updates through `updateContainer`. Public root objects, DOM container markers,
and test-renderer serialization are renderer/package concerns. They should hold
or reference an internal root handle, but they should not own root scheduling
fields or mutate host storage directly.

### HostRoot Is The Root Fiber, Not The Root Scheduler

The HostRoot fiber is the current tree entry point. It needs normal fiber
topology and generic render fields: tag, mode, lanes, flags, child links,
alternate link, memoized state, and update queue handle. The FiberRoot wraps
that current HostRoot fiber and owns root-wide state such as pending lanes,
scheduler callbacks, root options, lifecycle status, pending commit state, and
error callback handles.

### Core Data And Reconciler State Need A Hard Split

Generic fiber data should remain renderer-agnostic and reusable across DOM,
test renderer, native, and future hosts. Root scheduling state should remain in
the reconciler because it combines lanes, update queues, work-loop status,
host scheduling hooks, and root lifecycle behavior.

Do not place FiberRoot scheduling fields inside the core fiber record just
because HostRoot is a fiber tag. That would make every fiber carry root-only
state or leak scheduler policy into data structures needed by non-root fibers.

### Current/Alternate Wiring Must Be Modeled Before Queues

HostRoot update queues, render interruption, skipped update rebasing, and
commit switching all depend on a current tree and an optional work-in-progress
alternate tree. A single mutable root tree would make aborted renders and
`root.current` timing incorrect. The root model slice should add reciprocal
alternate wiring and tests before HostRoot queue processing lands.

### Callback Handles Need Typed Lifetime Boundaries

React root state carries both scheduler callback handles and user callback
handles. Fast React should model them separately:

- scheduler handles: scheduled root callback, callback priority, timeout
  handle, pending commit cancellation handle, and scheduled-root list link
- user handles: `onUncaughtError`, `onCaughtError`, `onRecoverableError`, and
  future hydration/transition callback handles

Rust root records should not store raw JS values or background-callable
closures. JS/native bindings can later root and dispose those handles through a
private binding contract.

## Layer Ownership Plan

Core-owned or core-friendly generic fiber data:

- `FiberId`, `FiberRootId`, and arena index newtypes.
- Generic `FiberTag` values, including `HostRoot`, `HostComponent`,
  `HostText`, `FunctionComponent`, `ClassComponent`, `Fragment`, `Portal`,
  Suspense, Activity, Offscreen, and placeholders for tags not implemented yet.
- `FiberMode` bitsets for concurrent, strict legacy, strict effects, profile,
  suspense/hydration-related modes, and no-mode defaults.
- `FiberFlags`, `subtree_flags`, static flags, and phase masks from the core
  flag plan.
- Generic topology fields: `return`, `child`, `sibling`, `index`,
  `alternate`, and parent-owned deletions.
- Generic render fields: `key`, element/type handles, pending props,
  memoized props, memoized state handle, update queue handle, dependencies
  handle, lanes, child lanes, ref handle, and host state handle slots.
- No DOM types, no native tags, no JS callback rooting, no root scheduler
  callbacks, and no event names.

Reconciler-owned root state:

- `FiberRoot` table/arena and root IDs.
- Root tag and root kind.
- Opaque host container handle.
- Current HostRoot fiber pointer.
- Root lane bookkeeping state and root scheduling fields.
- Finished work, finished lanes, pending commit, passive-effect, and lifecycle
  status fields.
- Root context and pending context.
- Root options, identifier prefix, strict-mode flag, hydration-form state
  placeholders, and error callback handles.
- Host fiber token generation, versioning, and invalidation policy.
- Internal APIs such as `create_container`, `create_hydration_container`,
  `update_container`, `flush_sync_work`, and commit entry points.

Renderer/package-owned state:

- DOM container validation, duplicate-root warnings, root/listener markers,
  node maps, current props maps, delegated event listeners, public root object
  shape, `root.render`, `root.unmount`, and hydration event replay.
- Test-renderer public wrappers, `act` warnings, tree serialization,
  `TestInstance` querying, and deprecation warnings.
- Native/JS callback rooting and public JS value ownership.

## Root Tags And Root Kinds

Add an explicit `RootTag` newtype or enum in the reconciler root module:

- `RootTag::Legacy = 0`: keep only for internal compatibility shape and future
  non-client experiments. React DOM `createRoot` must not expose a legacy root.
- `RootTag::Concurrent = 1`: required for React DOM `createRoot`,
  `hydrateRoot`, and current react-test-renderer roots.

Do not add a separate "hydration root tag". Hydration should be a root kind or
root state flag layered on a concurrent root:

- `RootKind::Client`: normal `createRoot` or test-renderer root.
- `RootKind::Hydration`: concurrent root with dehydrated HostRoot state,
  hydration callbacks/form state, hydratable cursor hooks, and initial
  hydration scheduling.
- `RootKind::Test`: optional renderer-facing classification only if it helps
  diagnostics. It should not change scheduling semantics.

The first implementation should support `RootTag::Concurrent` and
`RootKind::Client`. It should reserve hydration fields as typed placeholders
but return loud unimplemented errors for hydration behavior.

## Container Handles

`FiberRoot` should store the renderer's opaque container handle as
`H::Container` or an equivalent typed handle in a root table parameterized by
the host type. The pure root-record constructor should require only the host
type information and container ownership it needs to store the handle; it
should not require `MutationRenderer` unless the API under test is explicitly
validating a mutation-root boundary. The root model must not require DOM node
types, JS object pointers, or renderer-global lookup keys.

Recommended shape:

```rust
pub struct FiberRoot<H: HostTypes> {
    id: FiberRootId,
    tag: RootTag,
    kind: RootKind,
    container_info: H::Container,
    current: FiberId,
    options: RootOptions,
    lifecycle: RootLifecycleState,
    scheduling: RootSchedulingState<H>,
    lanes: RootLaneState,
    context: RootContextHandle,
    pending_context: Option<RootContextHandle>,
    pending_children: PendingChildrenHandle,
}
```

Implementation notes:

- Accept an owned opaque container handle at root creation. Do not add `Clone`
  bounds to `H::Container` unless a later host requires proof that cloning is
  safe.
- Expose read-only and commit-phase mutable accessors so host operations can
  receive `&H::Container` or `&mut H::Container` when required.
- DOM root markers should store the HostRoot token/root ID in DOM-owned maps,
  not in the reconciler container type.
- Test hosts can use small copyable container handles, but the generic model
  must not assume that real DOM/native containers are copyable.

## HostRoot Fiber Initialization

Root creation should allocate a HostRoot current fiber before any public
container marker or listener side effect is reported as complete.

Minimum initialization:

- Allocate a `FiberRootId`.
- Allocate a current `FiberId` with `FiberTag::HostRoot`.
- Set `state_node` or equivalent root back-reference on the HostRoot fiber to
  the `FiberRootId`.
- Set `return`, `child`, and `sibling` to `None`; set `index = 0`.
- Set `key`, element type, host type, ref, and dependencies to empty handles.
- Set `pending_props` and `memoized_props` to empty/null handles.
- Set `memoized_state` to `HostRootState { element: None, is_dehydrated:
  false, cache: placeholder, pending_suspense_boundaries: empty }`.
- Initialize an empty HostRoot update queue handle, but leave queue processing
  to worker 080 or an equivalent update-queue implementation.
- Set `lanes` and `child_lanes` to `Lanes::NO`.
- Set `flags`, `subtree_flags`, static flags, and deletions to empty.
- Derive fiber mode from the root tag and options:
  - concurrent roots get concurrent mode;
  - strict mode options add strict legacy/effects mode according to the future
    core `FiberMode` policy;
  - hydration mode is reserved for `RootKind::Hydration`.
- Do not create host instances, text instances, DOM listeners, or public root
  objects in this constructor.

Current/alternate initialization:

- At root creation, the current HostRoot fiber may have no alternate, matching
  React's initial root shape.
- Add `create_work_in_progress(current, pending_props)` or
  `ensure_host_root_alternate(root)` in the same slice if tests need to prove
  reciprocal alternate wiring.
- The first work-in-progress HostRoot should copy stable fields from current,
  reset effect flags, preserve the shared update queue handle, set
  `alternate` both ways, and keep `root.current` pointing at the old current
  until the commit slice switches it.
- Tests should prove current and alternate are distinct IDs and that aborting
  a work-in-progress root leaves `root.current` unchanged.

## FiberRoot Scheduling State

The root record should group scheduling state instead of scattering it across
generic fiber fields.

Required fields or reserved handles:

- `next_scheduled_root: Option<FiberRootId>` for root linked-list scheduling.
- `callback_node: Option<RootCallbackHandle>`.
- `callback_priority: RootCallbackPriority` or the React-compatible lane used
  as callback priority.
- `timeout_handle: Option<H::TimeoutHandle>` with `no_timeout` handled by host
  scheduling code.
- `cancel_pending_commit: Option<PendingCommitCancelHandle>`.
- `pending_lanes`, `suspended_lanes`, `pinged_lanes`, `warm_lanes`,
  `expired_lanes`, `error_recovery_disabled_lanes`, and `entangled_lanes`.
- Fixed `LaneMap` storage for expiration times, entanglements, and hidden
  updates, preferably through the future `RootLaneState` from core root-lane
  bookkeeping.
- `finished_work: Option<FiberId>`, `finished_lanes`, `work_in_progress:
  Option<FiberId>`, `work_in_progress_root_render_lanes`, and root render exit
  status placeholders.
- Passive-effect state placeholders: pending passive root, lanes, transitions,
  unmount/mount effect lists or handles.
- Root error and recoverability queues as handles, not concrete JS values.

This worker's future implementation slice should initialize these fields and
provide introspection/test helpers only. It should not implement lane
selection, Scheduler task transport, microtask flushing, `act`, or commit
execution.

## Root Options And Callback Handles

Use a structured `RootOptions` record instead of positional arguments copied
through public facades:

```rust
pub struct RootOptions {
    pub is_strict_mode: bool,
    pub identifier_prefix: String,
    pub on_uncaught_error: RootErrorCallbackHandle,
    pub on_caught_error: RootErrorCallbackHandle,
    pub on_recoverable_error: RootRecoverableErrorCallbackHandle,
    pub transition_callbacks: FeatureGatedCallbackHandle,
    pub default_transition_indicator: FeatureGatedCallbackHandle,
    pub hydration_callbacks: HydrationCallbackHandle,
    pub form_state: FormStateHandle,
}
```

Policy:

- `identifier_prefix` defaults to the empty string and is stored on
  `FiberRoot`, not on public DOM root objects.
- `onUncaughtError`, `onCaughtError`, and `onRecoverableError` default to
  typed default handles supplied by the binding/reconciler integration layer.
- Stable React DOM 19.2.6 does not expose active transition tracing or default
  transition indicator root options. Keep those handles feature-gated and
  inert until a conformance oracle proves published behavior.
- Callback handles must be root-owned and disposed when the root reaches a
  terminal lifecycle state.
- A callback handle is not a scheduler callback handle. Keep user callbacks
  and root scheduler callbacks in separate types so reentrancy and disposal
  rules cannot be confused.

## Lifecycle State

Add lifecycle state explicitly before public roots are implemented:

- `RootLifecycleState::Created`: internal root allocated, HostRoot current
  fiber exists, no render update has necessarily been committed.
- `RootLifecycleState::Active`: root can accept updates.
- `RootLifecycleState::UnmountScheduled`: public root has requested unmount;
  a sync null HostRoot update may still need to flush.
- `RootLifecycleState::Unmounted`: unmount commit finished; public facades
  must reject new updates.
- `RootLifecycleState::Disposed`: callback handles, host tokens, pending
  scheduler handles, and root table entries are invalid.

Add separate work status if useful:

- `RootWorkStatus::Idle`
- `RootWorkStatus::Scheduled`
- `RootWorkStatus::Rendering`
- `RootWorkStatus::Committing`
- `RootWorkStatus::FlushingPassive`

Keep lifecycle and work status separate. A root can be active while idle or
active while scheduled; unmount scheduling is a public lifecycle transition,
not just a work-loop phase.

## Host Fiber Tokens

The root model should define how reconciler-issued `H::HostFiberToken` values
are generated and attached to host fibers before commit slices need them.

Recommended rules:

- Generate tokens from stable `FiberId` plus a generation/version counter, or
  from a root-scoped token arena keyed by `FiberId`.
- Tokens must be renderer-opaque and should not expose raw fiber IDs unless a
  future diagnostics policy explicitly chooses to.
- Creation-phase tokens are used by `HostCreation::create_instance` and
  `create_text_instance`.
- Commit-phase tokens are used by `commit_mount` and `commit_update`.
- Deletion-phase tokens are used by `detach_deleted_instance`.
- Tokens are invalidated or generation-bumped after deletion/unmount so DOM
  node maps and test hosts can reject stale tokens.

The first root-record slice can define token storage and a fake token type for
tests. Full commit token generation can remain with the commit-ordering worker
if the root slice records the intended ownership.

## Implementation Slices

### 1. Reconciler root config and handles

Write scope:

- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker progress file for that implementation worker

Task:

- Add `RootTag`, `RootKind`, `RootOptions`, lifecycle/work status enums, user
  callback handle newtypes, scheduler callback handle placeholders, and
  opaque root/container handle policy.
- Provide defaults for concurrent client roots.
- Keep transition indicator, transition tracing, hydration callbacks, and form
  state feature-gated placeholders.

Verification:

- Unit tests for concurrent defaults, strict-mode option storage,
  identifier-prefix storage, callback handle defaults, feature-gated option
  inertness, and display/debug output that does not expose concrete local
  paths or JS object internals.

### 2. Fiber arena and HostRoot current fiber

Write scope:

- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker progress file for that implementation worker

Task:

- Add `FiberId`, `FiberRootId`, root arena/table storage, and an initial fiber
  record shape compatible with future core-owned topology/flag work.
- Implement `create_container` for `RootTag::Concurrent` and
  `RootKind::Client`.
- Initialize a HostRoot current fiber and empty HostRoot state.
- Store the opaque host container handle on FiberRoot.
- Leave HostRoot update queue processing unimplemented but allocate or reserve
  the queue handle.

Verification:

- Fake mutation host tests with no DOM.
- Tests for root ID stability, HostRoot tag/mode, container handle storage,
  HostRoot `state_node` back-reference, empty memoized state, empty lanes and
  flags, empty update queue handle, and no host mutations during root creation.

### 3. Current and alternate wiring

Write scope:

- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/work_in_progress.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker progress file for that implementation worker

Task:

- Add `create_work_in_progress` for HostRoot and generic fibers.
- Link current and alternate reciprocally.
- Copy stable fields, reset per-render flags, preserve update queue sharing,
  and leave `root.current` untouched until a future commit slice.

Verification:

- Tests for initial no-alternate state, reciprocal alternate creation,
  idempotent reuse of an existing alternate, queue handle sharing,
  flag reset, child lane preservation, and aborted work leaving current
  unchanged.

### 4. Root scheduling state shell

Write scope:

- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/root_scheduling_state.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker progress file for that implementation worker

Task:

- Add root scheduling fields and initialize them to no work.
- Integrate the future core `RootLaneState` when worker 047 or equivalent
  lands; until then, keep fields behind a small shell that can be replaced
  without changing public root construction.
- Add placeholders for callback node, callback priority, timeout handle,
  pending commit cancellation, finished work, and passive state.

Verification:

- Tests for no pending lanes after creation, callback handles absent, timeout
  absent, pending commit absent, finished work absent, root linked-list pointer
  absent, and lifecycle/work status transitions that do not schedule work.

### 5. Token-aware fake mutation host fixtures

Write scope:

- `crates/fast-react-reconciler/src/fiber_root.rs` tests or
  `crates/fast-react-reconciler/src/test_support.rs`
- worker progress file for that implementation worker

Task:

- Build in-crate fake hosts that implement token-aware `MutationRenderer`
  signatures.
- Keep host containers as simple opaque IDs or structs.
- Set `type HostFiberToken = FakeHostFiberToken` explicitly in fake
  `HostTypes` implementations.
- Record operation logs for every `HostIdentityAndContext`, `HostCreation`,
  `HostCommit`, and `MutationHost` lifecycle method, so root construction can
  prove it did not call host context, creation, finalization, commit, mutation,
  or cleanup APIs accidentally.

Verification:

- Tests compile against `HostFiberTokenRef`.
- Tests prove root construction validates mutation capability when requested
  but does not call `create_instance`, `append_child_to_container`,
  `root_host_context`, `finalize_initial_children`, `prepare_for_commit`,
  `reset_after_commit`, `clear_container`, or DOM-like APIs.
- Tests should avoid `fast-react-test-renderer` until it migrates to the
  token-aware host-config boundary.

## Test Strategy

Use Rust unit tests with fake mutation hosts and no DOM dependency.

Required test fixtures:

- `FakeMutationHost` implementing `HostTypes`, `HostIdentityAndContext`,
  `HostCreation`, `HostCommit`, and `MutationHost`.
- A small opaque `FakeContainer` handle that is not a DOM node and does not
  require cloning.
- A fake token associated type declared as
  `type HostFiberToken = FakeHostFiberToken`, with visible generation only
  inside tests.
- A host operation log covering every host identity/context, creation, commit,
  and mutation method. Pure root-record construction should not call any of
  those host methods. Mutation-boundary validation, if tested in the same
  implementation slice, should be a separate path with explicit expectations.

Required assertions:

- `create_container` creates a concurrent FiberRoot and a HostRoot current
  fiber.
- HostRoot current fiber has root back-reference, no parent/sibling/child,
  no lanes, no flags, no deletions, and default HostRoot memoized state.
- Root options store strict-mode, identifier-prefix, and typed error callback
  handles without calling them.
- Root scheduling state initializes to no pending work and no scheduled
  callback.
- Initial HostRoot alternate is absent or explicitly empty according to the
  chosen constructor policy.
- `create_work_in_progress` creates or reuses a reciprocal alternate and does
  not switch `root.current`.
- Fake host containers are stored opaquely and no DOM-specific marker/listener
  behavior exists in the reconciler.
- Token-aware fake hosts can validate creation/commit/deletion token phases
  once host creation tests are added.

Do not use DOM, jsdom, browser APIs, React DOM facade tests, public
test-renderer serialization, or direct host mutation snapshots for this slice.
Those belong to later DOM/test-renderer workers after the root model exists.

## Report-Only Verification Plan

Standard report checks for this worker:

- `git diff --check --no-index /dev/null worker-progress/worker-079-reconciler-fiber-root-model-plan.md`
- scoped local/temp path leak scan over this report
- `git status --short --untracked-files=all`

No source tests are expected for this report-only task. Cargo workspace checks
are also not useful evidence here because the current local source includes a
known token-boundary migration gap between `fast-react-host-config` and
dependent skeleton crates.

## Verification Results

- `git diff --check --no-index /dev/null worker-progress/worker-079-reconciler-fiber-root-model-plan.md`:
  printed no whitespace diagnostics. It returned the expected nonzero
  no-index status because the report is currently an untracked file compared
  against `/dev/null`.
- Scoped concrete local/temp path leak scan over this report: passed, no
  matches.
- Scoped trailing whitespace scan over this report: passed, no matches.
- `git status --short --untracked-files=all`: only the assigned untracked
  report and an untracked regenerable root `Cargo.lock` are present.

## Recommended Next Tasks

1. Implement the root config and handle slice first: `RootTag`, `RootKind`,
   `RootOptions`, lifecycle/work status, callback handle placeholders, and
   concurrent-root defaults.
2. Implement the FiberRoot/HostRoot arena slice with a pure root-record
   constructor that stores opaque containers without requiring DOM behavior or
   mutation host capability.
3. Add current/alternate wiring and token-aware fake-host tests before HostRoot
   update queues, root scheduling, or commit workers consume the model.
4. Keep worker 080, worker 081, and worker 082 aligned to this root model so
   queues, scheduling, and commit ordering do not duplicate root state.

## Risks And Blockers

- Worker 077 and worker 078 are active in separate worktrees, so this report
  does not assume merged core topology or hook-effect-ring output.
- Worker 080, worker 081, and worker 082 are active in separate worktrees, so
  HostRoot update queues, root scheduling/act, and commit ordering must consume
  the final root model rather than duplicate it.
- The host-config token boundary is merged locally, but current reconciler and
  test-renderer code still show older fake-host signatures. Future root tests
  should use fresh token-aware fake hosts.
- If FiberRoot stores raw JS callback values before the native/JS rooting
  policy exists, root unmount/disposal can leak callbacks or call invalid
  values after unmount.
- If root scheduling fields are placed in generic fiber records, later
  non-root fibers and custom renderers will carry root-only policy and become
  harder to test independently.
- If `root.current` can be switched outside commit, layout/ref/test-instance
  behavior will observe the wrong tree.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan models the root cause directly: roots enqueue work into HostRoot
  fibers and schedule by lanes. It rejects direct host mutation from public
  roots or test-renderer wrappers.

Maintainability:

- Root options, scheduling handles, lifecycle state, HostRoot initialization,
  and alternate wiring are separate enough for future workers to implement
  without overlapping with update queues or commit traversal.

Performance:

- Root lane state should reuse fixed-width `LaneMap<T>` and bitsets instead
  of hash maps on hot paths. Root IDs and fiber IDs should be arena indices
  rather than heap-heavy pointer graphs.

Security:

- Host containers and host fiber tokens stay opaque. User callback handles are
  typed placeholders with explicit future rooting/disposal rules, avoiding raw
  JS values in Rust records.

## Commands Run

Tool actions:

- `create_goal` for this worker objective.
- `get_goal` after goal setup; it returned status `active` for this worker
  objective.
- `create_goal` for two worker-internal hypothesis-check subtasks, followed by
  restoring the parent worker objective with `create_goal`.
- Spawned two read-only explorer subagents for hypothesis checks.
- `wait_agent` for both explorers; both completed and their useful findings
  were incorporated.

Shell commands:

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-019-reconciler-host-boundary-migration.md
sed -n '1,260p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,300p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,300p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,300p' worker-progress/worker-073-test-renderer-update-model-plan.md
git status --short --untracked-files=all
test -f worker-progress/worker-079-reconciler-fiber-root-model-plan.md && sed -n '1,260p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md || true
rg --files crates/fast-react-core/src crates/fast-react-reconciler/src crates/fast-react-host-config/src crates/fast-react-test-renderer/src worker-progress | sort
sed -n '1,320p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,360p' crates/fast-react-core/src/lib.rs
sed -n '1,520p' crates/fast-react-core/src/lane.rs
sed -n '1,460p' crates/fast-react-host-config/src/lib.rs
sed -n '460,1040p' crates/fast-react-host-config/src/lib.rs
sed -n '1040,1560p' crates/fast-react-host-config/src/lib.rs
sed -n '1,360p' crates/fast-react-test-renderer/src/lib.rs
sed -n '360,760p' crates/fast-react-test-renderer/src/lib.rs
sed -n '760,1180p' crates/fast-react-test-renderer/src/lib.rs
sed -n '1,260p' worker-progress/worker-070-core-update-queue-plan.md
sed -n '1,280p' worker-progress/worker-071-core-fiber-flags-effect-plan.md
sed -n '1,300p' worker-progress/worker-030-core-lane-model.md
sed -n '1,260p' worker-progress/worker-051-dom-host-token-boundary.md
sed -n '1,240p' worker-progress/README.md
rg -n "report-only|temp|local path|git diff --check|Changed files|Commands Run|Completion Checklist|standard" worker-progress/*.md
rg -n "FiberRoot|HostRoot|RootTag|ConcurrentRoot|LegacyRoot|current|alternate|callbackNode|callbackPriority|timeoutHandle|cancelPendingCommit|identifierPrefix|onRecoverableError|onCaughtError|onUncaughtError|RootLane|HostFiberToken|HostRoot" worker-progress/worker-044-react-dom-client-roots-plan.md worker-progress/worker-055-react-dom-client-roots-implementation-plan.md worker-progress/worker-072-reconciler-root-work-loop-plan.md worker-progress/worker-073-test-renderer-update-model-plan.md worker-progress/worker-070-core-update-queue-plan.md worker-progress/worker-071-core-fiber-flags-effect-plan.md worker-progress/worker-051-dom-host-token-boundary.md
rg -n "HostFiberToken|create_instance\\(|commit_mount\\(|commit_update\\(|detach_deleted_instance\\(|HostTypes for|type HostFiberToken|EventPriority|MutationRenderer" crates/fast-react-host-config/src/lib.rs crates/fast-react-test-renderer/src/lib.rs crates/fast-react-reconciler/src/lib.rs
rg -n "worker-077|worker-078|worker-080|worker-081|worker-082|worker-083|worker-084|worker-085|worker-086|worker-087|worker-088|worker-089|worker-090|worker-091|worker-092|worker-093|worker-094|worker-095" MASTER_PLAN.md MASTER_PROGRESS.md worker-progress || true
sed -n '261,620p' MASTER_PLAN.md
sed -n '261,620p' MASTER_PROGRESS.md
sed -n '261,620p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '261,620p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '361,760p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,220p' worker-progress/README.md
sed -n '1,260p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '261,620p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '621,980p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
rg -n "HostFiberToken|HostScheduling|MutationRenderer|fn create_instance|fn prepare_for_commit|EventPriority|Container|TimeoutHandle" crates/fast-react-host-config/src/lib.rs crates/fast-react-test-renderer/src/lib.rs
git diff --check --no-index /dev/null worker-progress/worker-079-reconciler-fiber-root-model-plan.md
perl -ne 'print "$ARGV:$.:$_" if m{/(?:Users|tmp|private|var/folders|Volumes)/}' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
perl -ne 'print "$ARGV:$.:$_" if /[ \t]$/' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
git status --short --untracked-files=all
git diff -- worker-progress/worker-079-reconciler-fiber-root-model-plan.md
```

## Changed Files

- `worker-progress/worker-079-reconciler-fiber-root-model-plan.md`

## Completion Checklist

- [x] Called `create_goal` for this exact worker task before research.
- [x] Read the required files first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Kept the task report-only.
- [x] Modified only `worker-progress/worker-079-reconciler-fiber-root-model-plan.md`.
- [x] Defined root tags, container handles, HostRoot initialization,
      current/alternate state, callback handles, root options, and lifecycle
      state.
- [x] Separated core-owned generic fiber data from reconciler-owned root
      scheduling state.
- [x] Included a fake mutation host test strategy with no DOM dependency.
- [x] Used subagents to test hypotheses and folded in their returned findings.
- [x] Ran standard report-only checks after writing this file.
