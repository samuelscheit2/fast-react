# worker-106-root-render-e2e-test-plan

## Summary

This is a report-only test plan for the first end-to-end root
render/update/unmount path. No source code, package metadata, conformance
oracle, or crate test was changed.

The first real milestone must prove that `createRoot().render()` is a public
facade over HostRoot updates and the root scheduler, not a direct DOM mutation
shortcut. The green path should start with host-only elements and text:

1. `createRoot(container)` creates a public root object backed by an internal
   concurrent `FiberRoot`.
2. `root.render(element)` returns `undefined`, enqueues a HostRoot update with
   payload `{element}`, schedules root work, and commits only through
   reconciler commit and host mutation operations.
3. A second `root.render(nextElement)` updates props/text through the same
   queue, scheduler, and commit path.
4. `flushSync(() => root.render(element))` applies the discrete-priority
   override, restores state, and flushes sync work across scheduled roots.
5. `root.unmount()` clears the public `_internalRoot` before scheduling,
   enqueues a sync HostRoot `{element: null}` update, flushes sync work, commits
   deletion cleanup, then unmarks the container. A second unmount is a no-op,
   and `root.render()` after unmount throws.

Compatibility must not be claimed for hydration, event dispatch/plugin
behavior, controlled forms, Suspense/Activity, hooks, server/Fizz, resources,
singletons, portals, transition tracing, default transition indicators, browser
layout, CSS cascade, focus, selection, or custom element lifecycle behavior.

## Goal Tool Status

- `create_goal` was available and was called before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: `Produce a report-only test
  plan for the first end-to-end root render/update/unmount path, mapping
  createRoot().render(), HostRoot updates, commit/mutation behavior, flushSync,
  and root unmount to concrete conformance and integration tests without
  claiming unsupported hydration, events, controlled forms, Suspense, or hooks
  behavior. Write only worker-progress/worker-106-root-render-e2e-test-plan.md,
  anchor in specified worker evidence, use subagents to test hypotheses, and
  include handoff requirements.`

## Changed Files

- `worker-progress/worker-106-root-render-e2e-test-plan.md`

## Current Local State

- `packages/react-dom/client.js` exports loud placeholders for `createRoot` and
  `hydrateRoot`.
- `packages/react-dom/index.js` and `packages/react-dom/profiling.js` export
  loud placeholders for `flushSync`; profiling also exposes placeholder
  `createRoot` and `hydrateRoot`.
- `crates/fast-react-reconciler/src/lib.rs` is still a placeholder with a
  mutation-renderer boundary validator. It has no `FiberRoot`, HostRoot fiber,
  HostRoot update queue, root scheduler, render work loop, commit traversal, or
  `flush_sync_work`.
- `crates/fast-react-host-config/src/lib.rs` has the token-aware mutation host
  boundary: `HostFiberTokenRef`, `HostCreation`, `HostCommit`,
  `MutationHost`, `HostScheduling`, and structured host errors.
- `crates/fast-react-test-renderer/src/lib.rs` has useful in-memory mutation
  host semantics and tests, but it is not a reconciler root implementation.
  Future fake-host commit tests may need a token-aware migration before they
  compile against the latest host-config contract.
- `worker-progress/worker-092-react-dom-create-root-facade-plan.md` and
  `worker-progress/worker-093-root-render-integration-plan.md` are not merged
  in this worktree. Sibling draft reports were inspected as provisional only.

## Evidence Gathered

Merged evidence used as anchors:

- Worker 044: client roots are reconciler roots. `createRoot` validates and
  marks the container, installs listeners, creates a concurrent root, and
  returns a tiny root object. `root.render` calls `updateContainer`; unmount
  clears the public handle, enqueues sync `null`, flushes sync work, then
  unmarks the container.
- Worker 055: client roots must land after root lane bookkeeping, HostRoot
  queues, root scheduling, commit hooks, DOM markers/listeners, and DOM
  mutation host support. Direct DOM mutation from `root.render` is rejected.
- Worker 058: checked React DOM 19.2.6 public `flushSync` /
  `unstable_batchedUpdates` oracle covers export/callable shape, callback
  return and argument behavior, falsy/nonfunction behavior, throw propagation,
  nesting, public Scheduler observations, and `react-server` boundaries. It is
  rootless public API evidence, not root commit evidence.
- Workers 061, 062, and 063: checked React DOM 19.2.6 DOM oracles cover bounded
  attribute/property mutation, style and `dangerouslySetInnerHTML`, and
  namespace/SVG/MathML behavior against deterministic fake DOM substrates.
- Worker 072: root work loop must include lane-driven root scheduling,
  HostRoot queues, WIP fibers, complete work, phase-partitioned commit, and
  host mutation integration.
- Worker 079: `FiberRoot` owns root-wide lanes, scheduling state, lifecycle,
  options, callbacks, and `current`; HostRoot is the root fiber entry point.
- Worker 081: scheduler must use a global scheduled-root list, root-schedule
  microtask, callback reuse/cancelation, cross-root sync flushing, reentrancy
  guards, and act routing.
- Worker 082: commit must run before-mutation, mutation, host reset,
  `root.current` switch, layout, and deferred passive phases in that order.
- Worker 090: DOM node maps, latest props maps, public instance lookup, and
  token cleanup are DOM adapter concerns and must be cleaned during
  deletion/unmount.
- Worker 091: minimal DOM mutation host needs owner-document creation,
  namespace context, bounded property payloads, mutation operations, and
  explicit exclusions for forms, hydration, resources, singletons, and events.
  Its note that worker 062 was absent is stale in this worktree; worker 062 is
  now merged and available.
- Worker 094: `root.unmount` and `flushSync` must be scheduler-backed. Unmount
  clears `_internalRoot` before scheduling, enqueues sync `{element: null}`,
  flushes sync work across roots, then unmarks the container.

Provisional evidence, not used as merged anchors:

- Worker 046 client-root oracle is still in flight and no merged report exists
  here.
- Worker 049 hydration marker oracle is still in flight and is a non-goal for
  this plan.
- Worker 088 and 089 sibling reports exist for root markers and listener
  installation, but they are not merged in this worktree. They can become
  inputs after merge; this test plan does not depend on them.
- Worker 092 and 093 sibling draft reports exist for `createRoot` facade and
  root-render integration, but they are not merged here. They are treated as
  provisional cross-checks only.
- Worker 095 hydrate-root facade is still in flight and explicitly out of
  scope for the first non-hydration root render path.

Delegated hypothesis checks:

- Subagent `019e0ef3-3362-79c3-8d77-559f206542d7` checked public facade,
  `flushSync`, and unmount evidence. It confirmed workers 044, 055, 058, and
  094 support tests for root object behavior, render/update/unmount ordering,
  post-unmount errors, and root-backed `flushSync`, while warning that worker
  058 is rootless public API evidence only.
- Subagent `019e0ef3-3e35-70d1-9edf-b369bd73c6b2` checked reconciler/root
  evidence. It confirmed the HostRoot update, circular queue, global scheduler,
  and phase-partitioned commit constraints, and recommended root/queue,
  scheduler, commit operation, and error diagnostics.
- Subagent `019e0ef3-4a90-72b2-bf1a-f6cb2b4d5c14` checked host and DOM
  mutation evidence. It confirmed token-aware host boundary support, fake-host
  mutation canaries, DOM oracle coverage for attributes/style/namespaces, and
  the need to test node-map cleanup on unmount.

## Root-Cause Invariants To Test

- The public root object is a handle, not the renderer. `render` and `unmount`
  enqueue HostRoot updates and return `undefined`; they do not mutate DOM or
  fake-host storage directly.
- HostRoot updates use React-compatible queue semantics: circular pending
  queue, base queue rebase, lane skipping, callback collection, transition
  entanglement hooks, and the payload key `element`.
- Lanes decide work eligibility; Scheduler is only callback transport for
  non-sync work. Sync work and `flushSync` must flush across all scheduled
  roots.
- Commit is non-interruptible and phase-partitioned. Mounted host mutation
  happens only in the mutation phase, and `root.current` switches only after
  mutation/host reset and before layout.
- DOM identity and latest props live in DOM maps keyed by reconciler-issued
  opaque tokens. Unmount/deletion cleanup must clear those maps and reject
  stale tokens.
- `flushSync` must save/restore current transition and DOM update priority,
  run the callback, then call the root scheduler flush hook. Callback throw
  still restores state.
- `root.unmount` must clear `_internalRoot` before any user-code reentry can
  observe the root as mounted, but must unmark the container only after the
  sync null update flushes.

## Test Plan By Layer

### 1. JS Facade Behavior

Purpose: prove the public API routes into the reconciler and preserves React
DOM 19.2.6 observable behavior without claiming renderer internals.

Tests:

- `react-dom/client` exports `createRoot`, `hydrateRoot`, and `version`; this
  path keeps `hydrateRoot` unsupported or separately gated until hydration
  lands.
- `react-dom/profiling` exposes the same root/`flushSync` behavior only after
  normal root behavior is wired; profiling must not be a fake placeholder once
  root behavior exists.
- `createRoot(invalidContainer)` throws before allocating root state or writing
  root/listener markers.
- `createRoot(container)` returns a root object with one own `_internalRoot`
  slot and prototype `render` and `unmount` methods.
- `createRoot(container)` does not mutate DOM children before any render.
- Root options ingestion stores `identifierPrefix`, `onUncaughtError`,
  `onCaughtError`, and `onRecoverableError` as root config without claiming
  feature-gated transition callbacks or default transition indicators.
- `root.render(element)` returns `undefined`.
- Development `root.render(element, secondArg)` warnings match React DOM for
  callback, repeated container, and other defined second arguments. Production
  does not warn.
- `root.render(...)` after `root.unmount()` throws
  `Cannot update an unmounted root.`
- `root.unmount()` returns `undefined`; second unmount returns `undefined` and
  performs no additional mutation.
- Development `root.unmount(callback)` warning is covered, but callback support
  is not claimed.
- `flushSync` public shape extends worker 058 with root-backed cases:
  callback return forwarding, no callback args, ignored extra args, falsy
  callback `undefined`, truthy non-function `TypeError`, callback throw
  propagation, nested calls, and restoration after throw.
- `flushSync(() => root.render(element))` commits before `flushSync` returns
  only after the root scheduler and DOM mutation host exist.

Diagnostics required:

- Public warning/error capture by mode.
- Root object descriptor snapshots.
- Facade-to-reconciler call trace proving `render` called `update_container`
  and did not call DOM mutation helpers directly.
- Marker side-effect trace only after root-marker evidence is merged.

### 2. Reconciler And Root Unit Tests

Purpose: prove root data, HostRoot queues, lane selection, scheduling, and
flush behavior before DOM is involved.

Tests:

- Concurrent `FiberRoot` construction initializes a current HostRoot fiber,
  root lifecycle state, opaque container handle, root options, root lane state,
  scheduler callback fields, and HostRoot memoized state with `element: null`.
- Current/WIP HostRoot alternate creation keeps `root.current` pointing at the
  current tree until commit.
- `update_container(element, root, null, null)` creates a HostRoot update with
  payload key `element` and the exact JS element/value handle passed by the
  public facade.
- `update_container_sync(null, root, null, null)` creates a `SyncLane`
  HostRoot update with payload `{element: null}` for unmount.
- HostRoot queue processing preserves insertion order, skips insufficient
  lanes, clones skipped updates into base queues, collects callbacks, and does
  not drain updates FIFO.
- Lane selection tests cover default priority, discrete priority,
  continuous priority, idle priority, transition lane selection, and
  `flushSync` discrete-priority override. Public Scheduler numeric priorities
  are not treated as lanes.
- `ensure_root_is_scheduled(root)` adds roots to a shared scheduled-root list
  and schedules one root-schedule microtask for the event.
- Root-schedule microtask recomputes next lanes, cancels stale callbacks,
  reuses equal-priority callbacks, bypasses Scheduler for sync lanes, and
  schedules non-sync callbacks through the internal scheduler bridge.
- `flush_sync_work` flushes sync work across all scheduled roots, not only the
  caller's root.
- Render/commit reentrancy guards prevent `flush_sync_work` or microtasks from
  recursively entering the work loop.
- Errors in render or commit return typed reconciler errors without leaving a
  partially switched `root.current`.

Diagnostics required:

- Root trace: root id, lifecycle, `current`, finished work, pending lanes,
  suspended/pinged/expired lanes, finished lanes.
- Queue trace: pending ring order, base queue order, skipped lanes, payload
  summaries, callback list.
- Scheduler trace: root list changes, microtask scheduling, callback
  node/priority, cancel/reuse decisions, sync flush pass count, execution
  context.
- Error typing: unsupported host capability vs host operation failure vs
  unimplemented reconciler behavior vs public render-after-unmount error.

### 3. Fake-Host Commit Tests

Purpose: prove the shared reconciler commit path before DOM-specific rules add
noise.

Prerequisite: migrate or wrap the test renderer/fake host so its
`HostCreation` and `HostCommit` implementations use current token-aware
`HostFiberTokenRef` signatures.

Tests:

- Initial render of a host element/text tree creates detached host instances
  during complete work and performs mounted mutations only in commit.
- Operation log for initial mount:
  `create_instance` / `create_text_instance` /
  `append_initial_child`, then `prepare_for_commit`, placement mutations,
  `reset_after_commit`, `root.current` switch, layout/ref-attach placeholders.
- Update path logs `commit_update` with an ordered payload and
  `commit_text_update` for text changes.
- Reorder/move validates single-parent semantics: moving a child detaches it
  from the old parent and does not clone it.
- Deletion/unmount logs ref-detach placeholders, host removes,
  `detach_deleted_instance`, reverse-map cleanup, and passive scheduling
  placeholders in the correct order.
- Failed insert/remove reports structured `HostOperation` errors and preserves
  the previous tree.
- Unsupported host capability reports `UnsupportedHostCapability`, not a
  generic panic or unimplemented placeholder.
- `root.current` remains old during render and mutation, then switches before
  layout canaries observe it.

Diagnostics required:

- Phase-tagged operation log: phase, fiber id/tag, host token phase/target,
  host call, parent/child handles, update payload summary.
- Root current switch marker in the same log.
- Tree snapshot before and after each commit and after failed host operations.

### 4. DOM Mutation Host Tests

Purpose: prove the minimum DOM host behavior needed for root render/update and
unmount without claiming broader React DOM behavior.

Tests:

- Container owner document is used for element and text creation. No global
  `document` shortcut is allowed.
- HTML, SVG, and MathML contexts choose `createElement` vs
  `createElementNS` correctly.
- `foreignObject` switches descendants back to HTML namespace.
- Initial props cover only oracle-backed behavior from workers 061, 062, and
  063: `className`, `htmlFor`, booleanish attributes, `data-*`, `aria-*`,
  custom attributes, custom elements where covered, SVG/MathML/namespaced
  attributes, style set/remove, CSS custom props, and
  `dangerouslySetInnerHTML` validation/write behavior.
- Update payload diff produces compact ordered payloads. Event-like props are
  latest-props-map data only; no event dispatch is claimed.
- `append_child`, `append_child_to_container`, `insert_before`,
  `remove_child`, `remove_child_from_container`, `clear_container`,
  `commit_text_update`, `reset_text_content`, hide/unhide instance, and
  hide/unhide text are covered for the minimum host path.
- Unmount removes root-owned children and clears `node -> token`,
  `node -> latest props`, `token -> node`, and root/container maps at the
  commit-defined cleanup point.
- Retained deleted DOM nodes cannot resolve stale tokens or retain latest
  props/callback values.
- Root container remains marked during the sync null unmount commit and is
  unmarked only after `flushSyncWork` returns.

Diagnostics required:

- DOM operation log from the deterministic fake DOM.
- Node-map debug counters or trace hooks for map insert/update/delete.
- Stale-token resolution checks after deletion and root disposal.
- Explicit capability flags showing hydration, forms, resources, singletons,
  and event dispatch are not enabled by this slice.

### 5. Conformance Dual-Run Oracles

Purpose: compare pinned React DOM 19.2.6 and Fast React under the same
deterministic DOM substrate once implementation exists.

Add a future `react-dom-root-render-e2e` oracle family with target/scenario
metadata, probe runner, generator, print CLI, checked JSON, and focused
`node:test` checks. Normal tests should read the checked artifact; regeneration
should verify exact tarballs, integrity, file lists, and path hygiene.

Required scenarios:

- `create-root-no-render`: valid container creates a root, returns the expected
  root object shape, installs only root lifecycle side effects that are in
  scope, and performs no child mutation.
- `initial-host-render`: `flushSync(() => root.render(createElement("div",
  props, "text")))` commits a simple host tree and returns `undefined`.
- `update-host-render`: second render updates text and oracle-backed props
  through mutation payloads.
- `replace-host-tree`: render changes root child type and proves deletion plus
  placement order.
- `render-null`: `root.render(null)` clears mounted children through HostRoot
  update semantics.
- `root-unmount`: unmount returns `undefined`, clears children, clears maps,
  and unmarks after flush.
- `double-unmount`: second unmount is no-op.
- `render-after-unmount`: later render throws the React DOM error.
- `flush-sync-root-render`: callback state is restored and the root commit is
  synchronous.
- `cross-root-sync-flush`: pending sync work on root B flushes when root A
  triggers `flushSync` or unmount.
- `development-warnings`: second render argument, unmount callback argument,
  duplicate root, and reentrancy warning surfaces only when their supporting
  root marker/reentrancy evidence is merged.

Oracle output should normalize:

- public return values, errors, and warnings;
- root object descriptors;
- host operation log;
- DOM tree snapshot;
- node-map cleanup counters;
- root scheduler trace;
- conformance claims, all false until the Fast React implementation matches
  every required scenario.

Do not include scenarios whose expected behavior requires unsupported features:
hydration mismatch, event dispatch, controlled inputs/selects/textareas,
Suspense, hooks/effects, class lifecycles, refs lifecycle, portals, resources,
server/Fizz, browser parser/layout/focus/selection, or custom element
lifecycle callbacks.

## Minimum Green Path

The project should not claim a real root render milestone until all of these
are green:

1. JS facade tests prove `createRoot`, root object shape, `render`, `unmount`,
   and public `flushSync` route to private reconciler APIs and preserve public
   return/error/warning behavior for the supported slice.
2. Reconciler unit tests prove `FiberRoot`, HostRoot update queues, lane
   selection, scheduled-root list, cross-root sync flushing, reentrancy guards,
   and `update_container(_sync)` payload shape.
3. Fake-host commit tests prove phase ordering, host operation ordering,
   `root.current` switch timing, deletion cleanup, and structured host error
   propagation.
4. DOM mutation host tests prove owner-document/namespace creation,
   oracle-backed props/style/HTML mutation, append/insert/remove/clear/text
   updates, and node-map cleanup.
5. Dual-run conformance oracle scenarios for initial render, update,
   render-null, unmount, double-unmount, render-after-unmount, root-backed
   `flushSync`, and cross-root sync flush match React DOM 19.2.6 under the
   same DOM shim.
6. All checked artifacts keep broader compatibility claims false and list
   unsupported features explicitly.

The minimum tree can use `React.createElement` with host tags and text only.
Function components, hooks, refs, class components, Suspense, portals,
controlled form controls, hydration, events, and resources are not required for
this milestone.

## Sequencing Dependencies

Recommended order:

1. Consume merged client-root behavior evidence from worker 046 or add an
   equivalent client-root oracle before facade compatibility claims.
2. Implement/finalize root model and HostRoot records.
3. Implement HostRoot update queue and `update_container` /
   `update_container_sync`.
4. Implement root scheduler, scheduler bridge, cross-root `flush_sync_work`,
   and reentrancy guards.
5. Implement commit skeleton and token-aware fake-host operation log.
6. Implement DOM node maps and minimum DOM mutation host.
7. Implement the `createRoot` facade and public root object.
8. Implement root-backed `flushSync` dispatcher integration.
9. Add dual-run `react-dom-root-render-e2e` conformance oracle and Fast React
   comparison gates.

In-flight workers 046, 088, 089, 092, and 093 should be consumed if merged
first. Until then, this plan treats their evidence as provisional and does not
use it as a prerequisite for completion.

## Explicit Non-Goals

- No `hydrateRoot`, hydration root state, Fizz marker matching, hydration
  replay, or `unstable_scheduleHydration`.
- No synthetic event dispatch, event plugin extraction, propagation,
  `preventDefault`, batching from event dispatch, controlled-state restore, or
  portal event bubbling. Root listener installation may be tested later as a
  root lifecycle side effect only after merged evidence exists.
- No controlled input/select/textarea/form behavior.
- No Suspense, Activity, Offscreen, transitions beyond lane selection tests,
  `use`, hooks, effects, context propagation, or component lifecycle claims.
- No refs lifecycle claim for the milestone; fake-host logs may use internal
  canaries, but public ref behavior remains separate.
- No browser parser/layout/focus/selection/CSS cascade/custom element lifecycle
  claim. Deterministic fake DOM output is not browser-native behavior.
- No server/static/Fizz, resources, singletons, view transitions, or profiling
  performance claim.

## Failure Diagnostics Required Before Milestone Claim

- Public facade diagnostics: warnings/errors by mode, root object descriptors,
  exact returned values, and facade-to-private-call traces.
- Root diagnostics: root id, lifecycle state, current/finished work ids,
  pending/finished lanes, scheduler callback node/priority, pending passive
  state.
- Queue diagnostics: pending circular queue, base queue, skipped lanes,
  payload summaries, callback list.
- Scheduler diagnostics: scheduled-root list, microtask flags, callback
  cancel/reuse decisions, sync flush pass count, reentrancy context, act queue
  routing when enabled.
- Commit diagnostics: phase-tagged host operation log, `prepare_for_commit`,
  mutation calls, `reset_after_commit`, `root.current` switch marker, layout
  marker, passive scheduling marker, and structured host errors.
- DOM diagnostics: operation log, tree snapshots, node-map sizes, stale-token
  rejection, root marker state, and latest-props cleanup.

## Risks Or Blockers

- Current local `react-dom` and reconciler files are placeholders, so no
  current Fast React root render behavior can pass this plan yet.
- A client-root public behavior oracle is not merged in this worktree.
- Root marker/listener sibling reports exist but are unmerged; marker/listener
  tests should not become required green gates until their evidence lands or an
  equivalent oracle is merged.
- Worker 058's `flushSync` oracle is necessary but insufficient: it proves
  public rootless callback behavior, not root commit timing or cross-root sync
  flushing.
- Fake-host operation-order tests may require token-aware test renderer
  migration before they can compile against the current host-config traits.
- Node-map cleanup is a likely memory/security blocker for any unmount claim:
  retained deleted DOM nodes must not retain latest props or resolve stale
  tokens.
- The deterministic DOM substrates used by existing oracles are not browser
  engines. Browser-specific behavior should remain explicitly unclaimed.

## Recommended Next Tasks

- Add or merge a checked React DOM client-root public behavior oracle covering
  invalid containers, duplicate root warnings, root object descriptors,
  `render`/`unmount` warnings, idempotence, and render-after-unmount.
- Implement focused reconciler unit tests for HostRoot update queue payloads,
  lane selection, root scheduling, and cross-root sync flush before public root
  facade work.
- Add token-aware fake-host commit operation logging and phase-order tests.
- Add DOM node-map cleanup tests before claiming root unmount safety.
- Add the future `react-dom-root-render-e2e` dual-run oracle only after a real
  createRoot facade, root scheduler, commit path, and minimal DOM host exist.

## Quality, Maintainability, Performance, And Security Review

- Quality: the plan ties every milestone claim to a concrete test layer and
  keeps rootless public API evidence separate from root-backed behavior.
- Maintainability: JS facade, reconciler, fake host, DOM host, and conformance
  oracle responsibilities are separated so later workers can implement narrow
  slices without hiding root-cause dependencies.
- Performance: the plan protects lane bitsets, callback reuse/cancelation,
  delegated root lifecycle setup, compact DOM update payloads, and bounded
  commit work from being replaced by direct mutation shortcuts.
- Security: DOM writes stay in structured DOM host operations; raw HTML is
  limited to oracle-backed `innerHTML` behavior; node-map cleanup prevents
  deleted nodes from retaining props/callbacks; Rust must not store raw JS
  values without explicit rooting/lifetime policy.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files worker-progress | sort | sed -n '1,220p'
git status --short
find .. -maxdepth 1 -type d -name 'fast-react-worker-*' | sort | sed -n '1,180p'
rg -n "worker-0(46|49|88|89|92|93|95)|createRoot|flushSync|root\\.render|unmount|HostRoot|commit|mutation" MASTER_PROGRESS.md MASTER_PLAN.md | sed -n '1,240p'
sed -n '1,220p' ../fast-react-worker-092-react-dom-create-root-facade-plan/worker-progress/worker-092-react-dom-create-root-facade-plan.md
sed -n '1,260p' ../fast-react-worker-093-root-render-integration-plan/worker-progress/worker-093-root-render-integration-plan.md
sed -n '1,180p' ../fast-react-worker-088-dom-container-root-markers-oracle/worker-progress/worker-088-dom-container-root-markers-oracle.md
sed -n '1,180p' ../fast-react-worker-089-dom-root-listener-installation-oracle/worker-progress/worker-089-dom-root-listener-installation-oracle.md
sed -n '1,260p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,300p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,260p' worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md
sed -n '1,260p' worker-progress/worker-061-dom-attribute-property-oracle.md
sed -n '1,260p' worker-progress/worker-062-dom-style-dangerous-html-oracle.md
sed -n '1,260p' worker-progress/worker-063-dom-namespace-svg-oracle.md
sed -n '1,360p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,320p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '1,340p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,360p' worker-progress/worker-082-reconciler-commit-ordering-plan.md
sed -n '1,320p' worker-progress/worker-090-dom-node-map-public-instance-plan.md
sed -n '1,360p' worker-progress/worker-091-dom-mutation-minimum-plan.md
sed -n '1,420p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '1,240p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,260p' packages/react-dom/index.js
sed -n '1,220p' packages/react-dom/profiling.js
rg --files tests/conformance | sort | sed -n '1,240p'
rg --files crates/fast-react-test-renderer crates/fast-react-host-config crates/fast-react-core/src | sort | sed -n '1,240p'
rg -n "HostFiberToken|HostScheduling|MutationHost|commit_update|create_instance|append_child|detach_deleted_instance|prepare_for_commit|reset_after_commit" crates/fast-react-host-config/src/lib.rs crates/fast-react-test-renderer/src/lib.rs | sed -n '1,260p'
sed -n '1,240p' tests/conformance/README.md
sed -n '1,220p' tests/conformance/package.json
rg -n "known|mismatch|claim|Fast React|compatibility|dual" tests/conformance/src/*oracle.mjs tests/conformance/test/*oracle.test.mjs | sed -n '1,220p'
test -f worker-progress/worker-106-root-render-e2e-test-plan.md && sed -n '1,240p' worker-progress/worker-106-root-render-e2e-test-plan.md || true
rg -n '<local/temp path and conflict-marker pattern>' worker-progress/worker-106-root-render-e2e-test-plan.md
rg -n '[ \t]$' worker-progress/worker-106-root-render-e2e-test-plan.md
git diff --check -- worker-progress/worker-106-root-render-e2e-test-plan.md
out=$(git diff --check --no-index /dev/null worker-progress/worker-106-root-render-e2e-test-plan.md 2>&1 || true); if [ -n "$out" ]; then printf '%s\n' "$out"; exit 1; fi
rg -n "^(## Summary|## Goal Tool Status|## Changed Files|## Current Local State|## Evidence Gathered|## Root-Cause Invariants To Test|## Test Plan By Layer|### 1\\. JS Facade Behavior|### 2\\. Reconciler And Root Unit Tests|### 3\\. Fake-Host Commit Tests|### 4\\. DOM Mutation Host Tests|### 5\\. Conformance Dual-Run Oracles|## Minimum Green Path|## Sequencing Dependencies|## Explicit Non-Goals|## Failure Diagnostics Required Before Milestone Claim|## Risks Or Blockers|## Recommended Next Tasks|## Quality, Maintainability, Performance, And Security Review|## Commands Run|## Verification|## Completion Audit)" worker-progress/worker-106-root-render-e2e-test-plan.md
rg -n "Worker (044|055|058|061|062|063|072|079|081|082|090|091|094)|Worker (046|049|088|089|092|093|095)|provisional|hydration|controlled forms|Suspense|hooks|flushSync|HostRoot|createRoot|root\\.render|root\\.unmount|subagent|Subagent" worker-progress/worker-106-root-render-e2e-test-plan.md | sed -n '1,260p'
wc -l worker-progress/worker-106-root-render-e2e-test-plan.md
sed -n '73,116p' worker-progress/worker-106-root-render-e2e-test-plan.md
```

Tool actions:

- `create_goal`
- `get_goal`
- Spawned three read-only nested explorer subagents for public facade,
  reconciler/root, and host/DOM mutation hypothesis checks.

No source test suite was run because this task is report-only and changed only
this report. Verification below is scoped to report hygiene and write scope.

## Verification

- `git status --short` shows only this report:
  `?? worker-progress/worker-106-root-render-e2e-test-plan.md`.
- Scoped local/temp path and conflict-marker check on this report returned no
  matches.
- Scoped trailing whitespace check on this report returned no matches.
- `git diff --check -- worker-progress/worker-106-root-render-e2e-test-plan.md`
  passed.
- `git diff --check --no-index /dev/null worker-progress/worker-106-root-render-e2e-test-plan.md`
  passed via an output-empty wrapper, covering the untracked file case.

## Completion Audit

Objective restated as success criteria:

- Produce a report-only test plan.
- Write only `worker-progress/worker-106-root-render-e2e-test-plan.md`.
- Map `createRoot().render()`, HostRoot updates, commit/mutation behavior,
  `flushSync`, and root unmount to concrete conformance and integration tests.
- Do not claim unsupported hydration, events, controlled forms, Suspense, or
  hooks behavior.
- Anchor the plan in merged evidence from workers 044, 055, 058, 061, 062,
  063, 072, 079, 081, 082, 090, 091, 094, with 092 and 093 only if present.
- Treat workers 046, 049, 088, 089, 092, 093, and 095 as in flight unless
  their reports are merged locally; label unmerged evidence as provisional.
- Split tests into JS facade behavior, reconciler/root unit tests, fake-host
  commit tests, DOM mutation host tests, and conformance dual-run oracles.
- Identify minimum green path, non-goals, sequencing dependencies, and failure
  diagnostics.
- Use nested subagents to test hypotheses and summarize their results.
- Include handoff sections: summary, changed files, commands run, evidence,
  risks/blockers, and recommended next tasks.
- Review quality, maintainability, performance, and security.

Prompt-to-artifact checklist:

- Report-only scope: satisfied. Final `git status --short` shows only this
  report.
- Required file: satisfied by `worker-progress/worker-106-root-render-e2e-test-plan.md`.
- Goal setup evidence: included in `Goal Tool Status`.
- Merged evidence anchors: included in `Evidence Gathered`.
- In-flight/provisional labeling: included in `Evidence Gathered`.
- Required test layers: included in `Test Plan By Layer`.
- Minimum green path: included in `Minimum Green Path`.
- Non-goals: included in `Explicit Non-Goals`.
- Sequencing dependencies: included in `Sequencing Dependencies`.
- Failure diagnostics: included in `Failure Diagnostics Required Before
  Milestone Claim`.
- Subagent use: included in `Evidence Gathered`.
- Handoff sections: included.
- Quality/security review: included.
- Final hygiene checks: satisfied by the `Verification` commands above.
