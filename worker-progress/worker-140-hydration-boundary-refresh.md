# worker-140-hydration-boundary-refresh

## Summary

This is a report-only refresh for hydration boundaries around `hydrateRoot`,
dehydrated HostRoot state, event replay, and DOM/Fizz markers. No source,
tests, package metadata, prompts, master docs, or lockfiles were modified.

The refreshed conclusion is conservative: keep the first real root render path
strictly non-hydration. The current reconciler can create concurrent client
roots, enqueue normal HostRoot `{element}` updates, and schedule roots, but it
does not yet have a real hydration root constructor, an initial hydration
update path, a hydration context/cursor, boundary dehydrated state, recoverable
hydration error queues, typed DOM marker matching, or event replay blockers.

Public `hydrateRoot` should remain loudly unsupported until those hooks exist.
The only safe narrow boundary available now is reserving data handles and
unsupported placeholders. It is not safe to expose a root that client-renders
over server DOM or pretends normal `createRoot` state can hydrate later.

## Goal Evidence

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` succeeded immediately after setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: `Produce the worker 140
  report-only refresh for hydration boundaries around hydrateRoot, dehydrated
  HostRoot state, event replay, and DOM markers, writing only
  worker-progress/worker-140-hydration-boundary-refresh.md and verifying
  allowed-path cleanliness.`

## Changed Files

- `worker-progress/worker-140-hydration-boundary-refresh.md`

## Evidence Gathered

Required local inputs read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-043-react-dom-hydration-plan.md`
- `worker-progress/worker-049-react-dom-hydration-marker-oracle.md`
- `worker-progress/worker-095-hydrate-root-facade-plan.md`
- `worker-progress/worker-123-reconciler-fiber-root-host-root.md`

Additional current local source inspected:

- `packages/react-dom/client.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/src/client/dom-container.js`
- `packages/react-dom/src/client/root-markers.js`
- `packages/react-dom/src/events/event-names.js`
- `packages/react-dom/src/events/listener-registry.js`
- `packages/react-dom/src/events/root-listeners.js`
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-core/src/lane.rs`
- `crates/fast-react-core/src/root_lanes.rs`

Pinned React source inspected from
`/Users/user/Developer/Developer/react-reference`:

- Confirmed clone is `facebook/react` tag `v19.2.6`, commit
  `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- `packages/react-dom/src/client/ReactDOMRoot.js`
- `packages/react-reconciler/src/ReactFiberRoot.js`
- `packages/react-reconciler/src/ReactFiberReconciler.js`
- `packages/react-reconciler/src/ReactFiberHydrationContext.js`
- `packages/react-reconciler/src/ReactFiberShellHydration.js`
- `packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js`
- `packages/react-dom-bindings/src/events/ReactDOMEventListener.js`
- `packages/react-dom-bindings/src/events/ReactDOMEventReplaying.js`
- `packages/react-dom-bindings/src/client/ReactDOMComponentTree.js`
- `packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js`
- `packages/react-dom-bindings/src/server/fizz-instruction-set/ReactDOMFizzInstructionSetInlineCodeStrings.js`

Supporting accepted reports also checked where relevant:

- Worker 088 container root marker oracle.
- Worker 089 root listener installation oracle.
- Worker 092 create-root facade plan.
- Worker 093 root render integration plan.
- Worker 094 root unmount/flushSync plan.
- Worker 121 root render/update/unmount e2e oracle.
- Worker 122 DOM container/listener shell.

No nested agents were spawned for this worker; all checks were local and
read-only except for this report file.

## Current Fast React State

Relevant implemented pieces:

- `packages/react-dom/client.js` still exports unsupported placeholders for
  `createRoot` and `hydrateRoot`.
- `packages/react-dom/profiling.js` still exports unsupported placeholders for
  `createRoot`, `hydrateRoot`, and `flushSync`.
- Worker 122 has landed private DOM container validation, root marker, and
  root/portal listener installation shell modules. These modules are useful
  prerequisites, but they do not implement public roots, event dispatch,
  hydration replay, DOM mutation commit, or hydratable marker parsing.
- `RootOptions` already reserves handles for hydration callbacks and
  `form_state`.
- `RootKind` reserves
  `ReservedUnsupportedHydration(UnsupportedHydrationKind::HydrationRoot)`.
- `HostRootState` already has `is_dehydrated`, a reserved unsupported
  hydration enum, cache/form/suspense placeholders, and a constructor that can
  represent unsupported hydration state.
- `FiberRootStore::create_client_root` creates only
  `RootKind::Client` roots and initializes HostRoot state through
  `HostRootState::client(..., options.form_state())`, which sets
  `is_dehydrated = false`.
- `update_container` and `update_container_sync` create normal HostRoot
  updates with a payload containing `{element}`-equivalent state. This is the
  non-hydration root render/update path.
- Core lane constants include hydration lanes, including selective hydration,
  but there is no hydration-specific scheduling API equivalent to React's
  `scheduleInitialHydrationOnRoot`.
- `HydrationHost` is present as a capability trait, but its current
  `can_hydrate_*` methods are boolean/null-style hooks and do not yet model
  typed marker results, skip reasons, mismatch diagnostics, boundary handles,
  form marker matching, or replay unblocking data.

Relevant missing pieces:

- No public `hydrateRoot` facade or hydration root object.
- No `create_hydration_root` / `create_hydration_container` equivalent.
- No initial hydration update with intentionally absent normal `{element}`
  payload.
- No hydration context/cursor (`nextHydratableInstance`, hydration parent,
  root/singleton context, reentry, reset).
- No typed Suspense/Activity dehydrated boundary state with tree context,
  retry lane, hydration errors, and dehydrated fragment child.
- No recoverable hydration error queue or internal mismatch exception path.
- No DOM hydratable marker parser.
- No event replay blocker detection, explicit hydration target queue,
  continuous replay queues, or form action replay integration.

## React 19.2.6 Boundary Evidence

`hydrateRoot` is not a `createRoot` option:

- React DOM `hydrateRoot(container, initialChildren, options)` validates the
  container, warns in development when `initialChildren` is missing, preserves
  the options object as hydration callbacks, reads root callbacks,
  `identifierPrefix`, transition callbacks, and `formState`, calls
  `createHydrationContainer`, marks the container, immediately installs
  delegated root listeners, and returns `ReactDOMHydrationRoot`.
- `ReactDOMHydrationRoot` shares `render` and `unmount` behavior with
  `ReactDOMRoot`, but additionally exposes
  `unstable_scheduleHydration(target)`, which calls
  `queueExplicitHydrationTarget(target)`.
- React DOM `createRoot` only warns for legacy `options.hydrate`; it does not
  hydrate, does not expose `unstable_scheduleHydration`, and does not create a
  dehydrated HostRoot.

Hydration root creation is a separate reconciler path:

- `createHydrationContainer` calls `createFiberRoot(..., hydrate = true, ...)`
  and stores initial root state with `isDehydrated: true`.
- The first hydration update intentionally has no normal payload. It is used to
  schedule work over existing server DOM, optionally bumping the lane through
  hydration-lane scheduling, then calls `scheduleInitialHydrationOnRoot`.
- Normal `updateContainer` creates an update whose payload is `{element}` and
  calls `scheduleUpdateOnFiber`; this is the path current Fast React is
  approaching for first real root render.

Hydration matching is a reconciler plus host state machine:

- `ReactFiberHydrationContext` owns entering/reentering hydration state,
  claiming hydratable element/text/Activity/Suspense/form marker instances,
  mismatch throwing, queued hydration errors, dev-only mismatch diffs,
  unhydrated tail checks, and reset/pop behavior.
- Activity and Suspense claims store dehydrated boundary state containing the
  host boundary handle, suspended tree context, retry lane, and hydration error
  storage, then create a dehydrated fragment child.
- Form marker claiming consumes DOM comments `F!` and `F`; `F!` is the marker
  that uses root `formState`.
- `ReactFiberShellHydration.isRootDehydrated(root)` exists specifically so DOM
  event replay can treat a dehydrated HostRoot container as an event blocker.

DOM/Fizz markers are typed DOM evidence, not strings in the facade:

- React DOM host config sets `supportsHydration = true`.
- Marker constants include Activity `&` and `/&`, Suspense `$`, `/$`, `$?`,
  `$~`, `$!`, and form markers `F!`/`F`.
- DOM matching uses element/text node type checks, hidden input skip rules,
  root/singleton skip behavior, hoistable/resource heuristics, and typed
  boundary/form marker logic.
- Boundary clear/hide/unhide owns nested marker depth and DOM mutation details,
  including preamble contribution markers for `html`, `head`, and `body`.
- Fizz emits marker bytes such as `<!--$-->`, `<!--$?--><template ...>`,
  `<!--$!--><template data-dgst=...>`, `<!--/$-->`, `<!--&-->`,
  `<!--/&-->`, `<!--F!-->`, and `<!--F-->`.
- The inline Fizz runtime mutates pending boundaries to `$~`, later back to
  `$`, can mark client-rendered boundaries as `$!`, and stores form replay
  submissions on `ownerDocument.$$reactFormReplay`.

Event replay is part of the hydration contract:

- `hydrateRoot` installs root listeners immediately, before hydration
  finishes.
- `findInstanceBlockingTarget` can return a Suspense boundary, Activity
  boundary, or dehydrated HostRoot container when a native event targets
  unhydrated content.
- Continuous events are queued and later cloned/replayed after unblocking.
- Capture-phase discrete events that require hydration attempt synchronous
  hydration and stop propagation when still blocked.
- `queueExplicitHydrationTarget` stores `{target, priority, blockedOn}` in
  priority order and tries to hydrate the nearest boundary at that priority.
- `retryIfBlockedOn` clears blockers, retries explicit hydration targets,
  schedules continuous replay, and drains form replay queues.
- DOM host commit hooks `commitHydratedContainer`,
  `commitHydratedActivityInstance`, and `commitHydratedSuspenseInstance` call
  `retryIfBlockedOn`.

## Required Hooks Before Public `hydrateRoot`

The following hooks or placeholders should exist before any public
`hydrateRoot` behavior is exposed:

1. Reconciler root constructor boundary:
   - A separate `create_hydration_root` / `create_hydration_container` API.
   - Root kind/state that cannot be confused with `RootKind::Client`.
   - HostRoot memoized state with `element`, `is_dehydrated = true`, cache,
     root `form_state`, and hydration callback handles.
   - A dedicated initial hydration update record without the normal
     `{element}` payload.
   - A scheduling hook equivalent to `scheduleInitialHydrationOnRoot`.

2. Hydration lane and retry boundary:
   - Hydration-lane bumping from requested lane to hydration lane.
   - `SelectiveHydrationLane` / explicit target hooks.
   - Boundary retry lane storage for Suspense and Activity.
   - Dehydrated HostRoot detection exported for DOM event replay.

3. Reconciler hydration context:
   - Hydration cursor and parent state.
   - Root/singleton context flag.
   - Enter, reenter, pop, and reset functions.
   - Element/text/Activity/Suspense/form marker claim functions.
   - Dehydrated fragment child creation.
   - Queued hydration errors, internal mismatch sentinel, recoverable-error
     upgrade, and dev mismatch diff storage.

4. Host hydration capability refinement:
   - Replace or extend boolean `can_hydrate_*` hooks with typed results:
     matched element, matched text, matched Suspense boundary, matched
     Activity boundary, matched form marker, skipped hydratable, and mismatch
     diagnostics.
   - Opaque boundary handles for clear/hide/unhide/commit-hydrated calls.
   - Explicit form marker result carrying matching vs non-matching `formState`.
   - Structured mismatch/dev-diff results rather than console strings.
   - A host callback for `flush_hydration_events` and commit-hydrated
     unblocking.

5. DOM marker and node-map hooks:
   - DOM comment/template marker parser for React 19.2.6 Fizz output.
   - Boundary traversal with nested depth.
   - Preamble singleton cleanup markers.
   - DOM node-to-fiber maps for hydratable elements/text/comments.
   - Current props storage during `hydrateInstance`.

6. Event replay hooks:
   - Blocked target detection for dehydrated HostRoot, Suspense, and Activity.
   - Continuous event queues and replay scheduling.
   - Discrete capture-phase hydration attempts.
   - Explicit hydration target priority queue.
   - `retryIfBlockedOn` bridge from commit/clear hooks.
   - Form replay queue drain from document/root.

7. Public facade/root object hooks:
   - Option parsing for `hydrateRoot` including root error callbacks,
     hydration callbacks, `identifierPrefix`, strict mode, transition
     callbacks where proven, and `formState`.
   - Shared `render`/`unmount` methods with normal roots after creation.
   - Extra `unstable_scheduleHydration` only on hydration root objects.
   - Container marker and listener installation using the private DOM shell.
   - Loud unsupported errors until lower hydration layers are present.

## Future Source Worker Touch Map

These are the files or areas a future source worker may touch, split to avoid
mixing root render, hydration, DOM markers, and event replay:

- Reconciler hydration root state:
  `crates/fast-react-reconciler/src/root_config.rs`,
  `crates/fast-react-reconciler/src/fiber_root.rs`,
  `crates/fast-react-reconciler/src/fiber_store.rs`,
  a new `crates/fast-react-reconciler/src/hydration.rs`,
  `crates/fast-react-reconciler/src/root_updates.rs`,
  `crates/fast-react-reconciler/src/root_scheduler.rs`,
  `crates/fast-react-reconciler/src/lib.rs`, and focused reconciler tests.
- Host hydration trait refinement:
  `crates/fast-react-host-config/src/lib.rs` and focused host-config tests.
- DOM marker parser and boundary operations:
  new private modules under `packages/react-dom/src/hydration/`, likely
  `markers.js`, `boundaries.js`, `form-state.js`, and `node-hydration.js`,
  plus focused smoke/conformance tests.
- DOM event replay:
  new private modules under `packages/react-dom/src/events/`, likely
  `event-replaying.js`, `current-replaying-event.js`, and
  `explicit-hydration-targets.js`, plus integration with
  `root-listeners.js` only after dispatch exists.
- Public `hydrateRoot` facade:
  `packages/react-dom/client.js`, `packages/react-dom/profiling.js`, and new
  private client modules such as
  `packages/react-dom/src/client/hydrate-root.js`,
  `packages/react-dom/src/client/hydration-root-object.js`,
  `packages/react-dom/src/client/root-object.js`, and
  `packages/react-dom/src/client/root-options.js`.
- Conformance/oracles:
  future `tests/conformance/src/react-dom-hydrate-root-*`,
  `tests/conformance/src/react-dom-hydration-event-replay-*`, and focused DOM
  hydration fixture oracles before any compatibility claim.

The first real root render source worker should stay on the non-hydration path:
`create_client_root`, `update_container`, scheduler, begin/complete work,
commit, and DOM mutation. It should not touch hydration marker parsing,
`hydrateRoot`, `unstable_scheduleHydration`, or event replay.

## Explicitly Unsupported Claims

These claims remain unsupported and should stay false in reports/oracles until
source and tests prove them:

- Fast React supports `hydrateRoot`.
- Fast React can hydrate server-rendered DOM.
- Fast React can selectively hydrate Suspense or Activity boundaries.
- Fast React can parse React DOM Fizz hydration markers at runtime.
- Fast React can handle `formState` / `useActionState` hydration markers.
- Fast React can replay blocked events during hydration.
- Fast React can drain Fizz form replay queues.
- Fast React can recover from hydration mismatches with React-compatible
  recoverable errors and dev warnings.
- Fast React can safely clear/hide/unhide dehydrated Suspense or Activity
  boundaries.
- Fast React root render can start as hydration and later fall back to normal
  client render without a dedicated hydration path.
- Current marker/listener shell support implies hydration compatibility.
- Current hydration lane constants imply hydration scheduling compatibility.

## Recommended Next Tasks

1. Keep the next source slice on non-hydration root render/commit plumbing.
2. Add a reconciler hydration root-state skeleton only after non-hydration
   HostRoot render/update/commit boundaries are stable.
3. Refine `HydrationHost` into typed results before implementing DOM marker
   parsing.
4. Add runtime DOM hydration fixture oracles for `hydrateRoot`, marker parsing,
   form markers, boundary clear/hide/unhide, mismatch callbacks, and event
   replay before exposing public behavior.
5. Implement DOM event replay only after general DOM event dispatch and node
   maps exist; listener installation alone is not enough.
6. Keep Fizz marker generation and client marker consumption in separate
   slices, joined only by checked marker contracts.

## Risks Or Blockers

- Hydration touches root state, lanes, Suspense/Activity, forms, resources,
  singletons, DOM node maps, event replay, and Fizz markers. A narrow facade
  implementation would create false compatibility.
- The current `HydrationHost` shape is too coarse for React DOM marker
  behavior; changing it later after users exist would be more expensive.
- Event replay depends on DOM target-to-fiber maps and event dispatch, not only
  listener installation.
- Hydration mismatch handling needs structured error queues and callback
  delivery; string-only diagnostics will not be compatible.
- Browser-backed tests will eventually be needed for native event replay,
  form submission, and DOM marker behavior. The existing deterministic DOM
  shims are useful but not complete hydration evidence.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-043-react-dom-hydration-plan.md
sed -n '1,260p' worker-progress/worker-049-react-dom-hydration-marker-oracle.md
sed -n '1,260p' worker-progress/worker-095-hydrate-root-facade-plan.md
sed -n '260,620p' worker-progress/worker-095-hydrate-root-facade-plan.md
sed -n '1,260p' worker-progress/worker-123-reconciler-fiber-root-host-root.md
sed -n '1,260p' crates/fast-react-reconciler/src/root_config.rs
sed -n '1,700p' crates/fast-react-reconciler/src/fiber_root.rs
sed -n '1,620p' crates/fast-react-reconciler/src/fiber_store.rs
sed -n '1,360p' crates/fast-react-reconciler/src/root_updates.rs
sed -n '1,280p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,360p' crates/fast-react-host-config/src/lib.rs
sed -n '1240,1370p' crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-core/src/lane.rs
sed -n '1,260p' crates/fast-react-core/src/root_lanes.rs
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,260p' packages/react-dom/profiling.js
rg --files packages/react-dom | sort
sed -n '1,240p' worker-progress/worker-088-dom-container-root-markers-oracle.md
sed -n '1,240p' worker-progress/worker-089-dom-root-listener-installation-oracle.md
sed -n '1,260p' worker-progress/worker-092-react-dom-create-root-facade-plan.md
sed -n '1,260p' worker-progress/worker-093-root-render-integration-plan.md
sed -n '1,260p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '1,260p' worker-progress/worker-121-root-render-e2e-oracle.md
sed -n '1,260p' worker-progress/worker-122-dom-container-listener-shell.md
git -C /Users/user/Developer/Developer/react-reference rev-parse HEAD
git -C /Users/user/Developer/Developer/react-reference describe --tags --exact-match HEAD
rg -n "function hydrateRoot|ReactDOMHydrationRoot|createHydrationContainer|queueExplicitHydrationTarget|listenToAllSupportedEvents|markContainerAsRoot|formState|hydrate" /Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMRoot.js
sed -n '250,390p' /Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMRoot.js
sed -n '175,285p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRoot.js
sed -n '283,353p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberReconciler.js
sed -n '1,120p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberShellHydration.js
sed -n '150,940p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHydrationContext.js
sed -n '1140,1345p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js
sed -n '3527,4210p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js
sed -n '120,680p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/ReactDOMEventListener.js
sed -n '1,680p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/ReactDOMEventReplaying.js
sed -n '1,260p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js
sed -n '4040,4335p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js
sed -n '1,260p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/server/fizz-instruction-set/ReactDOMFizzInstructionSetInlineCodeStrings.js
sed -n '1,220p' tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json
rg -n "marker|FORM_STATE|SUSPENSE|ACTIVITY|F!|F|compatibilityClaimed|mismatch|Hydration failed|won't be patched|\\$~|data-dgst|data-msg|data-stck|data-cstck" tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json
git status --short
```

## Verification

Passed:

- `git diff --check`
- scoped changed-path check, excluding pre-existing `.worker-logs/`, allowing
  only `worker-progress/worker-140-hydration-boundary-refresh.md`
- scoped no-index `git diff --check` for this untracked report file
- scoped conflict-marker/trailing-whitespace scan for this report file

Final status:

- `git status --short` shows only pre-existing `.worker-logs/` and this
  report as untracked paths.
