# Worker 135: React DOM Root Bridge Refresh

## Goal Evidence

- `create_goal` called first with objective: "Produce a report-only refresh for wiring `react-dom/client` root facade calls to shared reconciler root/update/scheduler APIs, writing only `worker-progress/worker-135-react-dom-root-bridge-refresh.md`."
- `get_goal` confirmed status `active` for the same objective.
- Goal thread id: `019e0f9e-460b-7561-bdf3-67c3b6f83be4`.

## Summary

This is a report-only refresh. No source, tests, package metadata, prompts,
master docs, or lockfiles were modified.

The next `react-dom/client` root facade slice should wire public JS calls to
the shared reconciler root/update/scheduler APIs only after the internal root
path can actually render and commit. The current repo is closer than the older
facade plans assumed: root lane bookkeeping, event priority primitives,
`FiberRoot`/HostRoot records, `update_container`, `update_container_sync`, the
HostRoot update queue, a scheduled-root/scheduler bridge foundation, and the
private React DOM container/listener shell all exist. The public
`packages/react-dom/client.js` entrypoint still correctly exposes loud
placeholders because there is still no native/N-API root bridge, no real root
work loop, no commit traversal, no DOM mutation adapter wired to roots, and no
cross-root `flushSyncWork` execution.

Implementation should therefore land as a thin JS facade and private bridge
consumer, not as a DOM mutation shortcut. `createRoot` creates an internal
concurrent root, marks the container, installs root listeners, and returns a
React-shaped public root object. `root.render` enqueues an `{element}` HostRoot
update and then schedules the root. `root.unmount` nulls the public root slot,
enqueues a sync null HostRoot update, schedules and flushes sync work across
roots, then unmarks the container. Hydration remains a hard unsupported
boundary for this slice.

## Changed Files

- `worker-progress/worker-135-react-dom-root-bridge-refresh.md`

## Current State

- `packages/react-dom/client.js` still exports placeholder `createRoot`,
  `hydrateRoot`, and `version`.
- `packages/react-dom/profiling.js` still exports placeholder `createRoot`,
  `hydrateRoot`, and `flushSync`; it should share the same facade modules only
  after the normal client root path is real.
- `packages/react-dom/src/client/dom-container.js` and
  `packages/react-dom/src/client/root-markers.js` now provide private
  container validation, invalid-container errors, randomized root marker
  storage, duplicate-root warning helpers, and unmarking.
- `packages/react-dom/src/events/root-listeners.js` now provides private root
  and portal listener installation shell behavior with listener-marker dedupe,
  85 event names, non-delegated capture-only handling, passive wheel/touch
  options, and owner-document `selectionchange`.
- `crates/fast-react-core` now has lane-backed event priorities and root lane
  state, including pending/suspended/pinged/expired/entangled lanes,
  transition/retry lane claimers, lane maps, and stable React 19.2.6 feature
  gates.
- `crates/fast-react-reconciler` now has `FiberRootStore::create_client_root`,
  `RootOptions`, `RootElementHandle`, `update_container`,
  `update_container_sync`, `ensure_root_is_scheduled`,
  `process_root_schedule_in_microtask`, and `collect_sync_flush_plan`.
- The reconciler APIs remain internal data foundations. They do not render,
  commit, flush sync work, process HostRoot queues into a finished tree, mutate
  host containers, run effects/refs, switch `root.current`, or call JS
  callbacks.
- `bindings/node` and `crates/fast-react-napi` are still native loader
  placeholders. `loadNativeBinding()` remains deliberately unavailable and no
  root bridge exports exist.

## Facade Sequencing

Once the internal root path is ready, wire `createRoot(container, options)` in
this order:

1. Validate `container` with the DOM container helper. Invalid containers must
   throw before allocating a root, writing markers, or installing listeners.
2. In development, emit duplicate-root or legacy-root warnings from
   DOM-owned marker state. These warnings must not prevent root creation.
3. Parse stable React DOM 19.2.6 options into a bridge `RootOptions` payload:
   `unstable_strictMode === true`, `identifierPrefix`, `onUncaughtError`,
   `onCaughtError`, and `onRecoverableError`.
4. Keep source-only transition callbacks/default indicator behavior inert
   unless a checked published-package oracle later proves otherwise.
5. Call the private root bridge equivalent of
   `FiberRootStore::create_client_root(containerHandle, RootOptions)`.
6. Mark the DOM container with an opaque internal root owner only after root
   creation succeeds.
7. Install delegated root listeners with `listenToAllSupportedEvents` on the
   root event target.
8. Return a `ReactDOMRoot` public object.

`root.render(children)` should:

1. Read `this._internalRoot`.
2. Throw `Cannot update an unmounted root.` if it is `null`.
3. Emit development-only second-argument warnings for callback, container, or
   other defined values.
4. Convert `children` to a rooted element/value handle.
5. Call the bridge equivalent of `update_container(rootId, elementHandle,
   null, null)`.
6. Pass the returned `RootScheduleUpdateRecord` to
   `ensure_root_is_scheduled`.
7. Request/schedule any bridge microtask or Scheduler callback returned by the
   scheduler foundation.
8. Return `undefined`.

`root.unmount()` should:

1. Warn in development for a callback argument.
2. Read `this._internalRoot`; return `undefined` if it is already `null`.
3. Capture the container/root owner, then set `this._internalRoot = null`
   before any scheduler or user-code reentry can observe the public root.
4. Call the bridge equivalent of `update_container_sync(rootId,
   RootElementHandle::NONE, null, null)`.
5. Pass the returned schedule record to `ensure_root_is_scheduled`.
6. Call the real future cross-root `flush_sync_work`, not only
   `collect_sync_flush_plan`.
7. Unmark the container only after the sync null update has flushed.
8. Dispose root-owned JS handles after terminal root lifecycle cleanup.
9. Return `undefined`.

The facade should not call `process_root_schedule_in_microtask` directly as a
replacement for the event-loop bridge. It should ask the private bridge to
request a microtask or Scheduler callback, then let the reconciler-owned
scheduler path process roots.

## JS Object Shape Boundaries

The public JS root object must stay React-shaped and JS-owned:

- `ReactDOMRoot` has one own `_internalRoot` slot.
- `render` and `unmount` live on the prototype.
- `ReactDOMRoot` does not expose `unstable_scheduleHydration`.
- Methods return `undefined`.
- `_internalRoot` can hold a package-private wrapper, but user code must not
  receive a native handle, Rust pointer, stable numeric root id, callback
  registry id, or host token.
- Render-after-unmount is checked in JS before crossing the bridge.
- Public warnings and public errors are manufactured in JS so message shape,
  realm behavior, and warning timing match the checked React DOM oracles.

Recommended private shape:

- public root object: `{ _internalRoot: internalRootWrapper }`
- internal wrapper: package-private object with `rootId`, `container`,
  `bridge`, and disposed/lifecycle flags hidden behind closure or symbol state
- marker value: opaque internal root owner or HostRoot token, never raw fibers
  or native pointers
- element/callback values: rooted JS handle table entries, not raw values
  stored in Rust

## Native And Rust Binding Needs

The Rust side now has useful internal APIs, but the JS facade still needs a
private native/root bridge. That bridge should be coarse and root-oriented:

- `createClientRoot(containerHandle, rootOptions) -> internalRootHandle`
  maps to `FiberRootStore::create_client_root`.
- `updateContainer(rootHandle, elementHandle, callbackHandle) -> schedule`
  maps to `update_container`.
- `updateContainerSync(rootHandle, elementHandle, callbackHandle) -> schedule`
  maps to `update_container_sync`.
- `ensureRootIsScheduled(schedule) -> schedulingRequests` maps to
  `ensure_root_is_scheduled`.
- `processRootScheduleMicrotask()` maps to
  `process_root_schedule_in_microtask` and schedules/continues real work once
  the work loop exists.
- `flushSyncWork() -> flushResult` must perform actual guarded cross-root sync
  work. `collect_sync_flush_plan` is only the current data foundation.
- `isRenderingOrCommitting() -> boolean` is needed for `unmount` and
  `flushSync` development warnings.
- `disposeRoot(rootHandle)` invalidates native/root handles and all root-owned
  callback/value handles after terminal cleanup.

Binding rules:

- Keep public React DOM values JS-owned. Rust should store opaque handles for
  elements, callbacks, containers, Scheduler callbacks, and microtasks.
- Handles must be tied to one JS environment and root generation, with disposed
  flags and wrong-environment/stale-root errors.
- Rust/native code must not call user JS from background threads.
- Callback invocation belongs to explicit render/commit/passive/error phases,
  not facade wrappers.
- Native loader guardrails from the current placeholder remain until an
  authorized native binding worker owns N-API dependencies and lockfile
  changes.

## Container Marker And Listener Interactions

The private DOM shell should be consumed in this exact order:

1. `assertValidContainer(container)` before root creation.
2. `warnIfContainerAlreadyRoot(container)` in development before or around root
   creation, but duplicate roots remain warning-only.
3. `markContainerAsRoot(rootOwner, container)` after internal root creation
   succeeds.
4. Choose the root listener target. For the current stable non-hydration shell,
   element/document/document-fragment containers are accepted; comment mount
   containers are not accepted by the merged Fast React shell.
5. `listenToAllSupportedEvents(rootEventTarget)` after marking.
6. On unmount, keep the root marker present while the sync null update commits.
7. `unmarkContainerAsRoot(container)` only after `flushSyncWork` completes.

Listener marker dedupe is separate from root marker ownership. Repeated roots,
portals, and same-document selectionchange dedupe are handled by
`listener-registry` / `root-listeners`; duplicate-root warnings are handled by
`root-markers`. The facade should not collapse those into one marker because
owner-document `selectionchange`, portal targets, and duplicate root warnings
have different observable surfaces.

## Tests Before Wiring

Run existing oracle gates before removing the `react-dom/client` placeholders:

- `node --test tests/conformance/test/react-dom-client-root-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`

Add Fast React comparison tests for the bridge slice:

- `createRoot` export shape, function length, and RSC branch preservation.
- Invalid container throw before root/marker/listener side effects.
- Duplicate and legacy root warnings as warnings, not throws.
- Root object own/prototype keys, descriptors, method lengths, and return
  values.
- `root.render` one-argument success, `undefined` return, no direct DOM
  mutation before commit, and schedule record routed through the reconciler.
- Development second-argument warnings for `root.render`.
- `root.unmount` idempotence, callback warning, `_internalRoot` nulling before
  reentry, sync null update, post-flush marker cleanup, and render-after-
  unmount throw.
- Cross-root sync flush: a sync update on root B flushes when root A unmounts
  or `flushSync` drains sync work.
- Profiling entrypoint shares the same root facade once normal roots pass.

Rust/native tests needed before JS claims:

- Bridge `createClientRoot` stores root options and returns an opaque
  generation-checked handle.
- `updateContainer` creates a HostRoot update with `RootUpdatePayload.element`
  and calls `ensure_root_is_scheduled`.
- `updateContainerSync` uses `Lane::SYNC` and never flushes by itself.
- Real `flushSyncWork` executes all roots in the sync plan and respects the
  render/commit reentry guard.
- Work loop tests prove HostRoot queue processing, `root.current` switching,
  commit ordering, callback/ref/effect phases, and host operations.
- Handle table tests reject stale, disposed, wrong-root, and wrong-environment
  values.

## Hard Unsupported Hydration Boundaries

Hydration must remain unsupported in this non-hydration bridge refresh.

Do not wire `hydrateRoot` to the `createRoot` path, and do not let
`createRoot(..., {hydrate: true})` create a hydration root. `createRoot` may
warn for hydration-option misuse, but it must still create only a normal
client root or remain unsupported.

This slice must not:

- return `ReactDOMHydrationRoot`
- expose `unstable_scheduleHydration`
- call `create_hydration_container`
- create a dehydrated HostRoot state
- parse Fizz or Suspense hydration markers
- claim hydratable DOM nodes
- queue explicit hydration targets
- run hydration event replay
- repair hydration mismatches or report hydration recoverable errors
- client-render over server markup while presenting that as hydration support

The Rust `RootKind::ReservedUnsupportedHydration` and
`HostRootHydrationState::ReservedUnsupported` are useful placeholders for
future state shape, not a public `hydrateRoot` implementation.

## Evidence Gathered

- `WORKER_BRIEF.md` confirmed worker rules, report sections, and goal-tool
  requirements.
- `MASTER_PLAN.md` shows worker 135 is report-only and the current milestone
  is the minimal real root render/update/unmount path.
- `MASTER_PROGRESS.md` confirms accepted workers 046, 088, 089, 121, 122,
  123, 124, and 128.
- Worker 044 defines the original React DOM client-root contract and layering.
- Worker 092 defines `createRoot` facade behavior and public root shape.
- Worker 093 defines `root.render` as `updateContainer` plus scheduling, not
  DOM mutation.
- Worker 094 defines `_internalRoot` nulling, sync null update, cross-root
  flush, and post-flush unmark ordering for `root.unmount`.
- Worker 108 defines the facade source plan and private bridge expectations.
- Worker 046 provides the checked client-root public behavior oracle.
- Worker 088 provides checked container validation/root marker behavior.
- Worker 089 provides checked root/portal listener installation behavior.
- Worker 121 provides the checked root render/update/unmount e2e oracle.
- Worker 122 implemented the private DOM container/listener shell.
- Workers 123, 124, and 128 implemented the current Rust root/update/scheduler
  foundations now available to a future bridge.
- Current `packages/react-dom/client.js` remains a placeholder, which is still
  correct until the missing bridge/work-loop/commit pieces land.

## Risks Or Blockers

- No native/N-API root bridge exports exist yet.
- `collect_sync_flush_plan` is not `flushSyncWork`; it selects sync roots but
  does not render or commit them.
- The scheduler bridge records callback/microtask requests, but no JS event
  loop integration runs root work yet.
- The work loop/commit path is missing, so HostRoot updates cannot produce DOM
  output or unmount cleanup.
- Callback/value rooting and disposal across JS and Rust are unresolved.
- Event priority is present in core, but the current `update_container` path
  still uses `UpdatePriorityState::new()` and does not yet receive DOM event,
  transition, render-phase, or `flushSync` priority context from JS.
- DOM markers/listeners exist, but node maps, latest props cleanup, real event
  dispatch, and DOM mutation commit remain separate work.
- Hydration must stay blocked until its own oracle, root state, marker parser,
  replay, mismatch, and facade work exist.

## Recommended Next Tasks

1. Finish the HostRoot render/work-loop and commit path so scheduled root work
   can process HostRoot queues, switch `root.current`, and call host mutation
   operations.
2. Implement the real cross-root `flushSyncWork` executor on top of the
   scheduler foundation; keep `collect_sync_flush_plan` as planning data only.
3. Add the private JS/native root bridge and handle table with create, update,
   schedule, flush, phase, and dispose operations.
4. Wire DOM update priority, transition lane context, and `flushSync` priority
   overrides into `update_container`.
5. Add node maps/latest props cleanup and minimal DOM mutation host behavior
   before claiming DOM root output.
6. Wire `react-dom/client.createRoot` and `ReactDOMRoot` only after the above
   gates pass, and keep `hydrateRoot` as a loud unsupported placeholder.
7. Re-run the client-root, container-marker, listener-installation,
   root-render-e2e, flushSync, smoke, Rust, and scoped diff checks before any
   compatibility claim.

## Commands Run

Tool actions:

- `create_goal`
- `get_goal`
- `apply_patch` to create/update this report

Shell commands:

```sh
sed -n '1,220p' WORKER_BRIEF.md
ls worker-progress
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,260p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,300p' worker-progress/worker-092-react-dom-create-root-facade-plan.md
sed -n '1,300p' worker-progress/worker-093-root-render-integration-plan.md
sed -n '1,360p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '1,420p' worker-progress/worker-108-react-dom-root-facade-implementation-plan.md
sed -n '1,220p' worker-progress/worker-046-react-dom-client-root-oracle.md
sed -n '1,180p' worker-progress/worker-088-dom-container-root-markers-oracle.md
sed -n '1,180p' worker-progress/worker-089-dom-root-listener-installation-oracle.md
sed -n '1,220p' worker-progress/worker-121-root-render-e2e-oracle.md
sed -n '1,240p' worker-progress/worker-122-dom-container-listener-shell.md
sed -n '1,220p' worker-progress/worker-123-reconciler-fiber-root-host-root.md
sed -n '1,220p' worker-progress/worker-124-host-root-update-queue.md
sed -n '1,260p' worker-progress/worker-128-reconciler-root-scheduler-foundation.md
rg --files crates/fast-react-core/src crates/fast-react-reconciler/src crates/fast-react-host-config/src packages/react-dom/src packages/react-dom | sort
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,360p' crates/fast-react-reconciler/src/root_config.rs
sed -n '1,760p' crates/fast-react-reconciler/src/fiber_root.rs
sed -n '1,760p' crates/fast-react-reconciler/src/root_updates.rs
sed -n '1,840p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,340p' crates/fast-react-reconciler/src/fiber_store.rs
sed -n '1,340p' crates/fast-react-reconciler/src/update_priority.rs
sed -n '1,260p' crates/fast-react-reconciler/src/scheduler_bridge.rs
sed -n '1,840p' crates/fast-react-core/src/root_lanes.rs
sed -n '1,260p' crates/fast-react-core/src/event_priority.rs
sed -n '1,640p' crates/fast-react-reconciler/src/update_queue.rs
sed -n '1,320p' crates/fast-react-reconciler/src/concurrent_updates.rs
sed -n '1,260p' packages/react-dom/src/client/root-markers.js
sed -n '1,220p' packages/react-dom/src/client/dom-container.js
sed -n '1,260p' packages/react-dom/src/events/root-listeners.js
sed -n '1,260p' packages/react-dom/index.js
sed -n '1,260p' packages/react-dom/profiling.js
sed -n '1,180p' packages/react-dom/client.react-server.js
sed -n '1,180p' packages/react-dom/profiling.react-server.js
sed -n '1,260p' crates/fast-react-napi/src/lib.rs
sed -n '1,220p' bindings/node/index.cjs
sed -n '1,220p' bindings/node/index.mjs
sed -n '1,260p' worker-progress/worker-096-native-root-boundary-plan.md
sed -n '1,220p' worker-progress/worker-015-native-loader-boundary.md
git status --short
```

Final verification commands:

```sh
git diff --check
git diff --check --no-index /dev/null worker-progress/worker-135-react-dom-root-bridge-refresh.md
files=$( { git diff --name-only; git ls-files --others --exclude-standard; } | grep -v '^\.worker-logs/' || true ); printf '%s\n' "$files" | sed '/^$/d'; bad=$(printf '%s\n' "$files" | sed '/^$/d' | grep -Ev '^worker-progress/worker-135-react-dom-root-bridge-refresh\.md$' || true); test -z "$bad"
rg -n '^(<<<<<<<|=======|>>>>>>>)|[ \t]$' worker-progress/worker-135-react-dom-root-bridge-refresh.md
git status --short
```

## Verification

Passed after this report update:

- `git diff --check`: passed.
- Scoped changed-path check: passed. The only changed path outside existing
  `.worker-logs/` is
  `worker-progress/worker-135-react-dom-root-bridge-refresh.md`.
- `git diff --check --no-index /dev/null
  worker-progress/worker-135-react-dom-root-bridge-refresh.md`: passed for
  the untracked report file.
- Scoped conflict-marker/trailing-whitespace scan on this report: no matches.
- `git status --short`: shows only existing `.worker-logs/` and this worker
  report as untracked.
