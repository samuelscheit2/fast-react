# worker-114-test-renderer-implementation-plan

## Objective

Produce a report-only implementation plan for the first test-renderer root and
serialization implementation slice. The plan combines the root API,
`create`/`update`/`unmount` lifecycle, `toJSON`, `toTree`,
`TestInstance` traversal, and `act`/flush prerequisites without implementing
source code.

Write scope honored: this worker writes only
`worker-progress/worker-114-test-renderer-implementation-plan.md`. No Rust,
JavaScript, package, conformance, or source test implementation was added.

Goal tool state recorded after setup:

- Active objective:
  `Produce a report-only implementation plan for the first test-renderer root and serialization implementation slice, combining the root API, create/update/unmount lifecycle, toJSON, toTree, TestInstance traversal, and act/flush prerequisites without implementing source code. Write only worker-progress/worker-114-test-renderer-implementation-plan.md, anchored in relevant merged worker reports and with delegated hypothesis checks summarized.`
- Active goal status: `active`.

## Summary

Fast React should implement the first test-renderer public slice as a thin
facade over shared reconciler root semantics plus a read-only serializer over
committed fibers. The root cause to avoid is reusing the current
`TestRenderer::snapshot_container` host snapshot as the public
`react-test-renderer` model. That snapshot is useful for host-config tests, but
it cannot represent HostRoot update queues, current/stale fiber resolution,
composite components, `toTree`, `TestInstance` traversal, `act` queue routing,
or unmount invalidation.

The first implementable slice should therefore be sequenced as:

1. Migrate the existing in-memory test renderer to the token-aware host-config
   trait signatures so the crate compiles again.
2. Add a `TestRendererRoot` facade only after shared reconciler root APIs exist:
   `create_root`/`create_container`, `update_container`,
   `update_container_sync`, root invalidation, sync flushing, and a committed
   root inspection API.
3. Add `to_json`, `to_tree`, and fiber-backed `TestInstance` wrappers against
   committed fibers. Host storage is consulted for host instance/text data
   only; it does not drive traversal.
4. Expose `flush_sync` and `act` only as calls into the shared reconciler root
   scheduler/act layer. Do not implement a test-renderer-local scheduler.

Breaking changes are likely necessary and should be made early. In particular,
the low-level Rust host handle currently named `TestInstance` conflicts with
React test renderer's public `TestInstance` wrapper. Rename the host handle to
`TestHostInstance` or keep the public wrapper under an unambiguous internal
name before adding `.props`, `.parent`, `.children`, and `find*` behavior.

## Dependency State

Present and usable local evidence:

- Worker 018: merged. The test renderer is a canonical in-memory mutation host
  with opaque container/instance/text handles, snapshots, mutation operations,
  single-parent move behavior, commit hooks, and unsupported capability
  errors. It is explicitly not a reconciler.
- Worker 022: merged. Host operation failures are structured as
  `HostError::Operation`, separate from unsupported capabilities. Future
  root/commit code should preserve those errors through `ReconcilerError`
  rather than panic or stringify too early.
- Worker 073: merged. It establishes the core boundary: React test-renderer
  `create`, `update`, and `unmount` call shared `updateContainer` semantics,
  while `toJSON`, `toTree`, and `ReactTestInstance` are renderer-specific but
  fiber-aware.
- Worker 101: merged. It plans `TestRendererRoot`, options, root lifecycle,
  `flush_sync`, root invalidation, and operation logging as a facade over
  shared reconciler roots.
- Worker 102: merged. It plans `toJSON`, `toTree`, `TestInstance`, query
  helpers, and typed serializer errors over committed fibers.

Absent in this worktree and therefore provisional:

- Workers 083, 084, 085, and 086: their prompts exist, but their
  `react-test-renderer` export, root-lifecycle, serialization, and act oracle
  reports/files are absent. No `tests/conformance/*react-test-renderer*` files
  exist locally.
- Worker 087: absent and provisional. Public error-surface details must remain
  gated until its report/oracle files are merged.
- Worker 107: absent and provisional. Core fiber topology implementation must
  not be assumed beyond earlier report-only plans.
- Worker 109: absent and provisional. Minimal reconciler commit implementation
  must not be assumed.
- Worker 111: absent and provisional. Reconciler sync-flush and act
  implementation details should be treated as gates, even though worker 081
  provides an accepted earlier scheduler/act plan.

Current source state:

- `crates/fast-react-test-renderer/src/lib.rs` is a direct host mutation
  test renderer. It has no `TestRendererRoot`, no root lifecycle state, no
  operation log, no `to_json`, no `to_tree`, no fiber-backed public
  `TestInstance`, and no `act` integration.
- `crates/fast-react-reconciler/src/lib.rs` is placeholder-only. It validates
  the mutation host boundary and preserves host operation errors, but has no
  `FiberRoot`, HostRoot queue, `update_container`, work loop, commit traversal,
  sync flush, act queue routing, or committed-fiber inspection API.
- `crates/fast-react-host-config/src/lib.rs` has token-aware host lifecycle
  signatures through `HostFiberTokenRef`.
- There is no `packages/react-test-renderer` scaffold and no JS package facade
  for public `react-test-renderer` behavior.

## Immediate Hard Blocker

`fast-react-test-renderer` is stale against the current host-config trait
surface. A focused compile check fails before any root/serialization work can
be meaningfully built:

- `HostTypes` is missing the required `type HostFiberToken`.
- `create_instance` and `create_text_instance` still use old signatures without
  `HostFiberTokenRef`.
- `commit_mount`, `commit_update`, and `detach_deleted_instance` still use old
  signatures without `HostFiberTokenRef`.
- Existing test helpers call the old creation/commit signatures.

This is not a symptom to patch in the future root facade. The root cause is
that host creation and commit now need reconciler-issued fiber tokens for
public-instance maps, deletion cleanup, diagnostics, event maps, and future
renderer integration. The first source implementation must migrate the host
canary to that boundary before adding root behavior on top.

## Design Contract

### Root API

Add high-level root behavior under `fast-react-test-renderer` only as a facade
over reconciler roots.

Future source files:

- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/options.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/operation_log.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-test-renderer/Cargo.toml`

Public Rust shape:

- `TestRendererRoot`
- `TestRendererOptions`
- `TestRendererError`
- `TestRendererLifecycleState`
- `TestRendererRootGeneration`

`TestRendererRoot` should own or reference:

- one `TestRenderer` host adapter;
- one `TestContainer` host container;
- one reconciler root handle such as `FiberRootId`;
- lifecycle state: `Mounted`, `Unmounting`, `Unmounted`;
- a generation token for future stale `TestInstance` and serializer checks;
- optional operation log state for canary tests.

It must not expose methods that mutate host storage directly, such as
`append_child`, `clear_container`, or root-owned direct instance insertion.
Low-level host mutation tests can continue to use the raw `TestRenderer`.

### Options

`TestRendererOptions` should mirror test-renderer options, not React DOM root
options:

- `create_node_mock`: store as an opaque callback handle or Rust test callback
  placeholder. It must not be invoked by root creation/update enqueue itself.
- `unstable_strict_mode`: maps to HostRoot mode bits.
- `unstable_is_concurrent`: keep behind the React Native test-environment
  branch recorded by worker 101. Do not turn this into DOM root behavior.
- `environment`: internal enum for default vs React Native test environment
  behavior.

Do not add React DOM-only options such as `identifierPrefix`,
`onUncaughtError`, `onCaughtError`, or `onRecoverableError` to the public test
renderer options. Reconciler roots can still carry internal default error
callbacks.

### Create

`TestRendererRoot::create(element, options)` should:

1. Create a raw `TestRenderer` host and `TestContainer`.
2. Create a shared reconciler root with the test renderer host config,
   concurrent root tag by default, strict-mode bits from options, and default
   error handlers.
3. Call shared `update_container(element, root, None, None)`.
4. Return the wrapper before any facade-level direct host mutation.

Focused source tests:

- `create` creates a root record with the expected `TestContainer`.
- The initial element is stored as a HostRoot update payload `{element}`.
- No host mutation log entries are emitted before the work loop commits.
- `create_node_mock` is stored but not called during create/enqueue.
- strict-mode and environment/concurrent option branches are recorded on the
  root config.

### Update

`update(new_element)` should call shared
`update_container(new_element, root, None, None)` while the wrapper is mounted.
It should not clear the container, replace children, or perform host mutation
itself.

Focused source tests:

- mounted update enqueues another HostRoot update on the same `FiberRootId`;
- lane selection comes from the shared event-priority/root-scheduler path;
- no host operation occurs before commit;
- update after unmount is ignored or returns a typed ignored result at the Rust
  layer, while the later JS facade maps to React's `undefined` behavior;
- `HostError` and `ReconcilerError` variants are preserved.

### Unmount

`unmount()` should enqueue a sync null HostRoot update and invalidate the
wrapper after enqueue. It must not implement unmount by calling
`clear_container`.

Focused source tests:

- first unmount enqueues `{element: null}` through
  `update_container_sync` or the equivalent shared unmount helper;
- local wrapper access is invalidated after enqueue;
- repeated unmount is idempotent and does not enqueue duplicate null updates;
- deletion/detach host operations happen only after commit traversal runs;
- stale serializer and public `TestInstance` handles fail through generation
  or current-fiber checks according to the API being called.

### Flush Sync

`flush_sync` belongs to the shared reconciler root scheduler. The test renderer
facade may expose:

```rust
pub fn flush_sync<T>(
    &mut self,
    work: impl FnOnce(&mut Self) -> TestRendererResult<T>,
) -> TestRendererResult<T>;
```

but implementation must enter the reconciler flush-sync priority scope, run the
closure, and flush sync work across all roots in the same runtime. It must not
be a per-root host-container drain.

Focused source tests:

- work scheduled inside `flush_sync` receives sync lane treatment;
- sync flushing visits multiple scheduled test-renderer roots;
- render/commit reentrancy returns the shared scheduler diagnostic;
- non-sync work remains scheduled when not eligible for sync flushing.

### Act

The public `act` function is React-owned, but renderer work must be routed
through the shared reconciler act queue. The first source slice should expose
only the hooks needed by a later JS facade:

- act queue installed/absent state;
- routing root-schedule tasks into act;
- routing non-sync render tasks into act;
- fake callback node or callback handle for act-scheduled tasks;
- error aggregation and continuation preservation hooks;
- not-wrapped-in-act diagnostic hook.

Do not implement `act` as a test-renderer-only synchronous flush helper. That
would miss cross-root sync flushing, callback continuations, passive effect
preflush, and the shared scheduler's reentrancy guards.

## Serialization Contract

Serialization must be built on a read-only committed-fiber inspection boundary,
not raw host snapshots.

Future reconciler files required first:

- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/inspection.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/lib.rs`

Future test-renderer files:

- `crates/fast-react-test-renderer/src/serialization.rs`
- `crates/fast-react-test-renderer/src/test_instance.rs`
- `crates/fast-react-test-renderer/src/query.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/lib.rs`

Required inspection views:

- `CommittedRootView`: root id, lifecycle state, generation, current HostRoot
  fiber id, and test container handle.
- `CommittedFiberView`: fiber id, tag, type, key, memoized props, state node or
  public instance handle, child/sibling/return links, visibility state, and
  current/alternate validation.
- `CommittedHostChildView`: host component/text fibers plus host handles for
  reading test-renderer data.

Inspection must reject render-in-progress fibers and stale alternates. It must
read after the commit slice has switched `root.current` and before/after phases
according to the commit contract from worker 082.

### `toJSON`

Implement `TestRendererRoot::to_json()` using committed root state and host
data:

- empty, null, false, and unmounted roots return null;
- text roots return strings;
- single visible host root child returns one host JSON object;
- multiple visible root children return an array;
- hidden host output returns null and is filtered from parent children;
- host JSON props exclude `children`;
- host JSON objects carry a Rust brand marker to map later to
  `Symbol.for("react.test.json")`.

Focused source tests:

- null/false/empty/unmounted roots return the planned null value;
- text root and nested text children serialize as strings;
- JSON props exclude `children`, while tree/TestInstance props retain it;
- hidden host nodes are omitted from JSON output;
- multiple visible root children preserve order;
- host operation errors during host data reads stay structured.

### `toTree`

Implement `TestRendererRoot::to_tree()` from `root.current`, not from the
host container snapshot:

- HostRoot and fragment-like pass-through fibers flatten children according to
  React test-renderer rules;
- host component fibers return host tree nodes with unfiltered props including
  `children`;
- host text fibers return strings;
- composite function/class/memo/forwardRef-like fibers return component nodes
  when supported;
- unsupported tags such as Activity/offscreen return typed serialization
  errors until their behavior has oracle-backed support.

Focused source tests:

- host tree output includes props with `children`;
- function component roots produce component nodes with rendered children;
- host text fibers return strings;
- Activity/offscreen `toTree` returns a typed unsupported-fiber-tag error in
  the first slice;
- `toTree` never reads work-in-progress fibers.

### Public `TestInstance`

The public `TestInstance` must wrap fibers, not low-level host handles.

Recommended source model:

- rename current low-level host handle `TestInstance` to `TestHostInstance`,
  or keep public wrapper under `ReactTestInstance` internally and expose the
  React name only through the JS facade;
- store `root_id`, root generation, and `fiber_id`;
- resolve current fibers before `.props` and `.children`;
- keep `.type` readable from the wrapper fiber where React behavior allows;
- use host `get_public_instance` for host `.instance`;
- climb return links for `.parent`;
- traverse public wrapper children for `.children`.

Focused source tests:

- `.root` returns the single public root instance for single host/composite
  output;
- null/false/text-only and unmounted roots return the planned typed root-access
  error or null according to the API;
- `.props`, `.type`, `.parent`, `.children`, and `.instance` read current
  fibers and not host snapshots;
- stale wrapper behavior is modeled explicitly rather than treated as one
  uniform generation error;
- hidden Activity/offscreen traversal remains mode-gated and provisional until
  worker 085-equivalent oracle data is merged.

### Query Helpers

Implement query helpers on top of `TestInstance.children`:

- `find(predicate)`
- `find_all(predicate, options)`
- `find_by_type(type)`
- `find_all_by_type(type)`
- `find_by_props(props)`
- `find_all_by_props(props)`

Focused source tests:

- traversal is depth-first and stable;
- `deep: false` stops below matched nodes but still searches descendants of
  non-matching nodes;
- zero-match `find` returns a typed query error;
- multiple-match `find` returns a typed query error with the count;
- `find_by_props` uses partial exact prop matching;
- JS-facing messages remain in the later facade/oracle layer.

## Implementation Sequence

### 1. Host token migration

Future write scope:

- `crates/fast-react-test-renderer/src/lib.rs`
- optional `crates/fast-react-test-renderer/src/fiber_token.rs`
- `crates/fast-react-reconciler/src/lib.rs` tests if fake hosts still use old
  signatures
- matching worker progress report

Task:

- Add `type HostFiberToken` for `TestRenderer`.
- Update creation and commit methods to accept `HostFiberTokenRef`.
- Add minimal validation or storage only where useful for host diagnostics.
- Update low-level tests to construct creation/commit/deletion token refs.

Gate:

- `cargo test -p fast-react-test-renderer --all-features`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`

### 2. Reconciler root prerequisites

Future write scope:

- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-core/src/event_priority.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/act.rs`
- `crates/fast-react-reconciler/src/flush_sync.rs`
- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/inspection.rs`
- `crates/fast-react-reconciler/src/lib.rs`

Task:

- Provide `FiberRoot`, HostRoot fiber records, HostRoot update queues,
  `update_container`, `update_container_sync`, cross-root sync flushing, act
  queue routing, commit traversal, `root.current` switching, and committed
  inspection.

Gate:

- focused reconciler unit tests for root creation, update enqueue, null
  unmount payload, lane selection, commit operation order, `root.current`
  switch timing, sync flush, act routing, and inspection phase guards.

### 3. Test-renderer root facade

Future write scope:

- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/options.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/operation_log.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-test-renderer/Cargo.toml`

Task:

- Add `TestRendererRoot`, `TestRendererOptions`, lifecycle state, generation
  tokens, root invalidation, operation log canary, `create`, `update`,
  `unmount`, and `flush_sync` by delegating to reconciler APIs.

Gate:

- root facade tests proving no direct host mutation before commit;
- update/unmount enqueue tests;
- operation-log tests for commit-driven host calls;
- root generation and idempotent unmount tests.

### 4. Serialization and `TestInstance`

Future write scope:

- `crates/fast-react-test-renderer/src/serialization.rs`
- `crates/fast-react-test-renderer/src/test_instance.rs`
- `crates/fast-react-test-renderer/src/query.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/lib.rs`

Task:

- Add `TestJson`, `TestTree`, public `TestInstance` wrappers, traversal, query
  helpers, and typed serializer/query/root-access errors over committed
  fibers.

Gate:

- focused tests for JSON, tree, public instance traversal, query helpers,
  stale access, hidden output, and unsupported tags.

### 5. JS facade and conformance

Future write scope:

- `packages/react-test-renderer/**`
- `tests/conformance/src/react-test-renderer-*.mjs`
- `tests/conformance/scripts/*react-test-renderer*.mjs`
- `tests/conformance/test/react-test-renderer-*.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-*.json`
- `tests/smoke/import-entrypoints.mjs`
- `package.json` and `package-lock.json` only if adding the package facade
  requires workspace metadata changes

Task:

- Add exact-tarball oracle-backed package behavior for exports, deprecation
  warning, `create`, `update`, `unmount`, `.root`, `getInstance`, `toJSON`,
  `toTree`, `TestInstance`, `find*`, `act`, `unstable_flushSync`, and removed
  `shallow`.
- Map Rust data and typed errors into React-compatible JS object descriptors,
  symbol branding, warnings, and messages.

Gate:

- `node --test tests/conformance/test/react-test-renderer-export-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `node tests/smoke/import-entrypoints.mjs`

## Explicit Non-Goals

This first test-renderer implementation slice should stay below:

- DOM behavior and DOM mutation property/event semantics;
- React DOM public root object behavior;
- hydration and portal behavior;
- Suspense, Activity, Offscreen, and transitions beyond the recorded gates;
- full `scheduler/unstable_mock` compatibility;
- React Native public behavior;
- native N-API callback rooting beyond typed placeholder handles;
- exact JS public error/warning strings until the oracle files are present.

## Known Blockers

- `fast-react-test-renderer` does not currently compile against token-aware
  `fast-react-host-config`.
- `fast-react-reconciler` has no root model, HostRoot update queue, scheduler,
  commit traversal, or inspection API.
- `fast-react-core` has lane bitsets, but this worktree does not show merged
  root lane bookkeeping or event-priority implementation.
- Local workers 083-086 are absent, so `react-test-renderer` public behavior
  gates are based on earlier plans/prompts and must remain provisional.
- Local worker 087 is absent, so exact public error surfaces are provisional.
- Local workers 107, 109, and 111 are absent, so core fiber topology, minimal
  commit, and sync-flush/act implementation dependencies are provisional.
- `TestProps` is currently a string map plus optional text content; future
  serialization needs a props/value model that can preserve arbitrary
  React-like props and `children`.
- There is no `packages/react-test-renderer` facade or workspace metadata.

## Completion Criteria For The First Source Slice

The first implementation slice should be considered complete only when all of
these are true:

- `fast-react-test-renderer` compiles with token-aware host-config signatures.
- `TestRendererRoot::create`, `update`, and `unmount` delegate to reconciler
  root APIs and do not mutate host storage directly.
- unmount is modeled as a null HostRoot update and wrapper invalidation.
- `flush_sync` delegates to shared cross-root sync flushing.
- act integration uses shared act queue routing hooks rather than a local
  synchronous drain.
- `to_json`, `to_tree`, and public `TestInstance` read committed current
  fibers through an immutable inspection API.
- host snapshots remain low-level diagnostics only.
- typed Rust errors distinguish root lifecycle errors, serializer/query
  errors, host operation errors, unsupported capabilities, and provisional
  unsupported fiber tags.
- focused Rust tests cover create/update/unmount, operation order, JSON/tree
  output, traversal/query helpers, stale access, and act/flush gates.
- conformance oracle tests exist before any public `react-test-renderer`
  compatibility claim is made.

## Delegated Checks

Two read-only nested explorer agents were used to challenge the plan:

- Source-boundary check over `fast-react-test-renderer`,
  `fast-react-host-config`, and `fast-react-reconciler`. It confirmed that the
  current test renderer is a direct mutation host, the reconciler is
  placeholder-only, host-config is token-aware, and host snapshots cannot be
  the basis for public serialization.
- Dependency/oracle check over worker reports and conformance files. It found
  local worker 101 and 102 reports, but no local worker 083-087, 107, 109, or
  111 reports/oracles. It also confirmed no `react-test-renderer` package or
  conformance artifacts exist in this worktree and identified the same compile
  gate for missing `HostFiberToken` and old lifecycle signatures.

Both checks avoided `ORCHESTRATOR.md` and made no source edits.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan addresses the root cause: test-renderer public lifecycle and output
  must be backed by shared reconciler roots and committed fibers, not by direct
  host snapshots or ad hoc mutation helpers.

Maintainability:

- The work is split by module ownership: host-token migration, reconciler root
  prerequisites, root facade, serialization/query wrappers, and JS conformance
  facade. Each slice has focused tests and clear write scopes.

Performance:

- Hot scheduling paths remain lane/root-scheduler owned. Serialization and
  operation logs may allocate diagnostic snapshots, but they stay outside the
  reconciler scheduling hot path.

Security:

- Host handles remain opaque. The plan avoids storing raw JS callbacks or DOM
  handles in Rust and requires rooted callback/value handles before
  `createNodeMock`, refs, act callbacks, or JS predicates cross a native
  boundary.

## Commands Run

Tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after setup; it returned the active objective and
  status `active`.
- Spawned two read-only nested explorer agents and closed them after receiving
  results.

Shell/source commands included:

```sh
pwd && ls
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
git status --short
rg --files worker-progress | sort | sed -n '1,220p'
rg -n "worker-0(18|22|73|83|84|85|86|87)|worker-10(1|2|7|9)|worker-111|worker-114" MASTER_PLAN.md MASTER_PROGRESS.md
rg --files tests packages crates docs | rg 'test-renderer|react-test-renderer|scheduler|act|root|reconciler|host-config' | sort | sed -n '1,240p'
sed -n '1,260p' worker-progress/worker-018-test-renderer-mutation-host.md
sed -n '1,280p' worker-progress/worker-022-host-operation-errors.md
sed -n '1,300p' worker-progress/worker-073-test-renderer-update-model-plan.md
sed -n '1,760p' worker-progress/worker-101-test-renderer-root-api-plan.md
sed -n '1,760p' worker-progress/worker-102-test-renderer-serialization-plan.md
sed -n '1,260p' crates/fast-react-test-renderer/src/lib.rs
sed -n '560,1040p' crates/fast-react-test-renderer/src/lib.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '680,1040p' crates/fast-react-host-config/src/lib.rs
sed -n '1,220p' crates/fast-react-core/src/lib.rs
sed -n '1,220p' crates/fast-react-core/src/element.rs
sed -n '1,140p' crates/fast-react-core/src/lane.rs
cargo test -p fast-react-test-renderer --all-features
find . -maxdepth 3 -type d -name '*react-test-renderer*' -o -type d -name '*test-renderer*' | sort
rg --files tests/conformance | rg 'react-test-renderer|test-renderer' || true
sed -n '1,260p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '1,240p' worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
sed -n '1,620p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,260p' worker-progress/worker-082-reconciler-commit-ordering-plan.md
sed -n '1,220p' worker-progress/worker-096-native-root-boundary-plan.md
sed -n '1,220p' docs/tasks/worker-083-react-test-renderer-export-oracle.prompt.md
sed -n '1,240p' docs/tasks/worker-084-react-test-renderer-root-lifecycle-oracle.prompt.md
sed -n '1,260p' docs/tasks/worker-085-react-test-renderer-serialization-oracle.prompt.md
sed -n '1,240p' docs/tasks/worker-086-react-test-renderer-act-oracle.prompt.md
sed -n '1,220p' docs/tasks/worker-087-react-test-renderer-error-surface-oracle.prompt.md
sed -n '1,220p' docs/tasks/worker-111-reconciler-sync-flush-act-plan.prompt.md
sed -n '1,240p' worker-progress/worker-103-scheduler-mock-implementation-plan.md
cat Cargo.toml
cat package.json
cat crates/fast-react-test-renderer/Cargo.toml
rg -n "react-test-renderer|fast-react-test-renderer|scheduler" package.json package-lock.json Cargo.toml crates/fast-react-test-renderer/Cargo.toml tests/smoke/import-entrypoints.mjs packages/*/package.json
rg -n "HostScheduling|current_update_priority|get_current_event_priority|schedule_microtask|should_attempt_eager_transition|HostFiberTokenRef|type HostFiberToken|fn commit_update|fn detach_deleted_instance" crates/fast-react-host-config/src/lib.rs crates/fast-react-test-renderer/src/lib.rs crates/fast-react-reconciler/src/lib.rs
sed -n '1020,1185p' crates/fast-react-host-config/src/lib.rs
sed -n '1280,1345p' crates/fast-react-host-config/src/lib.rs
rg -n '[[:blank:]]$' worker-progress/worker-114-test-renderer-implementation-plan.md
scoped local absolute path leak scan over worker-progress/worker-114-test-renderer-implementation-plan.md
git diff --no-index --check /dev/null worker-progress/worker-114-test-renderer-implementation-plan.md
git status --short --untracked-files=all
```

Verification command result:

- `cargo test -p fast-react-test-renderer --all-features` failed as expected
  for the current checkout because the test renderer has not migrated to
  `HostFiberTokenRef` signatures. This failure is a blocker captured in this
  plan, not a source regression introduced by this report-only worker.
- Final scoped report checks passed: trailing-whitespace scan, local absolute
  path leak scan, no-index diff whitespace check, and final `git status`
  inspection.

## Changed Files

- `worker-progress/worker-114-test-renderer-implementation-plan.md`

Final status shows only this untracked scoped report file.

## Risks Or Follow-Up Tasks

1. Migrate `fast-react-test-renderer` to token-aware host-config signatures.
2. Merge or implement reconciler root prerequisites before adding
   `TestRendererRoot`.
3. Merge oracle workers 083-087 before mapping exact JS public behavior.
4. Resolve the low-level `TestInstance` host-handle naming conflict.
5. Add `packages/react-test-renderer` only when the Rust/native/JS boundary can
   support package-surface tests without placeholder compatibility claims.

## Completion Audit

Success criteria from the prompt:

- Report-only implementation plan: satisfied by this file.
- Write only the scoped worker report: satisfied; no source files were edited.
- Combine root API, create/update/unmount, `toJSON`, `toTree`,
  `TestInstance`, and act/flush prerequisites: covered in Design Contract and
  Serialization Contract.
- Anchor in relevant merged workers 018, 022, 073, 101, and 102: covered in
  Dependency State. Workers 083-086 and 111 are absent and labeled
  provisional.
- Treat workers 087, 107, 109, and 111 as provisional unless present: covered
  in Dependency State and Known Blockers.
- Stay below DOM behavior, React DOM roots, full Scheduler mock compatibility,
  Suspense, and unrecorded concurrent features: covered in Explicit Non-Goals.
- Specify future source files, tests, conformance gates, known blockers, and
  completion criteria: covered in Implementation Sequence, Known Blockers,
  Completion Criteria, and JS facade/conformance gates.
- Summarize delegated checks: covered in Delegated Checks.
- Include quality, maintainability, performance, and security review: covered.
- Include handoff details: Summary, Changed Files, Commands Run, Risks Or
  Follow-Up Tasks, and verification result are included.
