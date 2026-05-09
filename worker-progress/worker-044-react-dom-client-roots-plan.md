# worker-044-react-dom-client-roots-plan

## Objective

Produce a report-only client roots, update priority, and root object behavior plan for React DOM 19.2.6.

Write scope honored: only this file, `worker-progress/worker-044-react-dom-client-roots-plan.md`, was written. No code was implemented.

## Summary

Fast React should not implement `react-dom/client.createRoot` as a JS facade that immediately mutates a DOM node. In React DOM 19.2.6, `createRoot` is a narrow public entry into a reconciler `FiberRoot`: it validates and marks a DOM container, builds a concurrent host root, stores root-level error callbacks and identifier prefix state, installs delegated root listeners, and returns a small root object whose `render` and `unmount` methods enqueue root updates through lane scheduling.

The root cause to preserve is the root scheduling contract. `root.render(children)` calls `updateContainer`, which chooses a lane from the current transition or DOM update priority, creates a HostRoot update with payload `{element}`, enqueues it through the class/root update queue, marks the root updated, and schedules root work. `root.unmount()` nulls the public root handle, enqueues a synchronous `null` render with `updateContainerSync`, flushes sync work across roots, then unmarks the DOM container. A FIFO queue, direct DOM replacement, or per-root synchronous render shortcut would miss transitions, error callbacks, passive effect flushing, cross-root sync flushing, event priority, and root task reuse/cancellation.

The first implementation should therefore be split into root bookkeeping, update queues, scheduler integration, DOM container/event contracts, and public package facades. Hydration, DOM mutation, full event plugin dispatch, resources/forms/view transitions, profiling, and Fizz/server behavior should remain separate work.

## Evidence Used

- Worker 007 concluded React 19.2.6 requires lane bitsets, explicit `FiberRoot` scheduling state, Scheduler task heaps, circular/rebased update queues, and flag-based commit traversal. It specifically rejected flat priorities, FIFO state queues, and global effect lists.
- Worker 008 concluded the host boundary must expose opaque host handles and explicit capabilities, with scheduling/event priority, microtasks, portals, hydration, resources, singletons, forms, and view transitions kept out of renderer-agnostic core.
- Worker 030 implemented `Lane`, `Lanes`, `LaneIndex`, and `LaneMap<T>` in `fast-react-core` from React 19.2.6 `ReactFiberLane.js`, but left root bookkeeping, `getNextLanes`, transition lane claiming, expiration, entanglement, and scheduling out of scope.
- Worker 033 inventoried `react-dom@19.2.6`: `react-dom/client` exports `createRoot`, `hydrateRoot`, and `version`; `react-dom/profiling` also exports `createRoot`, `hydrateRoot`, and `flushSync`; `react-server` branches throw; `react-dom/client` is blocked on reconciler roots, lane/update semantics, DOM mutation host operations, and event priority.
- Published `react-dom@19.2.6` package evidence: `client.js` routes to development or production CJS bundles; package metadata depends on `scheduler@^0.27.0` and peers on `react@^19.2.6`; the package export map exposes `./client` and `./profiling` but blocks direct physical `client.js` and `cjs/*` subpaths.
- `@types/react-dom@19.2.3` evidence: `RootOptions` exposes `identifierPrefix`, `onUncaughtError`, `onCaughtError`, and `onRecoverableError`; `Root` exposes only `render(children)` and `unmount()`; declaration files omit runtime `react-dom/client` `version`.
- React source tag `v19.2.6` evidence:
  - `packages/react-dom/src/client/ReactDOMRoot.js`
  - `packages/react-dom/src/client/ReactDOMClient.js`
  - `packages/react-dom/src/shared/ReactDOMFlushSync.js`
  - `packages/react-dom/src/ReactDOMSharedInternals.js`
  - `packages/react-dom/src/client/ReactDOMDefaultTransitionIndicator.js`
  - `packages/react-dom-bindings/src/client/ReactDOMContainer.js`
  - `packages/react-dom-bindings/src/client/ReactDOMComponentTree.js`
  - `packages/react-dom-bindings/src/events/DOMPluginEventSystem.js`
  - `packages/react-dom-bindings/src/events/ReactDOMEventListener.js`
  - `packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js`
  - `packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js`
  - `packages/react-reconciler/src/ReactFiberRoot.js`
  - `packages/react-reconciler/src/ReactFiberReconciler.js`
  - `packages/react-reconciler/src/ReactFiberRootScheduler.js`
  - `packages/react-reconciler/src/ReactFiberWorkLoop.js`
  - `packages/react-reconciler/src/ReactEventPriorities.js`
  - `packages/react-reconciler/src/ReactFiberClassUpdateQueue.js`
  - `packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`
  - `packages/react-reconciler/src/ReactFiberErrorLogger.js`
  - `packages/react-reconciler/src/Scheduler.js`
  - `packages/scheduler/src/forks/Scheduler.js`

## Public Package Facade Boundary

The package facade is not the root implementation. It should own only export-map behavior, environment routing, React version checks, development warnings that are observable at the entrypoint layer, and conversion from JS options/callbacks into internal root configuration.

Required facade contracts:

- `react-dom/client` must export exactly `createRoot`, `hydrateRoot`, and `version` for default development and production package modes.
- `react-dom/profiling` must wait for normal client root behavior because it re-exports client roots plus root DOM APIs from a profiling bundle.
- The `react-server` branch for `react-dom/client` must throw `react-dom/client is not supported in React Server Components.`
- `client.js` and `profiling.js` are package-internal files behind `exports`; direct physical subpath imports must remain blocked.
- The facade should enforce exact React/React DOM version compatibility like `ReactDOMClient.js`, but that belongs with package loading, not with the reconciler root object.

Do not put DOM mutation, event plugin dispatch, hydration, server/Fizz serialization, or resource hint behavior in the package facade. Public functions can call into those layers after they exist, but the facade should not fake them.

## `createRoot` Contract

React DOM source `createRoot(container, options)` has this sequence:

1. Validate the container with `isValidContainer`; invalid containers throw `Target container is not a DOM element.`
2. In development, warn if the container is already marked as a root, distinguishing old legacy `_reactRootContainer` from a duplicate `createRoot` call. This is a warning, not a throw.
3. Initialize root options:
   - `isStrictMode` from `options.unstable_strictMode === true`
   - `identifierPrefix` from `options.identifierPrefix`, default `''`
   - `onUncaughtError`, `onCaughtError`, and `onRecoverableError`, defaulting to reconciler defaults
   - source-only feature-flagged `onDefaultTransitionIndicator` and `unstable_transitionCallbacks`
4. Call `createContainer(container, ConcurrentRoot, null, isStrictMode, false, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, transitionCallbacks)`.
5. Mark the DOM container as the root with `markContainerAsRoot(root.current, container)`.
6. Install delegated DOM events by calling `listenToAllSupportedEvents(rootContainerElement)`. For comment mount containers, source uses the parent node when comments-as-containers are enabled.
7. Return `new ReactDOMRoot(root)`.

Published stable package caveat: the source types mention `unstable_transitionCallbacks` and `onDefaultTransitionIndicator`, but `ReactFeatureFlags.js` sets `enableTransitionTracing` to `false` and `enableDefaultTransitionIndicator` to the experimental channel flag. The stable 19.2.6 CJS bundle ignores user `unstable_transitionCallbacks` and `onDefaultTransitionIndicator`; it still contains a `defaultOnDefaultTransitionIndicator` helper and passes it through a dead feature-flagged parameter path. Fast React should gate these exactly instead of exposing always-on behavior.

Root implementation requirements:

- Represent root options as structured root configuration, not ad hoc arguments threaded through JS strings.
- Store root-level error callbacks and identifier prefix on the internal root.
- Preserve `ConcurrentRoot` behavior; do not add a legacy root mode for this API.
- Keep `concurrentUpdatesByDefaultOverride` as ignored compatibility shape only if the internal API still needs to mirror React's call signature.
- Treat duplicate-root detection as DOM-container metadata owned by the DOM binding layer.

## Root Object Behavior

`ReactDOMRoot` is a tiny public object with one own `_internalRoot` slot and prototype methods. `ReactDOMHydrationRoot` shares `render` and `unmount` but additionally exposes `unstable_scheduleHydration`. This report only plans non-hydration root behavior; hydration scheduling should remain with the hydration worker.

`root.render(children)` behavior:

- If `_internalRoot` is `null`, throw `Cannot update an unmounted root.`
- In development, warn for a second argument:
  - function callback: second callback argument is unsupported
  - DOM container: caller does not need to pass the container again
  - other defined value: `root.render` accepts only one argument
- Call `updateContainer(children, root, null, null)`.
- Return `undefined`.

`root.unmount()` behavior:

- In development, warn if a function callback argument is passed.
- If `_internalRoot` is already `null`, do nothing and return `undefined`.
- Otherwise set `_internalRoot = null` before scheduling unmount.
- Read `container = root.containerInfo`.
- In development, warn if React is already rendering or committing.
- Call `updateContainerSync(null, root, null, null)`.
- Call `flushSyncWork()`, which flushes sync work across roots when not already inside render or commit.
- Call `unmarkContainerAsRoot(container)`.

Breaking recommendation: if existing scaffold code assumes a root object can directly own a DOM tree or call host mutations during `render`, replace it. The root object must only enqueue root updates. Direct DOM mutation from the public root object would patch the symptom of "render something" while bypassing the real root scheduler.

## Internal Fiber Root Shape

React 19.2.6 `FiberRootNode` stores the root scheduler and compatibility state:

- identity and container fields: `tag`, `containerInfo`, `current`, `pendingChildren`, `context`, `pendingContext`, `identifierPrefix`
- scheduling links: `next`, `callbackNode`, `callbackPriority`, `timeoutHandle`, `cancelPendingCommit`
- lane bitsets: `pendingLanes`, `suspendedLanes`, `pingedLanes`, `warmLanes`, `expiredLanes`, `errorRecoveryDisabledLanes`, `entangledLanes`
- fixed lane maps: `expirationTimes`, `entanglements`, `hiddenUpdates`
- error and recoverability callbacks: `onUncaughtError`, `onCaughtError`, `onRecoverableError`
- cache/form state: `pooledCache`, `pooledCacheLanes`, `formState`
- feature-gated state: `indicatorLanes`, `onDefaultTransitionIndicator`, `pendingIndicator`, `transitionCallbacks`, `transitionLanes`, `transitionTypes`, gesture/view-transition fields, hydration callbacks, profiler durations, updater tracking
- `incompleteTransitions` map, present even in stable bundles

Worker 030's `LaneMap<T>` is the right building block for root lane maps, but Fast React still needs a root bookkeeping struct that owns the algorithms from `ReactFiberLane.js`: `markRootUpdated`, `markRootSuspended`, `markRootPinged`, `markRootFinished`, `markRootEntangled`, `upgradePendingLanesToSync`, `getNextLanes`, `getNextLanesToFlushSync`, and transition/retry lane claiming.

The root should live in the reconciler layer or a core/reconciler split, not in `packages/react-dom`. DOM containers are host handles stored inside root state; DOM-specific marker properties stay in DOM bindings.

## Root Update Queue Contract

`updateContainer` does not render immediately:

- It reads `container.current`.
- It calls `requestUpdateLane(current)` to choose a lane.
- It calls `updateContainerImpl`.
- `updateContainerImpl` computes subtree context, creates an update with `createUpdate(lane)`, assigns `update.payload = {element}`, stores an optional callback, and enqueues it on the HostRoot queue.
- If enqueue returns a root, it starts update timing, calls `scheduleUpdateOnFiber(root, rootFiber, lane)`, and calls `entangleTransitions(root, rootFiber, lane)`.

`updateContainerSync` is the same root update path with `SyncLane`, plus legacy-only passive-effect handling that stable concurrent root code still carries internally.

Required Fast React shape:

- HostRoot update queues must use React's shared circular pending queue plus base queue rebase model from worker 007, not a FIFO.
- Root updates must preserve the payload key name `element` because DevTools depends on it.
- Callbacks passed through internal update APIs should be validated and stored in queue callback lists, even though public `root.render` no longer accepts a callback.
- Transition updates must entangle the queue's transition lanes with the root, as `entangleTransitions` does.

## Update Priority Contract

React DOM update priority has three distinct sources:

- Explicit current priority stored in `ReactDOMSharedInternals.p`.
- Current browser event priority from `window.event`, mapped by `getEventPriority`.
- Current React transition from `ReactSharedInternals.T`.

`requestUpdateLane(fiber)` follows this order:

1. Legacy non-concurrent mode returns `SyncLane`; this is not expected for `createRoot`, but the reconciler helper still contains the case.
2. Render-phase updates reuse an arbitrary lane from `workInProgressRootRenderLanes`.
3. If `requestCurrentTransition()` is non-null, transition updates get `requestTransitionLane(transition)`.
4. Otherwise `eventPriorityToLane(resolveUpdatePriority())` maps event priority to a lane.

`ReactEventPriorities.js` maps event priorities directly to lanes:

- discrete event priority is `SyncLane`
- continuous event priority is `InputContinuousLane`
- default event priority is `DefaultLane`
- idle event priority is `IdleLane`

`ReactDOMUpdatePriority.resolveUpdatePriority()` returns the explicit current priority if set, otherwise reads `window.event`; if no current event exists, it returns `DefaultEventPriority`.

DOM event listener wrappers set this priority around dispatch:

- discrete wrappers set `DiscreteEventPriority` and clear the current transition
- continuous wrappers set `ContinuousEventPriority` and clear the current transition
- default wrappers call dispatch without changing the explicit priority
- `message` event priority is derived from the current Scheduler priority

Fast React should not let the DOM adapter know lane internals. The DOM adapter should report or set event priority through the host scheduling boundary; the reconciler maps that priority to `Lane` values.

## Event Listener Installation Contract

`createRoot` only installs listeners; it does not implement event dispatch. The event dispatch system remains separate.

`listenToAllSupportedEvents(rootContainerElement)`:

- Uses a random `_reactListening...` marker on each root container event target to deduplicate root listener installation.
- Iterates `allNativeEvents`.
- For each event except `selectionchange`, installs a capture listener and, unless the event is non-delegated, a bubble listener.
- Installs `selectionchange` on the owner document with the same marker-based deduplication.

The DOM component tree layer separately uses randomized internal keys:

- `markContainerAsRoot(hostRoot, node)` writes the HostRoot fiber to the container marker.
- `unmarkContainerAsRoot(node)` resets that marker to `null`.
- `isContainerMarkedAsRoot(node)` returns whether a root marker exists.
- `getInstanceFromNode` and `getClosestInstanceFromNode` use instance and container markers for event targeting.

Portal event setup is separate: the DOM host config's `preparePortalMount(portalInstance)` calls `listenToAllSupportedEvents(portalInstance)`. Do not fold portal listener installation into `createRoot`.

## Container Validation And Marking

`isValidContainer(node)` accepts:

- element nodes
- document nodes
- document fragments
- source-feature-gated comment nodes with exact node value ` react-mount-point-unstable `

Published root `createPortal` evidence accepts element, document, and document fragment containers. `createRoot` source also supports the unstable comment-container path when feature flags allow it. Fast React should model this as a DOM container validator owned by the DOM binding package, with feature flags explicit.

Root marking must occur after `createContainer` succeeds and before event listener installation. Unmarking must occur only after `root.unmount()` has enqueued and flushed the synchronous null update. Invalid containers should fail before any root state or marker is created.

## Error Callback Contract

Root options install three callbacks on `FiberRoot`:

- `onUncaughtError(error, {componentStack})`
- `onCaughtError(error, {componentStack, errorBoundary})`
- `onRecoverableError(error, {componentStack})`

Defaults come from `ReactFiberErrorLogger`:

- default uncaught errors report globally and warn in development about error boundaries
- default caught errors log through console behavior, including server-error environment badges in development
- default recoverable errors report globally

Uncaught root render errors create a root error update with payload `{element: null}` and a callback that logs through `root.onUncaughtError`. Error boundary captures call `root.onCaughtError`. Recoverable errors are reported after commit under `DiscreteEventPriority` with the current transition cleared.

Fast React must store these callbacks as root-owned JS callback handles with explicit lifetime/rooting rules. They run during commit/error handling and can throw; React catches logging callback failures and rethrows asynchronously with `setTimeout`. That reentrancy and lifetime behavior should be part of the binding contract, not a best-effort console wrapper.

## Transition And Default Indicator Contract

There are two separate transition concerns:

- Stable transition lane assignment exists in the published 19.2.6 bundle.
- Transition tracing callbacks and default transition indicators are source-present but feature-gated out of the stable public package behavior.

Stable transition lane assignment:

- `ReactFiberRootScheduler` stores `currentEventTransitionLane`.
- `requestTransitionLane` assigns all transitions in the same event to one lane.
- If inside an entangled async action scope, it reuses that action lane.
- Otherwise it claims the next transition update lane and cycles through the transition update lane range.
- The cached event transition lane resets at the end of the root-schedule microtask.
- DOM `shouldAttemptEagerTransition()` returns true once for a `popstate` event so a transition can be flushed synchronously for scroll-position preservation.

Feature-gated default indicator source behavior:

- `markRootUpdated` adds transition update lanes to `root.indicatorLanes` when the default indicator feature is enabled.
- At root-schedule microtask end, React can start a default indicator if a transition remains pending and no synchronous loading state handled it.
- The DOM default indicator uses the Navigation API to start a fake same-page navigation with `info: 'react-transition'`, then returns a cleanup function.
- In the stable published 19.2.6 CJS bundles, user `onDefaultTransitionIndicator` is not read from root options and `FiberRootNode` does not store indicator fields because the feature flag is disabled.

Feature-gated transition tracing source behavior:

- Source accepts `unstable_transitionCallbacks`, stores `root.transitionCallbacks`, and tracks `transitionLanes` when `enableTransitionTracing` is true.
- Stable published 19.2.6 package bundles do not read `unstable_transitionCallbacks` from `createRoot` options.

Plan: implement stable transition lane assignment before exposing any transition callback or indicator behavior. Add explicit feature gates and conformance probes before enabling source-only transition callbacks or default indicators. This is a compatibility break from a naive "accept every source option" interpretation, but it matches the published 19.2.6 package.

## `flushSync` Boundary Implications

`flushSync` is exported from `react-dom` and `react-dom/profiling`, not from `react-dom/client`, but it is part of the client-root contract because it changes root update priority and flushes root work.

`ReactDOMFlushSync.js` behavior:

- Save `ReactSharedInternals.T` and `ReactDOMSharedInternals.p`.
- Set the current transition to `null`.
- Set DOM current update priority to `DiscreteEventPriority`.
- Run the callback if provided.
- Restore transition and update priority.
- Call `ReactDOMSharedInternals.d.f()` to flush sync work.
- In development, warn if flush was attempted while React was already rendering.

The dispatcher default `f` is `noop`; the client renderer must install a dispatcher whose `f` calls reconciler `flushSyncWork`. Therefore `flushSync` cannot be implemented correctly in the public facade alone.

Root unmount uses the same boundary indirectly: it schedules a `SyncLane` null update and calls `flushSyncWork()`. React's `flushSyncWork()` flushes all roots when outside render/commit and returns whether it was already rendering. Future Fast React code should preserve cross-root sync flushing and reentrancy detection. A per-root flush would be an intentional divergence and should not be introduced without a separate compatibility decision.

## Scheduler Callback Integration

React root scheduling uses the public `scheduler` package through `react-reconciler/src/Scheduler.js`, an ESM wrapper over the external CJS dependency.

Root scheduling flow:

- `ensureRootIsScheduled(root)` adds the root to a linked list and schedules one root-schedule microtask.
- `processRootScheduleInMicrotask()` recomputes each scheduled root, removes roots with no work, and flushes sync work at the end of the microtask.
- `scheduleTaskForRootDuringMicrotask(root, currentTime)` marks starved lanes expired, computes `nextLanes`, cancels stale callback nodes, and either records sync work for microtask-end flushing or schedules a Scheduler task.
- Non-sync lane groups map through `lanesToEventPriority(nextLanes)`:
  - discrete and continuous event priorities schedule UserBlocking Scheduler callbacks
  - default event priority schedules Normal Scheduler callbacks
  - idle event priority schedules Idle Scheduler callbacks
- `performWorkOnRootViaSchedulerTask(root, didTimeout)` flushes pending passive effects first, recomputes `getNextLanes`, runs `performWorkOnRoot`, then either returns a continuation if the same callback node remains or lets a new task be scheduled.

Scheduler package requirements from worker 007 and source:

- ready and delayed tasks use binary min-heaps
- delayed tasks sort by `startTime`, ready tasks by `expirationTime`, ties by task id
- cancellation nulls callbacks as tombstones
- returned continuation callbacks stay on the same task and force a yield
- host transport prefers `setImmediate`, then `MessageChannel`, then `setTimeout`
- priority constants are `Immediate = 1`, `UserBlocking = 2`, `Normal = 3`, `Low = 4`, `Idle = 5`

Implementation implication: do not couple root scheduling directly to timers in `react-dom`. The reconciler needs a scheduler abstraction compatible with `scheduler@0.27.0`, and the public `scheduler` package work should share semantics with the root scheduler rather than grow a parallel implementation.

## Layer Contracts

Public package facade:

- owns export maps, condition branches, exact unsupported errors, version exports, DCE dev/prod routing, and JS option ingestion
- must not perform host mutation or event dispatch

Reconciler/core:

- owns `FiberRoot`, HostRoot fibers, update queues, lanes, root scheduling, `requestUpdateLane`, transition lane claiming, `getNextLanes`, `flushSyncWork`, error callback invocation, and commit phase ordering
- uses `fast-react-core` lane primitives from worker 030

Host-config boundary:

- exposes current/update priority, microtask scheduling, post-paint callbacks, commit suspension, portal mount preparation, and opaque host container/instance handles
- keeps DOM-specific event priority observation out of the core

DOM binding/adapter:

- owns `isValidContainer`, container marker keys, instance-to-fiber DOM node maps, `listenToAllSupportedEvents`, event priority classification, `window.event` reads, document-level `selectionchange`, and portal listener installation
- later owns DOM mutation, attributes/properties, controlled inputs, resources, singletons, forms, and view transitions

Hydration:

- owns `hydrateRoot`, `createHydrationContainer`, explicit hydration target queues, hydratable marker matching, event replay, mismatch diagnostics, and Fizz marker compatibility
- should reuse root scheduler contracts but remain separate from initial `createRoot`

Server/Fizz:

- owns DOM serialization, streams, prerender/resume state, resources/headers, and Suspense/Activity markers
- must not be implemented as a client-root wrapper

## Implementation Slices

These slices are intentionally non-overlapping and assume workers 035 to 043 remain separately owned as queued in the master plan.

1. `worker-045-react-dom-client-root-oracle`
   - Write scope: `tests/conformance/src/react-dom-client-root-*.mjs`, `tests/conformance/scripts/*react-dom-client-root*.mjs`, `tests/conformance/test/react-dom-client-root-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-client-root-oracle.json`, `worker-progress/worker-045-react-dom-client-root-oracle.md`.
   - Task: add deterministic probes for `createRoot` invalid containers, duplicate root warnings, root object shape, render/unmount after unmount, second-argument warnings, stable option ingestion, stable omission of transition callbacks/default indicator, and `react-server` throw behavior. Use a DOM test environment or controlled DOM shim; do not implement Fast React behavior.

2. `worker-046-core-root-lane-bookkeeping`
   - Write scope: `crates/fast-react-core/src/root_lanes.rs`, `crates/fast-react-core/src/lib.rs`, `worker-progress/worker-046-core-root-lane-bookkeeping.md`.
   - Task: implement root lane bookkeeping algorithms and tests around `LaneMap<T>`: pending/suspended/pinged/warm/expired/entangled/hidden/indicator lane state, transition/retry claimers, `getHighestPriorityLanes`, `getNextLanes`, `getNextLanesToFlushSync`, and root mark functions. Do not touch DOM or JS packages.

3. `worker-047-reconciler-fiber-root-model`
   - Write scope: `crates/fast-react-reconciler/src/fiber_root.rs`, `crates/fast-react-reconciler/src/fiber.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-047-reconciler-fiber-root-model.md`.
   - Task: define arena-backed `FiberRoot` and HostRoot fiber structures with callback handles abstracted behind types. Include root option storage, container host handle, callback node/priority placeholders, root context fields, and lifecycle state. Do not implement DOM container markers or public JS facades.

4. `worker-048-reconciler-host-root-update-queue`
   - Write scope: `crates/fast-react-reconciler/src/update_queue.rs`, `crates/fast-react-reconciler/src/root_updates.rs`, `worker-progress/worker-048-reconciler-host-root-update-queue.md`.
   - Task: implement HostRoot update creation/enqueue/rebase semantics using circular pending queues, payload `{element}` semantics at the binding boundary, callback queueing, hidden callback deferral hooks, and transition entanglement hooks. Do not implement scheduling transport or DOM mutation.

5. `worker-049-reconciler-root-scheduler`
   - Write scope: `crates/fast-react-reconciler/src/root_scheduler.rs`, `crates/fast-react-reconciler/src/scheduler.rs`, `worker-progress/worker-049-reconciler-root-scheduler.md`.
   - Task: implement root scheduling list, microtask scheduling abstraction, callback node reuse/cancellation, sync work flushing across roots, scheduler priority mapping, `performWorkOnRootViaSchedulerTask` continuation behavior, and reentrancy guards. Depend on worker 046 and 048. Do not expose public `scheduler` package APIs here.

6. `worker-050-react-dom-container-markers`
   - Write scope: `packages/react-dom/src/client/dom-container.js`, `packages/react-dom/src/client/dom-component-tree.js`, `tests/conformance/**` root-container tests, `worker-progress/worker-050-react-dom-container-markers.md`.
   - Task: implement DOM container validation and marker helpers in JS for the future React DOM facade, including feature-gated comment containers and duplicate-root diagnostics. Do not install listeners or mutate child nodes.

7. `worker-051-react-dom-root-event-installation`
   - Write scope: `packages/react-dom/src/events/root-listeners.js`, `tests/conformance/**` root-listener tests, `worker-progress/worker-051-react-dom-root-event-installation.md`.
   - Task: implement marker-deduped root listener installation and `selectionchange` document installation. Depend on worker 041's event-priority plan. Do not implement plugin dispatch or hydration replay.

8. `worker-052-react-dom-client-root-facade`
   - Write scope: `packages/react-dom/client.js`, `packages/react-dom/src/client/create-root.js`, `packages/react-dom/src/client/root-object.js`, `tests/smoke/**`, `tests/conformance/**` Fast React comparison updates, `worker-progress/worker-052-react-dom-client-root-facade.md`.
   - Task: wire public `createRoot` to the implemented root model, container markers, and listener installer. Preserve loud unsupported errors for render paths still blocked by missing reconciler/DOM mutation. Do not implement `hydrateRoot`.

9. `worker-053-react-dom-flush-sync-boundary`
   - Write scope: `packages/react-dom/src/shared/flush-sync.js`, `packages/react-dom/index.js`, `packages/react-dom/profiling.js`, `tests/conformance/**`, `worker-progress/worker-053-react-dom-flush-sync-boundary.md`.
   - Task: implement `flushSync` priority/transition boundary against reconciler `flushSyncWork`, including cross-root sync flushing and render/commit reentrancy warnings. Do not implement resource hints, forms, or server APIs.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan is anchored in the published package plus pinned React source. It separates stable package behavior from source-only feature-flagged behavior, especially for transition callbacks and default indicators.
- The plan keeps `createRoot`, `root.render`, and `root.unmount` tied to reconciler updates rather than DOM side effects.

Maintainability:

- Root state, update queues, scheduler transport, DOM markers, and public facades are split into non-overlapping future scopes.
- Feature-gated source contracts are called out so future workers do not accidentally expose experimental behavior in the stable 19.2.6 surface.

Performance:

- Lane maps and bitsets stay on hot root scheduling paths, matching worker 030.
- Root scheduling should reuse/cancel callback nodes and avoid per-root timer shortcuts that would over-flush or starve lower-priority work.
- DOM listener installation is deduplicated per root event target and owner document, avoiding repeated listener fan-out.

Security:

- DOM container validation and marker storage stay in the DOM binding layer.
- Error callbacks and render callbacks crossing from Rust to JS need explicit rooting and asynchronous rethrow behavior so user callbacks cannot observe freed roots or corrupt render state.
- No lifecycle scripts were run and no package tarballs were extracted into the repository.

## Risks And Blockers

- No Fast React reconciler root, fiber arena, update queue, root scheduler, or DOM adapter currently exists, so `createRoot` cannot be behavior-compatible yet.
- Stable React DOM 19.2.6 package behavior differs from source type definitions for transition callback/default indicator options; conformance probes should lock this down before implementation.
- A future DOM test environment is needed for reliable root object/container/listener oracles.
- `flushSync` depends on React DOM internals dispatcher installation and cross-root scheduler state, so it should not be implemented as a standalone package helper.
- Hydration root behavior shares public root methods but adds scheduling, replay, marker, and Fizz contracts; it must stay with the hydration plan.
- Profiling root behavior cannot be complete until normal client roots and scheduler profiling hooks are implemented.

## Commands Run

Project orientation:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
pwd && rg --files | sed -n '1,220p'
git status --short
ls worker-progress
find . -maxdepth 4 \( -path './node_modules' -o -path './target' -o -path './.git' \) -prune -o -iname '*react-dom*' -print
sed -n '1,220p' package.json
sed -n '1,220p' docs/tasks/worker-044-react-dom-client-roots-plan.prompt.md
```

Prior worker reports and local implementation context:

```sh
rg -n "react-dom|19\.2\.6|client|createRoot|flushSync|DefaultTransition|transition|lane|scheduler|root" worker-progress/worker-007-scheduler-fiber.md worker-progress/worker-008-renderer-host-config.md worker-progress/worker-030-core-lane-model.md worker-progress/worker-033-react-dom-inventory.md
sed -n '1,620p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,380p' worker-progress/worker-008-renderer-host-config.md
sed -n '1,160p' worker-progress/worker-030-core-lane-model.md
sed -n '1,590p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,620p' crates/fast-react-core/src/lane.rs
sed -n '1,620p' crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,220p' tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json
```

Package, type, and inventory evidence:

```sh
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/package.json package/client.js package/profiling.js | sed -n '1,220p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | rg -n "createRoot|hydrateRoot|onCaughtError|onUncaughtError|onRecoverableError|onDefaultTransitionIndicator|identifierPrefix|unstable_transitionCallbacks|isValidContainer|markContainerAsRoot|listenToAllSupportedEvents|ReactDOMRoot|ReactDOMHydrationRoot"
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '27870,27960p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '28040,28160p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '18820,18865p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '18985,19010p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '23360,23445p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '24110,24185p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.production.js | rg -n "onDefaultTransitionIndicator|unstable_transitionCallbacks|createRoot|isValidContainer|listenToAllSupportedEvents"
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.production.js | sed -n '15960,16055p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.production.js | sed -n '15120,15205p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom.development.js | sed -n '120,165p'
curl -fsSL https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz | tar -xOzf - react-dom/client.d.ts | sed -n '1,220p'
node - <<'NODE'
const fs = require('node:fs');
const inv = JSON.parse(fs.readFileSync('tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json', 'utf8'));
for (const [mode, probes] of Object.entries(inv.runtimeProbes)) {
  for (const p of probes.filter(p => p.packageName === 'react-dom' && (p.subpath === './client' || p.subpath === './profiling'))) {
    console.log(mode, p.subpath, JSON.stringify(p.require.exportKeys || p.require.message));
  }
}
NODE
```

Pinned source evidence:

```sh
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMRoot.js | sed -n '1,420p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMClient.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/shared/ReactDOMFlushSync.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/ReactDOMSharedInternals.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMDefaultTransitionIndicator.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/shared/ReactFeatureFlags.js | rg -n "enableDefaultTransitionIndicator|enableTransitionTracing|transition"
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactDOMContainer.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js | rg -n "internalContainerInstanceKey|markContainerAsRoot|unmarkContainerAsRoot|isContainerMarkedAsRoot|getInstanceFromNode|getClosestInstanceFromNode|precacheFiberNode|updateFiberProps|getFiberCurrentPropsFromNode" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/HTMLNodeType.js | sed -n '1,160p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/DOMPluginEventSystem.js | sed -n '360,470p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/EventRegistry.js | sed -n '1,180p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventListener.js | sed -n '1,150p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventListener.js | sed -n '290,430p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | rg -n "supportsMicrotasks|scheduleMicrotask|setCurrentUpdatePriority|getCurrentUpdatePriority|resolveUpdatePriority|shouldAttemptEagerTransition|trackSchedulerEvent|resolveEventType|resolveEventTimeStamp|requestPostPaintCallback|maySuspendCommit|waitForCommitToBeReady|HostTransitionContext|NotPendingTransition|resetFormInstance" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | sed -n '700,830p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberRoot.js | sed -n '1,280p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactInternalTypes.js | rg -n "FiberRoot|onDefaultTransitionIndicator|transitionCallbacks|incompleteTransitions|pendingLanes|callbackNode|callbackPriority|indicatorLanes|transition"
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberReconciler.js | sed -n '220,430p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '760,850p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '900,1035p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '1720,1870p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '4078,4115p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactEventPriorities.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberLane.js | rg -n "claimNextTransitionLane|requestTransitionLane|nextTransition|markRoot|ensureRoot|indicator|transition|retry|entangle|getNextLanes|lanesToEventPriority|markRootUpdated|markRootEntangled|markRootFinished|markRootSuspended|markRootPinged|markSpawnedDeferredLane" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberRootScheduler.js | sed -n '1,920p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberErrorLogger.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberThrow.js | sed -n '90,180p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberClassUpdateQueue.js | rg -n "export function createUpdate|export function enqueueUpdate|shared.pending|callback|payload|lane|NoLane|markUpdateLaneFromFiberToRoot" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js | sed -n '1,180p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/Scheduler.js | sed -n '1,200p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/scheduler/src/forks/Scheduler.js | sed -n '188,430p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/scheduler/src/forks/Scheduler.js | sed -n '485,560p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/scheduler/src/SchedulerPriorities.js | sed -n '1,120p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/scheduler/src/SchedulerMinHeap.js | sed -n '1,180p'
```

Final verification commands are listed in the completion checklist below.

## Delegated Checks

- Started read-only explorer `019e0e88-4413-79d0-99c3-6b6d5c722e3c` to independently inspect React DOM 19.2.6 client-root and update-priority evidence. The continuation instruction explicitly said not to wait on nested agents before producing the report, so no nested-agent result was consumed here.
- This report instead relies on direct local/source evidence and on the already accepted delegated-check summaries from workers 007, 008, 030, and 033.

## Changed Files

- `worker-progress/worker-044-react-dom-client-roots-plan.md`

## Completion Checklist

- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Called `create_goal` for this worker task.
- [x] Wrote only `worker-progress/worker-044-react-dom-client-roots-plan.md`.
- [x] Used worker 007, worker 008, worker 030, worker 033, and React DOM 19.2.6 source/package evidence.
- [x] Covered `createRoot`, root object `render`/`unmount`, root options and error callbacks, container validation/marking, event listener installation, update priority, transition callbacks/default transition indicator, `flushSync`, and scheduler callback integration.
- [x] Kept public package facade work, DOM mutation, events, hydration, and server/Fizz concerns separated.
- [x] Recommended implementation slices with concrete non-overlapping write scopes.
- [x] Reviewed quality, maintainability, performance, and security implications.
- [x] Verified no local temp path leaks. Completed by orchestrator post-run after the worker exited on a usage-limit error.
- [x] Verified no trailing whitespace. Completed by orchestrator post-run after the worker exited on a usage-limit error.
- [x] Verified clear follow-up worker scopes. Completed by orchestrator post-run after the worker exited on a usage-limit error.
- [x] Checked scoped git status. Completed by orchestrator post-run after the worker exited on a usage-limit error.
