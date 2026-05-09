# worker-101-test-renderer-root-api-plan

## Objective

Produce a report-only plan for Rust test-renderer root API create/update/unmount
integration with shared reconciler roots.

Write scope honored: this worker changes only
`worker-progress/worker-101-test-renderer-root-api-plan.md`. No source code was
implemented.

Goal tool state recorded after setup:

- Active objective:
  `Produce a report-only plan for Rust test-renderer root API create/update/unmount integration with shared reconciler roots.`
- Active goal status: `active`.

## Summary

Fast React should add `TestRendererRoot` as a test-renderer facade over shared
reconciler root semantics, not as another way to mutate the in-memory test host.
The root cause is the same one identified by the reconciler and React DOM root
plans: React 19.2.6 test-renderer `create()`, `update()`, and `unmount()` build
or update a `FiberRoot` through `createContainer` and `updateContainer`; they do
not directly edit the host container's child list.

The first Rust root API should therefore wait for, or land with, a reconciler
root model that exposes typed create-root, update-container, unmount/null-update,
and cross-root `flush_sync` entry points. `fast-react-test-renderer` should
remain the mutation host and operation-order canary. Serialization and
`TestInstance` querying should be separate slices over the committed fiber tree,
not part of the root API slice.

Breaking changes are acceptable if they keep this boundary clear. In
particular, it is better to split or rename low-level host-test helpers than to
place public root lifecycle methods on a type that also lets callers mutate host
storage directly.

## Current State

- `fast-react-test-renderer` is currently a deterministic mutation host only.
  Its crate docs explicitly say it is not a reconciler and that callers drive
  host operations directly (`crates/fast-react-test-renderer/src/lib.rs:1`).
- `TestRenderer` owns renderer-local containers, instances, and text records
  (`crates/fast-react-test-renderer/src/lib.rs:21`) and exposes low-level
  `create_container` plus snapshot helpers (`crates/fast-react-test-renderer/src/lib.rs:46`).
- The test renderer implements `HostTypes`, but still uses `EventPriority = ()`
  and has no reconciler root handle (`crates/fast-react-test-renderer/src/lib.rs:595`).
- The test renderer reports only mutation capability
  (`crates/fast-react-test-renderer/src/lib.rs:637`) and implements creation,
  commit, and mutation host calls directly (`crates/fast-react-test-renderer/src/lib.rs:663`,
  `crates/fast-react-test-renderer/src/lib.rs:753`,
  `crates/fast-react-test-renderer/src/lib.rs:844`).
- `fast-react-reconciler` remains a placeholder. It has error conversion and
  mutation-boundary validation, but no `FiberRoot`, HostRoot queue,
  `update_container`, work loop, or sync flushing (`crates/fast-react-reconciler/src/lib.rs:1`,
  `crates/fast-react-reconciler/src/lib.rs:84`,
  `crates/fast-react-reconciler/src/lib.rs:142`).
- `fast-react-host-config` already has renderer-neutral host operation errors
  and host fiber token categories, which are useful for future root/commit
  diagnostics (`crates/fast-react-host-config/src/lib.rs:714`,
  `crates/fast-react-host-config/src/lib.rs:867`).
- `fast-react-core` has React 19.2.6 lane primitives and `LaneMap<T>`, but no
  root lane bookkeeping or root scheduler state (`crates/fast-react-core/src/lane.rs:1`,
  `crates/fast-react-core/src/lane.rs:424`).

## Evidence Gathered

Required reports:

- Worker 018 proves the in-memory test renderer can implement canonical
  mutation host traits with opaque handles, snapshots, commit hooks, and
  unsupported capability errors, but it explicitly did not implement
  reconciliation.
- Worker 022 moves invalid handles, missing insertion/removal targets, and
  impossible mutations into structured `HostError::Operation` results. The root
  API should preserve these errors through the reconciler instead of converting
  them into panics or strings.
- Worker 073 establishes the key boundary for this task: React test-renderer
  `create`, `update`, and `unmount` call shared `updateContainer` semantics,
  while `toJSON`, `toTree`, and `ReactTestInstance` are renderer-specific and
  fiber-aware.
- Worker 081 establishes that `flushSync` and `act` routing belong to the
  reconciler root scheduler: sync work flushes across scheduled roots, normal
  work uses Scheduler callbacks, and DEV act queues capture renderer work.
- Worker 096 applies the same root-boundary rule to native bindings: public
  facade values and private handles should not bypass shared `FiberRoot`
  updates, scheduler work, commit ordering, callback lifetimes, or unmount
  cleanup.

Upstream React 19.2.6 evidence from the exact `react-test-renderer@19.2.6`
package:

- `create()` reads options, creates a test container object, calls
  `createContainer`, then calls `updateContainer(element, root, null, null)`.
- `update(newElement)` calls `updateContainer(newElement, root, null, null)`
  only while the local root/current pointers are valid.
- `unmount()` calls `updateContainer(null, root, null, null)` and then clears
  the wrapper's local root/container references.
- `unstable_flushSync` is exposed from the reconciler flush-sync implementation,
  not from host storage mutation.
- `.root` is a getter that throws after the root has been invalidated.
- `toJSON`, `toTree`, and `ReactTestInstance` traverse host instances and
  current fibers; they are not direct container snapshots.

## Planned API Boundary

### `TestRendererRoot`

`TestRendererRoot` should be a high-level owner for one test-renderer reconciler
root. A suitable shape after reconciler roots exist is:

- owns or references one `TestRenderer` host instance;
- owns one `TestContainer` created by the test renderer host;
- owns a reconciler `FiberRootId` or equivalent opaque root handle;
- stores a root lifecycle state such as `Mounted`, `Unmounting`, `Unmounted`;
- stores a generation token used by future serialization and `TestInstance`
  wrappers to reject stale root access;
- exposes host snapshots and operation logs for tests, but does not expose
  mutable host storage while the root is mounted.

Suggested Rust methods:

```rust
impl TestRendererRoot {
    pub fn create(element: ReactElementHandle, options: TestRendererOptions)
        -> TestRendererResult<Self>;

    pub fn update(&mut self, element: ReactElementHandle) -> TestRendererResult<()>;

    pub fn unmount(&mut self) -> TestRendererResult<()>;

    pub fn flush_sync<T>(
        &mut self,
        work: impl FnOnce(&mut Self) -> TestRendererResult<T>,
    ) -> TestRendererResult<T>;

    pub fn is_unmounted(&self) -> bool;
}
```

The exact element handle type should come from the reconciler/native boundary
slice that owns root payload storage. The test-renderer root API should not
invent a parallel element tree model.

### `TestRendererOptions`

`TestRendererOptions` should mirror test-renderer options, not React DOM
`RootOptions`.

Initial fields:

- `create_node_mock`: optional rooted callback handle or Rust test callback
  placeholder for host refs/public instances. It should not be called until the
  ref/public-instance path exists, but it should be stored on the test
  container/root config so that later ref tests can prove it is routed through
  public-instance lookup rather than through root creation.
- `unstable_strict_mode`: maps to HostRoot mode bits.
- `unstable_is_concurrent`: accepted only behind an explicit React Native test
  environment/root-mode policy. Default stable test-renderer behavior is
  concurrent-only outside that environment.
- `environment`: optional internal policy enum for default versus React Native
  test environment behavior. This lets Rust tests cover the option branch
  without reading JS globals in the Rust crate.

Do not add React DOM-only options such as `identifierPrefix`,
`onUncaughtError`, `onCaughtError`, or `onRecoverableError` to the public
test-renderer options. The reconciler root config can still store default root
error callbacks internally.

### `create`

`TestRendererRoot::create` should:

1. Construct a `TestRenderer` host and create a `TestContainer`.
2. Build a reconciler root with a test-renderer root config:
   concurrent root kind by default, strict mode from options, default error
   handlers, empty identifier prefix, and no hydration form state.
3. Call shared `update_container(element, root, None, None)`.
4. Return a root wrapper whose host container has not been mutated directly by
   the facade.

Focused Rust tests:

- creating a root calls the reconciler create-root path with a `TestContainer`
  handle and mutation host config;
- the initial element is represented as a HostRoot update payload, not as a
  direct call to `append_child_to_container`;
- host operation log remains empty until the fake scheduler/work loop commits;
- strict-mode and concurrent/root-kind options are stored on the root config;
- `unstable_is_concurrent` is ignored outside the React Native test environment
  branch and controls root kind only inside that branch;
- `create_node_mock` is stored but is not invoked during root creation,
  initial update enqueue, or scheduler setup;
- default test-renderer error callbacks are installed without exposing React DOM
  callback options.

### `update`

`update` should delegate to shared `update_container(new_element, root, None,
None)` while the root is mounted. It should not clear, append, or replace host
children itself.

React test-renderer public behavior makes update after unmount a no-op because
the wrapper's root pointer is null. The Rust API can expose that as either
`Ok(())` with an ignored disposition or a distinct `UpdateIgnoredUnmounted`
result, but the later JS facade should return `undefined` and not throw for the
test-renderer `update` method.

Focused Rust tests:

- mounted `update` enqueues a HostRoot update on the same `FiberRootId`;
- update lane selection comes from the shared event-priority/root scheduler
  path, not from a test-renderer-local priority;
- no host operation is recorded before the reconciler reaches commit;
- update after unmount does not resurrect the root or mutate the host tree;
- host/reconciler errors preserve structured `HostError` and
  `ReconcilerError` variants.

### `unmount`

`unmount` should enqueue a HostRoot update whose payload is the `null` element
through shared update semantics, then invalidate the wrapper's local root and
container access path. It should not implement unmount as `clear_container`.

The exact invalidation order should preserve React test-renderer behavior:

- the null update is scheduled through shared `update_container` or the
  reconciler's sync unmount helper when that helper exists;
- the local root/container access path is marked invalid after the null update
  has been enqueued, matching upstream `updateContainer(null, ...)` before local
  pointer clearing;
- cleanup is completed by commit traversal, deletion effects, ref cleanup,
  passive/layout effect ordering, and host `detach_deleted_instance`;
- repeated `unmount` is idempotent and does not enqueue duplicate null updates.

Focused Rust tests:

- first unmount enqueues a null HostRoot update and invalidates root access;
- repeated unmount is a no-op;
- direct `clear_container` is not called by the root facade;
- commit-driven unmount calls deletion/detach host operations in the operation
  log after the scheduler flushes;
- stale future `TestInstance` or serialization handles see the root generation
  mismatch and return a typed unmounted-root error.

### `flush_sync`

`flush_sync` should be a reconciler/root-scheduler integration point. It should
enter the reconciler's flush-sync priority scope, run the caller's closure, and
flush sync work across all scheduled roots in the same test-renderer runtime.
It must not be a per-root shortcut that directly drains the host container.

Focused Rust tests:

- work scheduled inside `flush_sync` receives sync lane treatment through the
  shared lane/event-priority path;
- `flush_sync` flushes sync work for multiple roots in the same runtime;
- reentrant render/commit calls return the reconciler's invalid execution
  context result or warning hook instead of reentering commit;
- host operation log order matches normal commit ordering after the flush;
- async/non-sync work remains scheduled when it should not be forced by the
  sync-only path.

### Root Invalidation

Root invalidation should be a shared wrapper state, not a host container flag.
After `unmount`:

- `.root` access in the future serialization/TestInstance slice must return a
  public test-renderer unmounted-root error matching the React message policy;
- `to_json`/`to_tree` should return null or an unmounted-root error according
  to the public method being implemented in that later slice;
- `update` should not mutate or reschedule an invalidated root;
- any stale `TestInstance` wrapper should compare its stored root generation to
  the root's current generation before traversing current fibers;
- host snapshots for low-level host tests can still inspect the raw test host
  if the test owns the host directly, but root-owned snapshots should be
  read-only and clearly scoped.

## Operation Log Canary

Add operation logging as a test-renderer canary, not as a second commit engine.
The log should record host operations issued by the reconciler in order:

- root and phase metadata: root id, commit id, lane set, and phase when known;
- creation calls: `create_instance`, `create_text_instance`,
  `append_initial_child`, `finalize_initial_children`;
- commit calls: `prepare_for_commit`, `commit_mount`, `commit_update`,
  `commit_text_update`, `reset_text_content`, hide/unhide, `reset_after_commit`;
- mutation calls: append, insert, remove, clear, and deleted instance detach;
- operation result category for structured host errors, without leaking
  renderer-local storage indexes.

The log should be opt-in or cheaply append-only in tests. It should not replace
existing snapshots, and the reconciler should not inspect it to decide work.

Focused Rust tests:

- root API create/update/unmount does not write to host storage before commit;
- commit traversal emits a stable sequence for placement, update, deletion, and
  text update cases;
- failed host operations appear as structured errors and do not leave partial
  host mutations;
- direct host mutation tests can still call low-level APIs without requiring a
  reconciler root;
- operation log assertions are in test-renderer/reconciler integration tests,
  not in core lane or queue tests.

## Separation From Direct Host Mutation APIs

The existing `TestRenderer` host APIs remain valuable for host-config unit
tests: invalid handles, cross-renderer handles, missing insertion/removal
targets, impossible mutations, snapshots, and capability reporting should stay
focused and direct.

The root API should be separated by module and type:

- keep low-level host behavior under names such as `TestRenderer`,
  `TestContainer`, host-handle instances, and host mutation trait
  implementations;
- add root lifecycle behavior under `root.rs` as `TestRendererRoot`;
- expose direct mutable host APIs only to tests or callers that explicitly own a
  raw `TestRenderer`, not through a mounted `TestRendererRoot`;
- make root-owned host snapshots read-only and clearly diagnostic;
- avoid adding convenience methods like `root.append_child` or
  `root.clear_container`.

There is a concrete naming collision to resolve before implementation: the
current low-level `TestInstance` is a host handle, while React test renderer's
public `TestInstance` is a fiber wrapper with `.props`, `.parent`, `.children`,
and `find*` helpers. The implementation should either rename the low-level
handle to something like `TestHostInstance` in a breaking split, or make the
future public wrapper use an unambiguous name internally and expose the React
name only at the JS facade. The first option is cleaner for Rust API clarity.

If this requires a breaking crate API split, make the split early. Mixing root
lifecycle and direct mutation helpers on one public type would make it too easy
for future workers to patch root behavior by bypassing reconciler semantics.

## Separate Future Slices

### 1. Reconciler public root primitives

Write scope:

- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/flush_sync.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- matching worker progress report

Task:

- Expose typed `create_root`, `update_container`, `update_container_sync`,
  `flush_sync_work`, and root invalidation/lifecycle hooks after the lower
  fiber/root/update-queue prerequisites exist.

Focused Rust tests:

- HostRoot construction stores container and options;
- `update_container` enqueues payload `{element}` and returns the selected lane;
- `update_container_sync(null)` enqueues unmount without host mutation;
- `flush_sync_work` is cross-root and reentrancy guarded;
- host operation errors are preserved as `ReconcilerError::HostOperation`.

### 2. Test-renderer operation log

Write scope:

- `crates/fast-react-test-renderer/src/operation_log.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- matching worker progress report

Task:

- Add structured, renderer-neutral operation log records around existing host
  trait methods. Keep it diagnostic and optional.

Focused Rust tests:

- direct host operations produce ordered records when logging is enabled;
- logging records error categories without exposing storage indexes;
- logging disabled does not change host snapshots or errors.

### 3. Test-renderer root API

Write scope:

- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/options.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-test-renderer/Cargo.toml`
- matching worker progress report

Task:

- Add `TestRendererRoot`, `TestRendererOptions`, root lifecycle state,
  create/update/unmount/flush_sync methods, and structured test-renderer root
  errors by delegating to reconciler APIs. If the host-handle naming split has
  not landed, include it here before adding the public/fiber test-instance
  layer.

Focused Rust tests:

- create/update/unmount enqueue root updates and do not directly mutate host
  storage;
- root invalidation is idempotent and generation-based;
- update after unmount is ignored without resurrecting work;
- `flush_sync` delegates to shared cross-root flushing;
- `create_node_mock` is stored and not called by create/update/unmount;
- direct host mutation APIs remain available outside root-owned state.

### 4. Test-renderer root/act integration

Write scope:

- `crates/fast-react-test-renderer/src/act.rs`
- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-reconciler/src/act.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- matching worker progress report

Task:

- Connect test-renderer root work to the reconciler act queue and warning
  hooks. Keep public React `act` and JS warning strings in the package facade
  or oracle-backed JS layer.

Focused Rust tests:

- work scheduled inside act is routed to the fake act queue;
- continuations are preserved;
- thrown task errors aggregate without losing remaining tasks;
- not-wrapped-in-act diagnostics fire only when the act queue is absent.

### 5. Test-renderer serialization

Write scope:

- `crates/fast-react-test-renderer/src/serialization.rs`
- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- matching worker progress report

Task:

- Implement `to_json` and `to_tree` over the committed fiber tree and host
  state. Do not build this into the root API slice.

Focused Rust tests:

- empty or unmounted roots return the correct null/error result for each API;
- host JSON omits `children` from props;
- hidden host nodes serialize to null;
- text nodes serialize as strings;
- composite nodes appear in `to_tree`;
- unsupported fiber tags produce a typed serialization error.

### 6. TestInstance querying

Write scope:

- `crates/fast-react-test-renderer/src/test_instance.rs`
- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- matching worker progress report

Task:

- Implement public/fiber `TestInstance` wrappers over current fibers with
  generation checks, parent/children traversal, public instance lookup, and
  `find*` helpers. Do not reuse the low-level host handle type for this API.

Focused Rust tests:

- `.root` throws or returns the planned unmounted-root error after unmount;
- stale wrappers fail after root generation changes;
- `find`, `findAll`, `findByType`, and `findByProps` match zero/one/multiple
  result behavior;
- `.props`, `.type`, `.parent`, `.children`, and `.instance` read current
  fibers, not raw host snapshots.

### 7. JS/conformance facade

Write scope:

- `packages/react-test-renderer/**` if/when that package facade exists
- `tests/conformance/src/react-test-renderer-*.mjs`
- `tests/conformance/scripts/*react-test-renderer*.mjs`
- `tests/conformance/test/react-test-renderer-*.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-*.json`
- matching worker progress report

Task:

- Add oracle-backed JS surface coverage for package exports, deprecation
  warning, `create` options, `update`, `unmount`, `.root`, `getInstance`,
  `toJSON`, `toTree`, `unstable_flushSync`, `act`, and removed `shallow`.

Focused tests:

- oracle regeneration is deterministic and path-normalized;
- Fast React behavior remains marked unsupported until the Rust/native/JS stack
  is wired end to end;
- no public compatibility claim is made from Rust-only root tests.

## Risks Or Blockers

- `FiberRoot`, HostRoot queues, root lane bookkeeping, root scheduler, commit
  traversal, and root `flush_sync` do not exist yet. A standalone
  `TestRendererRoot` implementation before those land would be a shortcut.
- `EventPriority = ()` in the current test renderer can hide lane-priority
  bugs. A core event-priority type should replace that placeholder before root
  scheduling assertions become meaningful.
- React test-renderer public behavior is partly DEV/test-environment gated:
  deprecation warnings, `global.IS_REACT_NATIVE_TEST_ENVIRONMENT`,
  `unstable_isConcurrent`, and `act` diagnostics need oracle coverage before a
  JS facade claims compatibility.
- `create_node_mock`, ref callbacks, effect callbacks, act callbacks, and root
  errors eventually cross JS/Rust lifetimes. Native callback rooting rules from
  worker 096 must be applied before storing JS values across turns.
- The `TestInstance` name currently refers to a low-level host handle in Rust.
  Leaving that collision unresolved would make the future public test-instance
  API easy to misuse.
- Operation logging could become a fragile implementation oracle if overused.
  It should verify host call ordering, not drive reconciliation.
- Root-owned snapshots are useful diagnostics but cannot substitute for
  fiber-aware serialization or `TestInstance` querying.

## Recommended Next Tasks

1. Implement or merge the reconciler prerequisites: root lane bookkeeping,
   `FiberRoot`, HostRoot update queues, root scheduler/act routing, and commit
   ordering.
2. Add test-renderer operation logging as a canary over the existing mutation
   host before wiring root commits to it.
3. Split or rename the low-level host instance handle before introducing the
   public/fiber test-instance wrapper.
4. Implement `TestRendererRoot` and `TestRendererOptions` only after shared
   reconciler root entry points exist.
5. Keep `to_json`, `to_tree`, and `TestInstance` querying in their own
   fiber-aware slices.
6. Add JS oracle coverage before exposing a public `react-test-renderer`
   package facade or claiming React 19.2.6 compatibility.

## Quality, Maintainability, Performance, And Security

Quality:

- The plan routes root lifecycle through shared reconciler roots, which fixes
  the root cause instead of patching host snapshots.

Maintainability:

- Root API, operation logging, serialization, and `TestInstance` querying are
  separate modules and future write scopes.

Performance:

- Root scheduling remains lane-driven and fixed-width through shared core data.
  Test serialization and operation logs may allocate test artifacts, but they
  stay outside hot reconciler scheduling paths.

Security:

- Host handles remain opaque. The plan avoids raw JS callback storage and
  requires native/rooted callback policy before long-lived JS values cross the
  Rust boundary.

## Delegated Checks

Two nested read-only agents were launched to test the plan assumptions:

- A source-boundary check over current Rust crates, focused on whether a
  `TestRendererRoot` facade can soundly delegate to shared reconciler roots and
  remain separate from direct host mutation APIs.
- A public-behavior check over React 19.2.6 test-renderer evidence, focused on
  options, invalidation, `flushSync`, serialization separation, and oracle/test
  recommendations.

Both checks supported the main architecture: `TestRendererRoot` should be a
facade over shared reconciler roots and direct `TestRenderer` mutation APIs
should remain lower-level host-test utilities. The agents also identified
specific gaps that are now folded into this report: upstream unmount enqueues
the null update before clearing local references, `create_node_mock` needs
storage-without-invocation tests, `unstable_is_concurrent` needs explicit
React Native environment branch tests, and the low-level `TestInstance` host
handle conflicts with the future public test-instance wrapper.

## Commands Run

Tool actions:

- `create_goal` for the worker objective.
- `get_goal` after setup; it reported the expected active objective and
  `active` status.
- Spawned two nested read-only agents for hypothesis testing and waited for
  their completed findings.

Read-only shell commands included:

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,700p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-018-test-renderer-mutation-host.md
sed -n '1,260p' worker-progress/worker-022-host-operation-errors.md
sed -n '1,260p' worker-progress/worker-073-test-renderer-update-model-plan.md
sed -n '1,620p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,620p' worker-progress/worker-096-native-root-boundary-plan.md
wc -l MASTER_PLAN.md MASTER_PROGRESS.md worker-progress/worker-081-reconciler-root-scheduler-act-plan.md worker-progress/worker-096-native-root-boundary-plan.md worker-progress/worker-101-test-renderer-root-api-plan.md
rg --files crates/fast-react-test-renderer crates/fast-react-reconciler crates/fast-react-host-config crates/fast-react-core worker-progress | sort
sed -n '1,629p' worker-progress/worker-101-test-renderer-root-api-plan.md
sed -n '1,240p' crates/fast-react-test-renderer/src/lib.rs
sed -n '560,940p' crates/fast-react-test-renderer/src/lib.rs
sed -n '1,220p' crates/fast-react-reconciler/src/lib.rs
sed -n '680,1010p' crates/fast-react-host-config/src/lib.rs
sed -n '1,120p' crates/fast-react-core/src/lib.rs
sed -n '1,120p' crates/fast-react-core/src/lane.rs
git status --short --untracked-files=all
rg -n "TestRendererRoot|TestRendererOptions|flush_sync|flushSync|operation log|OperationLog|update_container|FiberRoot|HostRoot|TestInstance|to_json|toJSON|to_tree|toTree|unmount|create\\(" crates worker-progress/worker-073-test-renderer-update-model-plan.md worker-progress/worker-081-reconciler-root-scheduler-act-plan.md worker-progress/worker-096-native-root-boundary-plan.md
npm view react-test-renderer@19.2.6 version dist.tarball dependencies peerDependencies --json
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | nl -ba | sed -n '14840,14990p'
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | nl -ba | sed -n '14990,15085p'
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | nl -ba | sed -n '17180,17320p'
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | nl -ba | sed -n '17320,17440p'
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/package.json package/index.js package/shallow.js | nl -ba
scoped local/temp path leak guard over worker-progress/worker-101-test-renderer-root-api-plan.md
if rg -n '[[:blank:]]$' worker-progress/worker-101-test-renderer-root-api-plan.md; then exit 1; else echo 'no trailing whitespace'; fi
git diff --check -- worker-progress/worker-101-test-renderer-root-api-plan.md
output=$(git diff --no-index --check /dev/null worker-progress/worker-101-test-renderer-root-api-plan.md 2>&1); rc=$?; if [ "$rc" -le 1 ] && [ -z "$output" ]; then echo 'no-index diff whitespace check passed'; else printf '%s\n' "$output"; exit "$rc"; fi
```

No Rust or JavaScript source tests were run because this worker is report-only.

## Changed Files

- `worker-progress/worker-101-test-renderer-root-api-plan.md`

Scoped status also shows an untracked root `Cargo.lock`; it is a regenerable
artifact outside this report-only write scope and was not modified for this
plan.

## Verification Checklist

- [x] Called `create_goal` before research and file reads.
- [x] Read all required files.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Wrote only the assigned report file.
- [x] Covered `TestRendererRoot`, options, create/update/unmount,
      `flush_sync`, root invalidation, operation log canary behavior, and
      separation from direct host mutation APIs.
- [x] Kept serialization and `TestInstance` querying as separate implementation
      slices.
- [x] Included future write scopes and focused Rust tests.
- [x] Ran scoped no-local-path-leak check.
- [x] Ran trailing-whitespace check.
- [x] Ran `git diff --check`.
