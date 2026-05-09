# worker-108-react-dom-root-facade-implementation-plan

## Summary

This is a report-only implementation plan for the React DOM root facade slice.
No source code, tests, package metadata, generated artifacts, or orchestration
files were modified.

Fast React should implement `react-dom/client` root APIs as a JavaScript public
facade over private reconciler/root APIs. The facade owns public validation,
warnings, root object shape, option ingestion, entrypoint wiring, and DOM root
marker/listener helper calls. It must not create, update, remove, or hydrate DOM
children directly. `createRoot`, `hydrateRoot`, `root.render`, and
`root.unmount` should delegate to future `FiberRoot` / HostRoot update APIs and
let the reconciler schedule, render, and commit through host-config operations.

The root cause to preserve is that React DOM roots are handles over concurrent
reconciler roots. A facade-local implementation that mutates the container would
skip lane selection, HostRoot circular queues, transition entanglement,
cross-root sync flushing, error callback routing, ref/effect ordering,
`root.current` switch timing, DOM node map cleanup, and hydration replay.

## Goal Tool Status

- `create_goal` was available and was called as the first action for this
  worker objective.
- `get_goal` was available immediately after goal setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: `Produce a report-only
  implementation plan for the React DOM root facade slice, including
  createRoot, hydrateRoot, root object shape, render, unmount, option
  validation, marker ownership, and how the JS facade should call future
  reconciler/root APIs without doing DOM mutation directly. Write only
  worker-progress/worker-108-react-dom-root-facade-implementation-plan.md and
  anchor the plan in the specified merged/provisional worker reports.`

## Changed Files

- `worker-progress/worker-108-react-dom-root-facade-implementation-plan.md`

## Current State

- `packages/react-dom/client.js` currently exports loud placeholders for
  `createRoot`, `hydrateRoot`, and `version`.
- `packages/react-dom/profiling.js` currently exports loud placeholders for
  `createRoot`, `hydrateRoot`, `flushSync`, portals, resource APIs, form APIs,
  batching, private internals, and `version`.
- `packages/react-dom/client.react-server.js` and
  `packages/react-dom/profiling.react-server.js` already throw the unsupported
  React Server Components entrypoint errors.
- There is no `packages/react-dom/src/**` implementation tree yet.
- `crates/fast-react-core` has React 19.2.6 lane bitsets and `LaneMap<T>`, but
  no root lane bookkeeping or event priority type in this worktree.
- `crates/fast-react-reconciler` still exposes placeholder render/scheduler
  APIs and has no `FiberRoot`, HostRoot fiber, HostRoot update queue, root
  scheduler, work loop, commit traversal, hydration root state, or public bridge
  API.
- `crates/fast-react-host-config` has token-aware host boundaries, commit hooks,
  `HostScheduling`, `HydrationHost`, `PortalHost`, and `MutationRenderer`
  traits, but no DOM adapter or reconciler-issued token registry.
- Completed local reports and oracles for workers 046, 049, 088, and 089 are
  absent. Any dependency on their expected client-root, hydration-marker,
  container-marker, or listener-installation evidence is provisional.

## Evidence Gathered

Required coordination files:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`

Merged worker evidence:

- Worker 033, `worker-progress/worker-033-react-dom-inventory.md`:
  `react-dom/client` exports only `createRoot`, `hydrateRoot`, and `version`;
  client roots require reconciler roots, lane/update semantics, DOM mutation
  host operations, event setup, and hydration infrastructure.
- Worker 036, `worker-progress/worker-036-react-dom-export-oracle.md` and
  `tests/conformance/oracles/react-19.2.6-react-dom-export-oracle.json`:
  export keys, descriptors, condition branches, CJS/ESM interop, and blocked
  physical subpaths are locked. This is export evidence only, not root behavior
  evidence.
- Worker 044, `worker-progress/worker-044-react-dom-client-roots-plan.md`:
  `createRoot` creates a concurrent root, marks the container, installs
  delegated listeners, and returns a small root object. `root.render` calls
  `updateContainer`; `root.unmount` calls `updateContainerSync(null)`, flushes
  sync work, then unmarks.
- Worker 055, `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`:
  the public facade should come after root lanes, `FiberRoot`, HostRoot queues,
  scheduler, commit/token work, DOM markers/listeners/maps, and DOM mutation
  host behavior.
- Worker 058, `worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md`
  and `tests/conformance/oracles/react-19.2.6-react-dom-flush-sync-batching-oracle.json`:
  public `flushSync`/`unstable_batchedUpdates` callback behavior, export shape,
  errors, nesting, and RSC boundaries are oracle-covered; root scheduling,
  lanes, cross-root flushing, and DOM commit timing are not covered.
- Worker 079, `worker-progress/worker-079-reconciler-fiber-root-model-plan.md`:
  `FiberRoot` and HostRoot records must be internal reconciler data with root
  tags/kinds, opaque containers, HostRoot current/alternate wiring, structured
  root options, lifecycle state, scheduler handles, and typed JS callback
  handles.
- Worker 080, `worker-progress/worker-080-reconciler-host-root-update-queue-plan.md`:
  HostRoot updates must use circular pending queues and base queue rebasing.
  `root.render` becomes `{element: children}`; unmount becomes
  `{element: null}` at `SyncLane`; enqueueing must not flush or mutate DOM.
- Worker 090, `worker-progress/worker-090-dom-node-map-public-instance-plan.md`:
  DOM node metadata belongs to DOM-owned maps keyed by reconciler-issued opaque
  host tokens. Required maps include node-to-token, latest props,
  container-to-root marker, listener marker, token-to-node, and hydration
  boundary maps.
- Worker 092, `worker-progress/worker-092-react-dom-create-root-facade-plan.md`:
  `createRoot` facade behavior must wait for client-root and marker/listener
  oracles, root scheduler, DOM mutation, and JS callback rooting. The public
  non-hydration root has one own `_internalRoot`, prototype `render` and
  `unmount`, and no `unstable_scheduleHydration`.
- Worker 093, `worker-progress/worker-093-root-render-integration-plan.md`:
  `root.render(children)` returns `undefined`, warns for unsupported second
  arguments in development, throws after unmount, and delegates to
  `updateContainer(children, root, null, null)`.
- Worker 094, `worker-progress/worker-094-root-unmount-flushsync-plan.md`:
  `root.unmount()` must clear `_internalRoot` before user-code reentry can
  observe the root, enqueue a sync null HostRoot update, call cross-root
  `flushSyncWork`, and unmark the container after the flush returns.
- Worker 095, `worker-progress/worker-095-hydrate-root-facade-plan.md`:
  `hydrateRoot` is a distinct hydration root path, not
  `createRoot({ hydrate: true })`. It needs required initial children,
  `formState`, hydration callbacks, dehydrated HostRoot state, special initial
  hydration scheduling, immediate listeners, and `unstable_scheduleHydration`.

Provisional or absent evidence:

- Worker 046 client-root public behavior oracle is absent locally.
- Worker 049 hydration marker oracle is absent locally.
- Worker 088 DOM container/root marker oracle is absent locally.
- Worker 089 DOM root listener installation oracle is absent locally.
- Prompt-only files for those workers are not treated as completed evidence.

Delegated checks:

- Read-only explorer `019e0ef5-8578-7cb2-9a1c-b98cf2198358` checked the
  dependency report/oracle presence. It confirmed the required merged reports
  listed above are present, and confirmed workers 046, 049, 088, and 089 have
  no completed local reports or checked oracle artifacts. It also summarized
  the same root-cause constraints used by this report.
- Read-only explorer `019e0ef5-905f-7e41-92a0-d1640426c8c3` inspected the
  source/test layout relevant to the facade. It confirmed `packages/react-dom`
  currently contains package-surface placeholders only,
  `tests/smoke/import-entrypoints.mjs` covers placeholder imports and RSC
  branches, no dedicated local client-root/root-marker/root-listener/
  hydrate-root oracle files are present, and Rust has lanes/host traits but no
  reconciler root or native root bridge implementation.

## Root-Cause Invariants

These invariants should be treated as implementation gates. Breaking existing
placeholder shape is acceptable when it is required to preserve them.

1. The public root object is not a renderer. It is a JavaScript handle over an
   internal reconciler root.
2. Public root methods never perform DOM child mutation directly. DOM changes
   happen only during reconciler commit through host-config/DOM adapter
   operations.
3. `root.render` is an enqueue operation. It delegates to `update_container`
   and returns `undefined`.
4. `root.unmount` is an enqueue plus flush boundary. It clears the public
   `_internalRoot`, enqueues a sync `{element: null}` HostRoot update, asks the
   root scheduler to flush sync work across roots, and only then clears the DOM
   root marker.
5. `hydrateRoot` is not an option flag on `createRoot`. It creates a hydration
   root with dehydrated HostRoot state and hydration-specific scheduling.
6. DOM markers, listener markers, latest props, node-to-token maps, and
   hydration boundary maps are DOM adapter state. The Rust core must not store
   DOM nodes or private DOM marker names.
7. Reconciler roots store typed handles for JS values and callbacks, not raw JS
   values or background-callable closures.
8. Stable React DOM 19.2.6 published behavior wins over source-only options.
   Transition callbacks and default transition indicators remain feature-gated
   until a checked oracle proves observable published behavior.

## Future Source File Plan

### Public facade modules

Future implementation should introduce a shared client-root source tree:

- `packages/react-dom/client.js`
  - export `createRoot`, `hydrateRoot`, and `version`
  - import shared facade modules instead of defining placeholders inline
- `packages/react-dom/profiling.js`
  - re-export the same `createRoot` and `hydrateRoot` facade functions as the
    client entrypoint
  - share `flushSync` once root scheduler integration exists
- `packages/react-dom/src/client/create-root.js`
  - public `createRoot(container, options)` wrapper
  - container validation call
  - development warnings for legacy/duplicate roots and option misuse
  - private bridge call to create a concurrent root
  - marker/listener helper calls after root creation succeeds
- `packages/react-dom/src/client/hydrate-root.js`
  - public `hydrateRoot(container, initialChildren, options)` wrapper
  - required initial-children warning behavior
  - `formState` and hydration callback ingestion
  - private bridge call to create a hydration root
  - marker/listener helper calls after root creation succeeds
- `packages/react-dom/src/client/root-object.js`
  - shared `ReactDOMRoot` constructor and `render`/`unmount` methods
  - own `_internalRoot` slot
  - no hydration-specific method
- `packages/react-dom/src/client/hydration-root-object.js`
  - `ReactDOMHydrationRoot` constructor sharing `render` and `unmount`
  - `unstable_scheduleHydration(target)` wrapper
- `packages/react-dom/src/client/root-options.js`
  - parse and normalize root options
  - keep validation aligned to observed React DOM behavior
  - convert callbacks to bridge-owned rooted handles
- `packages/react-dom/src/client/root-errors.js`
  - centralize public root error/warning text and dev-only diagnostics
- `packages/react-dom/src/client/root-bridge.js`
  - private JS boundary to future native/reconciler root APIs
  - no public exports
  - no DOM mutation helpers

### DOM adapter helper modules

The facade should call these helpers, but ownership belongs to DOM adapter
slices, not to `create-root.js` itself:

- `packages/react-dom/src/client/dom-container.js`
  - `isValidContainer(container)`
  - comment-container feature gate, if supported
  - invalid-container public error generation
- `packages/react-dom/src/client/root-markers.js`
  - `markContainerAsRoot(rootToken, container)`
  - `unmarkContainerAsRoot(container)`
  - `isContainerMarkedAsRoot(container)`
  - duplicate-root and legacy-root warning support
- `packages/react-dom/src/client/dom-component-tree.js`
  - node-to-token and container root lookup helpers
  - closest-instance lookup for events and hydration blockers
- `packages/react-dom/src/client/node-maps.js`
  - node-to-token, token-to-node, and latest-props map storage
  - cleanup hooks for deletion/unmount
- `packages/react-dom/src/events/root-listeners.js`
  - `listenToAllSupportedEvents(rootContainerElement)`
  - listener marker dedupe for root and portal targets
  - owner-document `selectionchange` installation
- `packages/react-dom/src/events/event-names.js`
  - supported delegated/non-delegated event name data

These modules should not implement event plugin dispatch, controlled form
restore, resource dispatch, or hydration replay in this facade slice.

### Reconciler and bridge APIs the facade should call

The JS facade should call a narrow private bridge whose eventual Rust/native
implementation maps to these reconciler APIs:

- `create_container(containerHandle, RootTag::Concurrent, RootKind::Client,
  RootOptions) -> InternalRootHandle`
- `create_hydration_container(containerHandle, initialChildrenHandle,
  RootOptions, HydrationOptions) -> InternalRootHandle`
- `update_container(rootHandle, childrenHandle, parentComponentHandle,
  callbackHandle) -> Lane`
- `update_container_sync(rootHandle, noneElementHandle, parentComponentHandle,
  callbackHandle) -> Lane`
- `flush_sync_work() -> FlushSyncResult`
- `is_rendering_or_committing() -> bool`
- `dispose_root_handle(rootHandle)` after terminal unmount/disposal
- `queue_explicit_hydration_target(targetHandle)` or a DOM replay hook called
  by `unstable_scheduleHydration`

Expected future Rust/source files:

- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-core/src/event_priority.rs`
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/update_priority.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/work_loop.rs`
- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/hydration.rs`
- `crates/fast-react-napi/src/root.rs`
- `bindings/node/index.cjs`
- `bindings/node/index.mjs`

The bridge can remain a loud private unsupported module until the native/root
APIs exist. It should not fake behavior by mutating DOM from JavaScript.

## `createRoot` Implementation Plan

Target behavior:

1. Export shape remains aligned with worker 036: `createRoot.length === 2`,
   export is a writable/configurable/enumerable data property, and
   `react-server` condition branches keep throwing before any root code runs.
2. Validate the container before allocating internal root state or writing DOM
   markers. Invalid containers throw `Target container is not a DOM element.`
3. In development, warn for:
   - legacy `_reactRootContainer` usage
   - duplicate `createRoot` on a marked container
   - `options.hydrate` misuse, directing users to `hydrateRoot`
   - React-element-as-options misuse
4. Parse only stable published options:
   - `unstable_strictMode === true`
   - `identifierPrefix`, defaulting to `""`
   - `onUncaughtError`
   - `onCaughtError`
   - `onRecoverableError`
5. Convert user callbacks to root-owned bridge handles with explicit disposal
   policy. Do not store raw callback functions in Rust root records.
6. Call the private bridge equivalent of `create_container` for a concurrent
   client root.
7. Mark the container as a root only after internal root creation succeeds.
8. Install root listeners with the marker-deduped root listener helper. This is
   listener installation only, not event dispatch.
9. Return a `ReactDOMRoot` object.

Do not clear the container, append children, insert DOM nodes, set text
content, attach refs, dispatch events, or process resources in this function.

## `hydrateRoot` Implementation Plan

Target behavior:

1. Export shape remains aligned with worker 036: `hydrateRoot.length === 3`,
   export descriptor matches the checked oracle, and RSC branches throw.
2. Validate the container before root allocation, marker writes, or listener
   installation.
3. Warn in development when `initialChildren === undefined`, after a checked
   public oracle locks exact continuation behavior.
4. Parse shared root options plus hydration-specific fields:
   - `unstable_strictMode`
   - `identifierPrefix`
   - `onUncaughtError`
   - `onCaughtError`
   - `onRecoverableError`
   - hydration callbacks carried by the options object
   - `formState`
5. Call the private bridge equivalent of `create_hydration_container`, not
   `create_container`.
6. The internal root must be `RootKind::Hydration` or equivalent with
   HostRoot state containing `element`, `is_dehydrated: true`, and cache/form
   placeholders.
7. Initial hydration scheduling must use the reconciler hydration path, not a
   normal HostRoot `{element}` update.
8. Mark the container and install root listeners immediately after root
   creation succeeds.
9. Return a `ReactDOMHydrationRoot` object with shared `render`/`unmount` and
   hydration-only `unstable_scheduleHydration`.

Keep real DOM hydration matching, Fizz marker parsing, mismatch diagnostics,
event replay, controlled forms, form action replay, and resources in their own
future slices. `hydrateRoot` should remain unsupported or guarded until those
dependencies exist; it must not silently client-render server markup.

## Root Object Shape

`ReactDOMRoot`:

- own `_internalRoot` slot
- prototype `constructor`, `render`, and `unmount`
- no `unstable_scheduleHydration`
- public methods return `undefined`

`ReactDOMHydrationRoot`:

- own `_internalRoot` slot
- shared `render` and `unmount` method implementation
- prototype `unstable_scheduleHydration`
- public methods return `undefined`

The implementation should use constructors/prototypes instead of ad hoc object
literals if descriptor/oracle evidence requires it. Public tests should verify
own keys, prototype keys, method names/lengths, descriptors, return values, and
hydration method presence/absence.

## `root.render`

Implementation sequence:

1. Read `const root = this._internalRoot`.
2. If `root === null`, throw `Cannot update an unmounted root.`
3. In development, warn for a second argument with React-compatible distinctions
   for callback, container-like value, and other defined values.
4. Convert `children` to a rooted element/value handle for the bridge.
5. Call `update_container(root, childrenHandle, null, null)` through the
   private bridge.
6. Return `undefined`.

The method must not touch `container.textContent`, `innerHTML`, child lists,
node maps, latest props, refs, or event handlers. It should not return a lane,
root object, promise, update handle, or scheduler handle.

## `root.unmount`

Implementation sequence:

1. In development, warn when a function callback argument is supplied.
2. Read `const root = this._internalRoot`.
3. If `root === null`, return `undefined`.
4. Set `this._internalRoot = null` before any scheduler or user-code reentry
   can run.
5. Read the root container through the internal root handle.
6. In development, ask the bridge whether the reconciler is already rendering
   or committing and emit the React-compatible warning if needed.
7. Call `update_container_sync(root, noneElementHandle, null, null)` through the
   bridge so the HostRoot update payload is `{element: null}` at `SyncLane`.
8. Call `flush_sync_work()` through the bridge. This must flush sync work across
   all roots when outside render/commit.
9. Call `unmarkContainerAsRoot(container)` only after the flush returns.
10. Dispose public callback/root handles once the root reaches a terminal
    internal lifecycle state.
11. Return `undefined`.

A second `root.unmount()` call is an idempotent no-op returning `undefined`.
Unmarking before the sync null update commits is a root-cause bug; clearing
`_internalRoot` after enqueue/flush is also a root-cause bug.

## Option Validation And Callback Ownership

Option validation should be observation-driven:

- Do not add eager type checks unless React DOM 19.2.6 throws or warns
  observably.
- Preserve development-only warnings for `createRoot(..., { hydrate: true })`
  and React-element options misuse.
- Treat source-only transition callbacks/default indicators as feature-gated
  and inert until an oracle proves published 19.2.6 behavior.
- `formState` belongs to `hydrateRoot` only and must not activate hydration
  behavior when passed to `createRoot`.
- Invalid callback values should be handled at the JS/native boundary according
  to public observations; Rust root records receive typed callback handles only.

Callback handles:

- Root error callbacks are root-owned and disposed on terminal unmount/disposal.
- Reconciler error delivery should call `onUncaughtError`, `onCaughtError`, and
  `onRecoverableError` from commit/error handling, not from facade wrappers.
- Callback failures must use reconciler error/rethrow policy, not an ad hoc
  facade `console.error`.
- Native/Rust code must not call user JS from background threads.

## Marker Ownership

Container/root markers are DOM adapter state:

- invalid containers fail before any marker/listener/root side effect
- successful root creation writes a container root marker after internal root
  creation succeeds
- duplicate-root warnings read DOM-owned marker state
- unmount clears the root marker after sync null update flushing
- listener marker dedupe is separate from root marker ownership
- node-to-token/latest-props maps are cleaned during deletion/unmount commit

The marker value should be an opaque internal root or HostRoot token that can be
validated by the reconciler. It must not expose raw fibers, Rust pointer values,
or stable public IDs. If `WeakMap` cannot represent a marker needed for exact
React behavior, private expandos may store only lightweight opaque IDs, never
owning callbacks or fiber objects.

Worker 088 and worker 089 are absent locally, so exact marker/listener behavior
must be considered provisional until their oracles are merged or regenerated.

## Public Behavior Gates

No compatibility claim should be made for this slice until all relevant gates
are green.

Required checked oracles:

- React DOM export oracle from worker 036 remains green.
- Client-root public behavior oracle, provisional worker 046:
  - `tests/conformance/src/react-dom-client-root-*.mjs`
  - `tests/conformance/scripts/*react-dom-client-root*.mjs`
  - `tests/conformance/test/react-dom-client-root-oracle.test.mjs`
  - `tests/conformance/oracles/react-19.2.6-react-dom-client-root-oracle.json`
- Container/root marker oracle, provisional worker 088:
  - `tests/conformance/src/react-dom-container-root-markers-*.mjs`
  - `tests/conformance/scripts/*react-dom-container-root-markers*.mjs`
  - `tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`
  - `tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json`
- Root listener installation oracle, provisional worker 089:
  - `tests/conformance/src/react-dom-root-listener-installation-*.mjs`
  - `tests/conformance/scripts/*react-dom-root-listener-installation*.mjs`
  - `tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
  - `tests/conformance/oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json`
- Hydrate-root public oracle:
  - `tests/conformance/src/react-dom-hydrate-root-*.mjs`
  - `tests/conformance/scripts/*react-dom-hydrate-root*.mjs`
  - `tests/conformance/test/react-dom-hydrate-root-oracle.test.mjs`
  - `tests/conformance/oracles/react-19.2.6-react-dom-hydrate-root-oracle.json`
- Hydration marker oracle, provisional worker 049:
  - `tests/conformance/src/react-dom-hydration-marker-*.mjs`
  - `tests/conformance/scripts/*react-dom-hydration-marker*.mjs`
  - `tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
  - `tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json`
- FlushSync/batching oracle from worker 058 remains green before shared
  `flushSync` integration is exposed.

Required smoke/Fast React tests after implementation:

- `tests/smoke/react-dom-client-root.mjs`
  - imports `@fast-react/react-dom/client`
  - verifies export availability, function lengths, RSC branch preservation via
    existing import-entrypoint patterns, and placeholder removal only when real
    behavior exists
- `tests/smoke/react-dom-root-facade.mjs`
  - validates basic `createRoot` invalid container throw, root object shape
    using a controlled DOM fixture, and no direct DOM mutation before a commit
    API is invoked
- `tests/smoke/react-dom-hydrate-root.mjs`
  - validates `hydrateRoot` export shape, invalid container throw, and
    hydration root object method presence once hydration root state exists
- `tests/conformance/src/react-dom-root-facade-fast-*.mjs`
  - dual-run Fast React comparisons against the client-root oracle
- `tests/conformance/src/react-dom-hydrate-root-fast-*.mjs`
  - dual-run Fast React comparisons against the hydrate-root oracle

Required Rust checks after implementation workers touch root internals:

```sh
cargo fmt --all --check
cargo test -p fast-react-core --all-features
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
```

Required JS checks after facade implementation:

```sh
npm run check:js
npm test --workspace @fast-react/conformance
node tests/smoke/react-dom-client-root.mjs
node tests/smoke/react-dom-root-facade.mjs
node tests/smoke/react-dom-hydrate-root.mjs
```

## Blockers Before Compatibility Claims

- Worker 046 client-root oracle is absent locally.
- Worker 088 container/root marker oracle is absent locally.
- Worker 089 root listener oracle is absent locally.
- Worker 049 hydration marker oracle is absent locally.
- No `RootLaneState`, event priority primitive, or root lane algorithms exist.
- No reconciler `FiberRoot`, HostRoot fiber, root lifecycle state, or root
  option/callback handle model exists.
- No HostRoot update queue or `update_container` / `update_container_sync`
  APIs exist.
- No root scheduler, microtask scheduling, cross-root `flush_sync_work`, act
  routing, or render/commit reentrancy guards exist.
- No work loop or commit traversal exists to process HostRoot updates, switch
  `root.current`, run callbacks/refs/effects, or call host mutation operations.
- No DOM adapter implementation exists for container validation, root markers,
  node maps, latest props, listener dedupe, or root listener installation.
- No minimal DOM mutation host exists to commit a rendered tree.
- No JS/native callback rooting/disposal policy exists for root options,
  elements, callbacks, refs, recoverable errors, or hydration callbacks.
- No hydration root state, hydratable marker parser, mismatch handling, or event
  replay hooks exist.

Until these blockers are resolved, `createRoot` and `hydrateRoot` should remain
loud unsupported placeholders or guarded partial behavior with compatibility
claims kept false.

## Out Of Scope For This Facade Slice

Keep these separate even if nearby files are introduced:

- DOM mutation host creation, diffing, insertion, deletion, text updates, style
  updates, and `dangerouslySetInnerHTML`
- event plugin dispatch, propagation, batching restore, controlled form restore,
  and native event replay
- controlled inputs/selects/textareas and form action behavior
- resource hint dispatchers, preinit/preload/preconnect behavior, hoistables,
  singletons, and view transitions
- portal object creation and portal commit/event bubbling behavior
- Fizz/server/static rendering, marker production, postponed state, resume, and
  stream adapters
- real hydration matching, mismatch repair/client fallback, Suspense/Activity
  boundary parsing, and form marker replay

The facade may call marker/listener/root bridge helpers, but those helpers must
remain thin and evidence-gated.

## Recommended Implementation Sequence

1. Merge or regenerate worker 046, 088, 089, and hydrate-root public oracles.
   Consume worker 049 if hydration markers land first.
2. Implement core `root_lanes.rs` and `event_priority.rs`.
3. Implement reconciler root config, `FiberRoot`, HostRoot current fiber, root
   lifecycle state, callback handle placeholders, and root options.
4. Implement HostRoot update queues plus `update_container` and
   `update_container_sync`; prove they do not mutate host containers.
5. Implement root scheduler and `flush_sync_work` with cross-root flushing and
   render/commit reentrancy guards.
6. Implement work-loop/commit skeleton, host token generation, `root.current`
   switch timing, callback/ref/effect hooks, and deletion cleanup hooks.
7. Implement DOM container validation, root markers, node maps/latest props,
   listener markers, and root listener installation. Do not implement dispatch.
8. Implement the minimal DOM mutation host in its own slice.
9. Wire `createRoot` and `ReactDOMRoot` to private bridge APIs. Keep
   `hydrateRoot` guarded if hydration root state is still missing.
10. Wire `root.render` through `update_container` and `root.unmount` through
    `update_container_sync` plus `flush_sync_work`.
11. Wire `hydrateRoot` only after hydration root state, marker parsing, and
    replay hooks exist.
12. Align `react-dom/profiling` with the same shared facade modules.

## Risks Or Blockers

- The facade can easily look correct while bypassing the reconciler. Tests must
  prove no DOM mutation occurs until scheduled root work commits.
- Marker/listener oracles are absent, so exact duplicate-root warning text,
  mark/unmark order, passive listener flags, and `selectionchange` installation
  are provisional.
- Hydration public shape can be partially implemented before real matching is
  ready. That should stay guarded to avoid false hydration compatibility.
- Callback rooting across JS/Rust is unresolved and can leak callbacks or call
  disposed values after unmount if rushed.
- A per-root `flushSync` shortcut would pass small examples but diverge from
  React's cross-root sync flushing.
- Stable published 19.2.6 behavior differs from some source-only options; do
  not ship source-only options without oracle proof.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan keeps root facade behavior tied to checked React DOM public evidence
  and explicitly labels missing oracles as provisional.
- It rejects direct DOM mutation from public root methods, addressing the
  architectural root cause rather than hiding missing reconciler behavior.

Maintainability:

- Public facade modules, DOM marker/listener helpers, node maps, reconciler
  root APIs, scheduler, commit, DOM mutation, and hydration replay are separated
  into future write scopes with clear ownership.
- Shared `root-object.js` avoids divergent `render`/`unmount` behavior between
  normal and hydration roots.

Performance:

- Lane bitsets and `LaneMap<T>` remain on hot scheduling paths.
- Delegated listener installation and node-keyed maps avoid per-node listener
  churn and fiber-tree scans in event target lookup.
- The plan preserves Scheduler callback reuse/cancellation and cross-root sync
  flushing instead of per-root timers.

Security:

- DOM writes stay in structured host operations, not facade-level HTML string
  construction.
- Opaque tokens avoid exposing raw fibers, native pointers, or reusable root IDs
  through DOM markers.
- Latest props and callback handles must be cleared/disposed on deletion and
  unmount to avoid retaining user callbacks, form actions, or sensitive state.
- Hydration marker parsing and event replay are kept separate because they are
  security-sensitive and require dedicated validation.

## Commands Run

Tool actions:

- `create_goal` for the worker objective.
- `get_goal` immediately after setup.
- Spawned read-only explorer `019e0ef5-8578-7cb2-9a1c-b98cf2198358`.
- Spawned read-only explorer `019e0ef5-905f-7e41-92a0-d1640426c8c3`.
- `wait_agent` for explorer `019e0ef5-905f-7e41-92a0-d1640426c8c3`.
- `apply_patch` to add this report.
- `apply_patch` to incorporate completed delegated-check and verification
  results.

Shell commands:

```sh
pwd && ls
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files worker-progress | sort
rg --files tests/conformance | sort
rg --files packages/react-dom packages/react tests/smoke crates bindings | sort
git status --short
rg -n "createRoot|hydrateRoot|root|render\\(|unmount|marker|container|option|flushSync|updateContainer|FiberRoot|HostRoot" worker-progress/worker-033-react-dom-inventory.md worker-progress/worker-036-react-dom-export-oracle.md worker-progress/worker-044-react-dom-client-roots-plan.md worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
rg -n "createRoot|hydrateRoot|root|render\\(|unmount|marker|container|option|flushSync|updateContainer|FiberRoot|HostRoot" worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md worker-progress/worker-079-reconciler-fiber-root-model-plan.md worker-progress/worker-080-reconciler-host-root-update-queue-plan.md worker-progress/worker-090-dom-node-map-public-instance-plan.md
rg -n "createRoot|hydrateRoot|root|render\\(|unmount|marker|container|option|flushSync|updateContainer|FiberRoot|HostRoot" worker-progress/worker-092-react-dom-create-root-facade-plan.md worker-progress/worker-093-root-render-integration-plan.md worker-progress/worker-094-root-unmount-flushsync-plan.md worker-progress/worker-095-hydrate-root-facade-plan.md
sed -n '1,240p' packages/react-dom/client.js
sed -n '1,240p' packages/react-dom/index.js
sed -n '1,260p' packages/react-dom/placeholder-utils.js
sed -n '1,260p' worker-progress/worker-092-react-dom-create-root-facade-plan.md
sed -n '260,620p' worker-progress/worker-092-react-dom-create-root-facade-plan.md
sed -n '1,300p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '300,620p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '1,260p' worker-progress/worker-095-hydrate-root-facade-plan.md
sed -n '260,540p' worker-progress/worker-095-hydrate-root-facade-plan.md
sed -n '1,300p' worker-progress/worker-090-dom-node-map-public-instance-plan.md
sed -n '300,560p' worker-progress/worker-090-dom-node-map-public-instance-plan.md
sed -n '1,220p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,220p' worker-progress/worker-036-react-dom-export-oracle.md
sed -n '1,180p' worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md
sed -n '1,260p' packages/react-dom/package.json
sed -n '1,240p' packages/react-dom/profiling.js
sed -n '1,140p' packages/react-dom/client.react-server.js
sed -n '1,140p' packages/react-dom/profiling.react-server.js
sed -n '1,260p' crates/fast-react-core/src/lib.rs
sed -n '1,260p' crates/fast-react-core/src/lane.rs
sed -n '1,320p' crates/fast-react-reconciler/src/lib.rs
rg -n "HostFiberToken|HydrationHost|HostScheduling|MutationRenderer|PortalHost|Root|root|detach_deleted_instance|prepare_for_commit|reset_after_commit" crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' tests/conformance/src/react-dom-flush-sync-batching-scenarios.mjs
sed -n '1,260p' tests/conformance/test/react-dom-export-oracle.test.mjs
sed -n '150,460p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '460,700p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '217,380p' worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
sed -n '380,470p' worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
test -e worker-progress/worker-108-react-dom-root-facade-implementation-plan.md && sed -n '1,260p' worker-progress/worker-108-react-dom-root-facade-implementation-plan.md || true
git diff --check --no-index /dev/null worker-progress/worker-108-react-dom-root-facade-implementation-plan.md; rc=$?; if [ "$rc" -gt 1 ]; then exit "$rc"; fi; exit 0
perl -ne 'print "$ARGV:$.: trailing whitespace\n" if /[ \t]$/' worker-progress/worker-108-react-dom-root-facade-implementation-plan.md
rg -n '(/[U]sers/|/[p]rivate/var|/var/[f]olders|/[t]mp/|<{7}|={7}|>{7})' worker-progress/worker-108-react-dom-root-facade-implementation-plan.md
node --test tests/conformance/test/react-dom-export-oracle.test.mjs
node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs
```

## Verification Results

- `git status --short` showed only
  `?? worker-progress/worker-108-react-dom-root-facade-implementation-plan.md`.
- Scoped `git diff --check --no-index /dev/null
  worker-progress/worker-108-react-dom-root-facade-implementation-plan.md`
  returned clean after normalizing the expected no-index status.
- Scoped trailing-whitespace check over this report returned no output.
- Scoped local/temp path and conflict-marker scan over this report returned no
  matches. `rg` exited with status 1 because no matches were found.
- `node --test tests/conformance/test/react-dom-export-oracle.test.mjs` passed:
  10 tests passed.
- `node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`
  passed: 12 tests passed.

No source tests are required by the objective because this worker changes only
the scoped report. The two targeted conformance tests are useful evidence that
the checked export and `flushSync` oracles this plan references still pass; they
do not prove root facade compatibility.

## Completion Audit

Objective restated as concrete success criteria:

- Produce a report-only implementation plan for the React DOM root facade slice.
- Write only `worker-progress/worker-108-react-dom-root-facade-implementation-plan.md`.
- Cover `createRoot`, `hydrateRoot`, public root object shape, `render`,
  `unmount`, option validation, marker ownership, and bridge calls to future
  reconciler/root APIs without direct DOM mutation.
- Anchor the plan in workers 033, 036, 044, 055, 058, 079, 080, 088 if
  present, 090, 092, 093, 094, and 095.
- Treat workers 046, 049, 088, and 089 as provisional unless their reports or
  oracles are present.
- Keep this facade slice separate from DOM mutation host implementation, event
  dispatch, controlled forms, resources, Fizz, and real hydration matching.
- Specify exact future source files, public behavior gates, smoke/conformance
  tests, and blockers before compatibility claims.
- Summarize delegated checks.
- Include changed files, commands run, evidence, risks/blockers, recommended
  next tasks, and quality/maintainability/performance/security review.

Prompt-to-artifact checklist:

| Requirement | Evidence |
| --- | --- |
| First action used `create_goal` | Recorded in `Goal Tool Status`; tool call was made before file reads. |
| `get_goal` status/objective recorded | Recorded in `Goal Tool Status`. |
| Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md` | Listed in `Evidence Gathered` and `Commands Run`. |
| Did not read `ORCHESTRATOR.md` | Not listed in commands; no evidence is taken from it. |
| Write scope limited to worker 108 report | `Changed Files` lists only this report; `Verification Results` records `git status --short` showing only this report. |
| Report-only, no source implementation | `Summary` and `Changed Files`; no source file is listed as changed. |
| Cover `createRoot` | `createRoot Implementation Plan`. |
| Cover `hydrateRoot` | `hydrateRoot Implementation Plan`. |
| Cover root object shape | `Root Object Shape`. |
| Cover `render` | `root.render`. |
| Cover `unmount` | `root.unmount`. |
| Cover option validation | `Option Validation And Callback Ownership`. |
| Cover marker ownership | `Marker Ownership`. |
| JS facade calls future root APIs, no direct DOM mutation | `Future Source File Plan`, `Reconciler and bridge APIs`, and root method sections. |
| Anchor workers 033, 036, 044, 055, 058, 079, 080, 090, 092, 093, 094, 095 | `Evidence Gathered` has one entry for each. |
| Anchor 088 if present | `Evidence Gathered` and provisional sections state worker 088 is absent. |
| Treat 046, 049, 088, 089 as provisional unless present | `Provisional or absent evidence`, `Public Behavior Gates`, and blockers. |
| Keep separate from DOM mutation, events, forms, resources, Fizz, real hydration matching | `Out Of Scope For This Facade Slice`. |
| Exact future source files | `Future Source File Plan`. |
| Public API behavior gates | `Public Behavior Gates`. |
| Smoke/conformance tests | `Public Behavior Gates`. |
| Blockers before compatibility claims | `Blockers Before Compatibility Claims`. |
| Use/summarize subagents | `Delegated checks` records both explorers and their results. |
| Quality/maintainability/performance/security review | Dedicated review section. |
| Commands run | `Commands Run`. |
| Changed files | `Changed Files`. |
| Risks/follow-ups | `Risks Or Blockers` and `Recommended Implementation Sequence`. |

Audit result:

- All explicit worker requirements are covered by this report.
- No source files were modified.
- The only worktree change is the scoped worker report.
- The report hygiene checks and targeted oracle tests passed.
- No uncovered requirement remains for this report-only objective.
