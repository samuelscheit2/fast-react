# worker-095-hydrate-root-facade-plan

## Objective

Produce a report-only plan for `hydrateRoot` public facade, hydration root
state, and replay hooks.

Write scope honored: this report is the only intended changed file. No source
code, package metadata, tests, generated artifacts, or orchestration files were
modified.

## Goal Tool Status

- `create_goal` succeeded for objective: Produce a report-only plan for
  hydrateRoot public facade, hydration root state, and replay hooks.
- `get_goal` succeeded immediately after setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Produce a report-only plan
  for hydrateRoot public facade, hydration root state, and replay hooks.

## Changed Files

- `worker-progress/worker-095-hydrate-root-facade-plan.md`

## Summary

`hydrateRoot` must be implemented as its own public facade over a reconciler
hydration root. It cannot be modeled as `createRoot(container, {hydrate: true})`
or as a flag on the normal create-root path. In React DOM 19.2.6, `hydrateRoot`
accepts required initial children, parses the normal root error callbacks plus
hydration-specific callbacks and `formState`, calls
`createHydrationContainer`, creates a root whose HostRoot state starts with
`isDehydrated: true`, schedules a special initial hydration update with no
normal `{element}` payload, marks the DOM container, installs delegated root
listeners immediately, and returns a hydration root object that shares
`render`/`unmount` with `createRoot` roots but additionally exposes
`unstable_scheduleHydration`.

Fast React should share root object code and root option parsing where React
does, but it should make the root kind explicit. A compatible implementation
needs `RootKind::Hydration` or equivalent, dehydrated HostRoot state,
recoverable hydration error queues, `formState` storage, DOM hydratable marker
matching, and event replay hooks that connect DOM listeners to reconciler
hydration scheduling. A fake implementation that first creates a normal root
and later tries to reuse DOM nodes would bypass the root cause: hydration is a
different initial root state and scheduling mode, not a rendering option.

## Current State

- `packages/react-dom/client.js` still exports loud placeholders for
  `createRoot` and `hydrateRoot`.
- `packages/react-dom/profiling.js` also exposes placeholder `createRoot`,
  `hydrateRoot`, and `flushSync`; profiling should call the same shared facade
  modules once normal client roots and hydration roots exist.
- `crates/fast-react-core/src/lane.rs` has React 19.2.6 lane primitives,
  including hydration lanes and `SelectiveHydrationLane`, but no root lane
  bookkeeping or hydration scheduling algorithms.
- `crates/fast-react-reconciler/src/lib.rs` is still a placeholder with no
  `FiberRoot`, HostRoot fiber, root scheduler, update queue, commit work, or
  hydration context.
- `crates/fast-react-host-config/src/lib.rs` already reserves a
  `HydrationHost` capability and host fiber token targets/phases for hydration,
  but its current hydration trait is still too boolean/coarse for React DOM's
  typed marker, mismatch, form-state, and replay behavior.
- The optional local reports for worker 049, worker 088, and worker 089 are
  absent from this worktree. Active sibling worker drafts exist for all three,
  but they are not merged local evidence for this report.

## Evidence Gathered

Required local inputs:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-043-react-dom-hydration-plan.md`
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`

Optional dependency status:

- `worker-progress/worker-049-react-dom-hydration-marker-oracle.md` is absent
  locally. A sibling draft exists but reports oracle generation/final
  verification still pending.
- `worker-progress/worker-088-dom-container-root-markers-oracle.md` is absent
  locally. A sibling draft records targeted test and regeneration success, with
  final hygiene checks still pending.
- `worker-progress/worker-089-dom-root-listener-installation-oracle.md` is
  absent locally. A sibling draft records detailed listener oracle coverage but
  still has pending final checks in its checklist.

Additional merged reports used:

- Worker 033 React DOM inventory: `react-dom/client` exports `createRoot`,
  `hydrateRoot`, and `version`; hydration is blocked on reconciler roots, DOM
  mutation, events, hydration markers, and Fizz compatibility.
- Worker 036 export oracle: locks the React DOM package/export surface and
  `react-server` throwing branches.
- Worker 041 events plan and worker 048 event-priority oracle: event priority
  is lane-backed and hydration replay is part of the DOM event system.
- Worker 042 server/Fizz plan: Fizz owns emitted Suspense/Activity/form marker
  bytes; client hydration consumes those markers.
- Worker 044 and worker 055 client-root plans: public roots are handles over a
  reconciler `FiberRoot`; `ReactDOMHydrationRoot` shares `render` and `unmount`
  with `ReactDOMRoot`.
- Sibling worker 092, 093, and 094 drafts: useful non-merged cross-checks for
  create-root facade, `root.render`, and root unmount/`flushSync` boundaries.

Pinned React 19.2.6 source evidence checked directly:

- `packages/react-dom/src/client/ReactDOMRoot.js`: `hydrateRoot` validates the
  container, warns in development when initial children are omitted, parses
  root callbacks/options plus `formState`, calls `createHydrationContainer`,
  marks the container, installs root listeners, and returns
  `ReactDOMHydrationRoot`. The same file shows `createRoot` only warns on a
  legacy `options.hydrate` field and tells callers to use `hydrateRoot`.
- `packages/react-reconciler/src/ReactFiberRoot.js`: `createFiberRoot` stores
  root callbacks, `formState`, optional hydration callbacks, and initial
  HostRoot state `{ element: initialChildren, isDehydrated: hydrate, cache }`.
- `packages/react-reconciler/src/ReactFiberReconciler.js`:
  `createHydrationContainer` calls `createFiberRoot` with `hydrate = true`,
  creates an initial hydration update without a normal payload, optionally
  bumps the lane to a hydration lane, and calls `scheduleInitialHydrationOnRoot`.
- `packages/react-reconciler/src/ReactFiberShellHydration.js` exposes
  `isRootDehydrated(root)` for React DOM event replay to detect dehydrated
  HostRoot blockers.
- `packages/react-reconciler/src/ReactFiberHydrationContext.js` owns the
  hydratable cursor, Suspense/Activity dehydrated boundary state, form marker
  claiming, hydration mismatch exceptions, and queued hydration errors.
- `packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js` declares
  `supportsHydration = true`, recognizes `F!`/`F` form markers, clears
  Suspense/Activity boundaries, commits hydrated root/boundary instances, and
  calls `retryIfBlockedOn` from those commit/clear paths.
- `packages/react-dom-bindings/src/events/ReactDOMEventReplaying.js` owns
  continuous event queues, explicit hydration target priority sorting,
  `retryIfBlockedOn`, form action replay queues, and replay scheduling.
- `packages/react-reconciler/src/ReactFiberWorkLoop.js` delivers recoverable
  errors through `root.onRecoverableError(error, { componentStack })` during
  commit at discrete update priority.

Nested agents:

- Spawned one read-only nested agent to test the hypothesis that `hydrateRoot`
  is a distinct facade/root kind and not a `createRoot` option flag.
- Spawned one read-only nested agent to test the replay-hook and root-object
  sharing hypothesis.
- Both nested agents returned before handoff. They confirmed the local
  conclusions: `hydrateRoot` can share `_internalRoot`, `render`, `unmount`,
  validation/option parsing, root marking, and listener setup helpers with
  `createRoot`, but it must remain a distinct facade/root kind because it has
  required initial children, `formState`, hydration callbacks,
  `createHydrationContainer`, dehydrated HostRoot state, initial hydration
  scheduling, and `unstable_scheduleHydration`.
- The replay/root-state agent independently confirmed that current placeholders
  plus the missing reconciler root, HostRoot queue, scheduler, and hydration
  context make hydration compatibility unclaimable until explicit root
  dehydration state and event replay hooks exist.

## Why `hydrateRoot` Cannot Be A `createRoot` Option Flag

React DOM's source makes the separation explicit. `createRoot` treats
`options.hydrate` as a development warning path and still calls
`createContainer`. It does not create a dehydrated HostRoot, does not pass
hydration callbacks or `formState`, does not schedule initial hydration work,
does not parse Fizz markers, does not expose `unstable_scheduleHydration`, and
does not have an initial children argument.

`hydrateRoot` has different public and internal contracts:

- Public call shape: `hydrateRoot(container, initialChildren, options)`. The
  second argument is required by API contract; React 19.2.6 warns in
  development when it is `undefined`.
- Root creation path: it calls `createHydrationContainer`, not
  `createContainer`.
- Root kind/state: the HostRoot initial state stores the initial children and
  starts with `isDehydrated: true`.
- Initial scheduling: the first hydration update intentionally has no normal
  update payload; it exists to schedule matching against server-rendered DOM.
- Options: the options bag also serves as hydration callbacks, and
  `formState` is passed to the root for `useActionState` form marker matching.
- Event timing: delegated root listeners are installed immediately because
  events can target dehydrated boundaries before the tree fully hydrates.
- Public object shape: hydration roots share `render` and `unmount` but have
  the extra `unstable_scheduleHydration(target)` method.

Fast React should therefore encode a root discriminator such as
`RootKind::Concurrent` versus `RootKind::Hydration`. Sharing helper modules is
correct; sharing one root creation mode with a boolean flag would make it too
easy for normal roots to accidentally accept hydration-only behavior or for
hydration roots to miss required state.

## Public Facade Plan

Target facade behavior for a future implementation worker:

1. Keep `react-server` condition behavior narrowed: `react-dom/client` and
   `react-dom/profiling` RSC branches throw their unsupported entrypoint
   errors before root creation.
2. Validate the container with the same DOM container validator as
   `createRoot`. Invalid containers throw `Target container is not a DOM
   element.` before markers, listeners, or internal root allocation.
3. Warn in development for duplicate root markers using the shared DOM root
   marker layer. This should use the same warning helper as `createRoot`.
4. Warn in development when `initialChildren === undefined`, but confirm the
   exact warning/continuation behavior with a public oracle before matching it.
5. Parse shared root options:
   - `unstable_strictMode === true`
   - `identifierPrefix`
   - `onUncaughtError`
   - `onCaughtError`
   - `onRecoverableError`
   - stable feature-gated transition/default-indicator options only when the
     published 19.2.6 bundle exposes them observably
6. Preserve the whole options object as hydration callbacks for the
   reconciler/host hydration callback path.
7. Read `options.formState` and store it on the internal root.
8. Call a private `createHydrationContainer` bridge with
   `initialChildren`, `container`, root options, hydration callbacks, and
   `formState`.
9. Mark the DOM container as root only after internal root creation succeeds.
10. Call `listenToAllSupportedEvents(container)` immediately. Hydration does
    not use the comment-container parent normalization that `createRoot` has,
    because hydration does not work on comment containers.
11. Return a `ReactDOMHydrationRoot` public object.

The facade should not claim DOM hydration matching by itself. If lower layers
are still missing, `hydrateRoot` should remain unsupported or return a guarded
root only for oracle-covered partial behavior. A public method that silently
client-renders would hide the missing hydration model.

## Root Object Sharing

Fast React should share one root-object implementation module with a root-kind
parameter:

- `ReactDOMRoot` public object: own `_internalRoot`; prototype `render` and
  `unmount`; no `unstable_scheduleHydration`.
- `ReactDOMHydrationRoot` public object: own `_internalRoot`; shares the exact
  `render` and `unmount` prototype functions; additionally has
  `unstable_scheduleHydration`.
- `root.render(children)` remains the normal `updateContainer(children, root,
  null, null)` path after hydration has completed or when a hydrated root is
  updated later. It must not reenter initial hydration scheduling.
- `root.unmount()` shares the normal root unmount path from worker 094: clear
  `_internalRoot`, enqueue a sync `null` HostRoot update, flush sync work, then
  unmark the container.
- Public descriptor tests should verify own keys, prototype keys, method
  identity sharing where observable, return values, and absence/presence of
  `unstable_scheduleHydration`.

This sharing should be implemented by factoring `root-object.js` around shared
methods and separate constructors. Do not duplicate `render` and `unmount` in
hydration-specific files; divergence there would create subtle lifecycle bugs.

## Hydration Root State Plan

Future reconciler/root work should add explicit structures before any public
`hydrateRoot` behavior is claimed:

- `RootKind::Hydration` or a root tag/flag that cannot be confused with a
  normal concurrent root.
- HostRoot memoized state with `element`, `is_dehydrated`, and `cache`.
- Root-owned hydration callbacks and `form_state`.
- Root-owned error callbacks, especially `on_recoverable_error`.
- Initial hydration update scheduling that creates an update without the
  normal `{element}` payload and calls a dedicated
  `schedule_initial_hydration_on_root`.
- Hydration lane bumping hooks using the existing hydration lane constants.
- Dehydrated HostRoot detection for event replay.
- Hydration cursor state: next hydratable node, hydration parent fiber,
  root/singleton context, dev diff state, and reset/reentry behavior.
- Dehydrated Suspense and Activity boundary state: opaque host boundary handle,
  tree context, retry lane, queued hydration errors, and a dehydrated fragment
  child.
- Form marker claiming: `F!` means use the root `formState`; `F` means do not.
- Queued hydration mismatch errors that can be upgraded to recoverable errors
  after client recovery.

The current host-config `HydrationHost` trait reserves useful method names, but
future work should refine it to typed results rather than plain booleans:
matched element, matched text, matched Suspense boundary, matched Activity
boundary, matched form marker, skip, mismatch, and dev-diff diagnostics.

## Recoverable Errors

Hydration error handling needs first-class state, not string-only diagnostics:

- Fatal hydration mismatches should create structured captured errors, queue
  them on the hydration context, throw an internal hydration mismatch exception,
  and force client rendering for the affected tree.
- Successful hydration with prop/text differences can still produce dev-only
  mismatch warnings that "won't be patched up"; this is separate from fatal
  mismatch recovery.
- `upgradeHydrationErrorsToRecoverable` moves queued hydration errors into the
  root's recoverable error list when React recovers by client rendering.
- The commit path invokes `root.onRecoverableError(error, errorInfo)` at
  discrete update priority with current transition cleared/restored.
- The `errorInfo.digest` compatibility warning belongs to error-info creation,
  not to a DOM facade wrapper.

Implementation tests must cover both callback storage and delivery. A facade
that only stores `onRecoverableError` but never routes hydration failures
through the recoverable-error queue should not remove the placeholder.

## `formState`

`formState` is a root creation option consumed by hydration, not a normal
create-root option:

- `hydrateRoot` reads `options.formState` and passes it to
  `createHydrationContainer`/`createFiberRoot`.
- The FiberRoot stores `formState` so `useActionState` hydration can decide
  whether a claimed Fizz form marker should use the root state.
- DOM hydration recognizes comment marker data `F!` and `F`; the reconciler's
  form marker claim returns true only for the matching marker.
- Form action replay also depends on hydration unblocking. `retryIfBlockedOn`
  inspects document/root `$$reactFormReplay` queues and dispatches actions once
  form props or submitter actions are hydrated.

Future tests should isolate `formState` from generic root options. Passing
`formState` to `createRoot` should not activate hydration behavior.

## `unstable_scheduleHydration`

`ReactDOMHydrationRoot.prototype.unstable_scheduleHydration(target)` should be
the public wrapper over explicit hydration target queuing:

- If `target` is truthy, call the DOM replay module's
  `queueExplicitHydrationTarget(target)`.
- The queue captures the current resolved update priority and inserts targets
  ahead of lower-priority entries.
- The first queued target attempts hydration immediately.
- Attempting an explicit target finds the nearest mounted fiber, detects
  Suspense/Activity blockers, and calls reconciler hydration at the queued
  priority.
- `retryIfBlockedOn` clears matching blockers and reattempts queued explicit
  targets in priority order.

This method must exist only on hydration root objects. Normal `createRoot`
objects should fail an own/prototype property check for
`unstable_scheduleHydration`.

## Event Replay Hooks

Hydration replay is part of the correctness model:

- Root listeners must be installed during `hydrateRoot` before hydration has
  completed.
- Event target lookup must detect blockers: dehydrated HostRoot containers,
  Suspense boundaries, and Activity boundaries.
- Discrete capture-phase events that require hydration should attempt
  synchronous hydration and stop native propagation if still blocked. `submit`
  is intentionally not in the discrete replayable list.
- Continuous replay queues should store the latest focus, drag, and mouse
  events, plus pointer/pointer-capture maps by pointer id, then clone and
  redispatch after unblocking.
- `unstable_scheduleHydration` uses the explicit hydration target queue and
  priority sorting described above.
- `commitHydratedContainer`, `commitHydratedActivityInstance`, and
  `commitHydratedSuspenseInstance` call `retryIfBlockedOn`.
- Clearing Suspense/Activity boundaries also calls `retryIfBlockedOn`.
- `flushHydrationEvents` must remain available for the change-event replay
  feature flag path.
- Form replay queues live on the document/root and are drained from
  `retryIfBlockedOn`.

Ownership split:

- DOM adapter owns native event listener installation, DOM target lookup,
  native event cloning/redispatch, pointer maps, form replay queues, and
  Fizz marker parsing.
- Reconciler owns dehydration state, boundary retry lanes, initial hydration
  scheduling, `attemptSynchronousHydration`, `attemptContinuousHydration`, and
  `attemptHydrationAtCurrentPriority`.
- Host-config owns typed hydration operations and commit hooks; it should not
  expose DOM comments or JS event objects to the core.

## Future Write Scopes And Tests

Hydrate-root public oracle:

- Write scope:
  `tests/conformance/src/react-dom-hydrate-root-*.mjs`,
  `tests/conformance/scripts/*react-dom-hydrate-root*.mjs`,
  `tests/conformance/test/react-dom-hydrate-root-oracle.test.mjs`,
  `tests/conformance/oracles/react-19.2.6-react-dom-hydrate-root-oracle.json`,
  `worker-progress/worker-react-dom-hydrate-root-oracle.md`
- Tests: export descriptors, `react-server` throw, invalid container throw,
  missing initial-children development warning and production behavior,
  duplicate-root warning, option parsing, `formState`, root callback storage
  observations, root object descriptors, and
  `unstable_scheduleHydration` presence only on hydration roots.

Hydration root state:

- Write scope:
  `crates/fast-react-reconciler/src/fiber_root.rs`,
  `crates/fast-react-reconciler/src/hydration.rs`,
  `crates/fast-react-reconciler/src/root_updates.rs`,
  `crates/fast-react-reconciler/src/lib.rs`,
  `worker-progress/worker-reconciler-hydration-root-state.md`
- Tests: `RootKind::Hydration`, `is_dehydrated`, initial root state element
  storage, root `form_state`, hydration callback storage, initial hydration
  update with no `{element}` payload, hydration lane bumping, dehydrated
  HostRoot detection, boundary dehydrated state, and recoverable hydration
  error queue upgrade.

Host hydration trait refinement:

- Write scope:
  `crates/fast-react-host-config/src/lib.rs`,
  `worker-progress/worker-host-hydration-trait-refinement.md`
- Tests: typed hydratable match result enums, form marker match results,
  Suspense/Activity boundary handles, mismatch diagnostics, token phase/target
  validation for hydration, and structured unsupported-capability errors.

DOM marker and form-state oracle:

- Write scope:
  `tests/conformance/src/react-dom-hydration-marker-*.mjs`,
  `tests/conformance/scripts/*react-dom-hydration-marker*.mjs`,
  `tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`,
  `tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json`,
  `worker-progress/worker-react-dom-hydration-marker-oracle.md`
- Tests: Fizz Suspense/Activity markers, `F!`/`F` form markers, pending/queued
  Suspense states, error template attributes, hidden input skipping, root or
  singleton context skip rules, mismatch warnings, and no concrete path leaks.
  Consume worker 049 if it lands first.

DOM hydration marker implementation:

- Write scope:
  `packages/react-dom/src/hydration/markers.js`,
  `packages/react-dom/src/hydration/boundaries.js`,
  `packages/react-dom/src/hydration/form-state.js`,
  related focused tests, and a worker report.
- Tests: typed marker parsing, nested boundary clear depth, hide/unhide for
  dehydrated boundaries, preamble contribution cleanup, form marker matching,
  and no direct HTML parsing in client hydration.

Hydration event replay:

- Write scope:
  `packages/react-dom/src/events/event-replaying.js`,
  `packages/react-dom/src/events/current-replaying-event.js`,
  `packages/react-dom/src/hydration/explicit-targets.js`,
  `tests/conformance/src/react-dom-hydration-event-replay-*.mjs`,
  `worker-progress/worker-dom-hydration-event-replay.md`
- Tests: blocked dehydrated HostRoot/Suspense/Activity detection, discrete
  capture hydration attempts, propagation stop when still blocked, continuous
  replay latest-event semantics, pointer-id maps, explicit target priority
  ordering, `retryIfBlockedOn`, `flushHydrationEvents`, and form action replay.

`hydrateRoot` facade implementation:

- Write scope:
  `packages/react-dom/client.js`,
  `packages/react-dom/profiling.js`,
  `packages/react-dom/src/client/hydrate-root.js`,
  `packages/react-dom/src/client/hydration-root-object.js`,
  `packages/react-dom/src/client/root-object.js`,
  `packages/react-dom/src/client/root-options.js`,
  `tests/smoke/react-dom-hydrate-root.mjs`,
  `tests/conformance/src/react-dom-hydrate-root-fast-*.mjs`,
  `worker-progress/worker-hydrate-root-facade.md`
- Tests: comparison against the hydrate-root oracle, shared `render`/`unmount`
  behavior with `createRoot`, `unstable_scheduleHydration` routing, container
  mark/listener side effects, profiling/client shared implementation, RSC
  throws, and preservation of loud placeholders for still-unimplemented
  hydration matching if needed.

Integration gate before claiming compatibility:

- `createRoot` facade/root object behavior is merged.
- DOM container markers and root listener installation are merged or backed by
  checked oracles.
- Reconciler root records, HostRoot update queues, root scheduler, and commit
  skeleton exist.
- DOM hydratable marker parsing and event replay hooks exist.
- Recoverable errors and JS callback handle lifetime rules are implemented.

## Recommended Next Tasks

1. Land a checked `hydrateRoot` public oracle before implementation.
2. Implement reconciler hydration root state and typed host hydration results
   before any DOM facade behavior is exposed.
3. Implement DOM marker/form-state parsing and hydration event replay hooks as
   separate slices.
4. Wire the final `hydrateRoot` facade only after shared `createRoot`
   root-object work, DOM root markers, and listener installation are available.

## Risks Or Blockers

- Worker 049, worker 088, and worker 089 evidence is not merged in this
  worktree. Future implementation should consume merged or regenerated oracles
  instead of relying on active sibling drafts.
- `hydrateRoot` is blocked on `createRoot` shared root-object/facade work, DOM
  container markers, listener installation, reconciler roots, root scheduler,
  HostRoot update queues, commit traversal, DOM mutation, hydration marker
  matching, and event replay.
- Current `HydrationHost` trait shape is probably insufficient for React DOM
  marker and mismatch compatibility. Breaking trait changes are preferable to
  bolting typed behavior onto booleans later.
- Missing callback-handle lifetime rules across JS/Rust could make root error
  callbacks, recoverable errors, refs, form actions, and hydration callbacks
  unsafe or leak-prone.
- Browser-backed tests will be needed for real event replay, native event
  cloning, form submission behavior, and passive listener interactions. A
  minimal DOM shim is useful but not enough for full behavior claims.
- Feature-gated transition callbacks/default transition indicators should not
  be exposed from stable 19.2.6 behavior without oracle proof.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan keeps `hydrateRoot` tied to the reconciler hydration path and
  published React DOM 19.2.6 behavior, not a facade-local DOM reuse shortcut.
- Merged evidence is separated from active sibling-worker drafts.

Maintainability:

- Public facade, root object sharing, reconciler hydration state, host
  hydration traits, DOM markers, event replay, and Fizz marker production are
  split into separate future write scopes.
- The plan recommends explicit root-kind modeling so create-root and hydration
  behavior can share code without sharing incompatible state.

Performance:

- Selective hydration, priority-sorted explicit targets, and latest-event
  continuous replay preserve React's interactivity model.
- A full-root synchronous hydration fallback is intentionally rejected as a
  compatibility and performance trap.

Security:

- Hydration should inspect DOM nodes and structured comment/attribute markers;
  it should not parse serialized HTML strings in the client path.
- Fizz error attributes, form replay queues, resource/singleton cleanup, and
  user callbacks are security-sensitive and need structured handling.
- JS callback handles must be rooted and invalidated on unmount so stale
  hydration/replay callbacks cannot observe freed roots.

## Commands Run

Tool actions:

- `create_goal` for this worker objective before research, file reads,
  implementation, or verification.
- `get_goal` immediately after setup to record active objective/status.
- `spawn_agent` for two read-only nested hypothesis checks.
- `wait_agent` with a short timeout for those nested agents, followed by local
  verification while they continued.
- `wait_agent` for the remaining nested agent before final report verification.

Shell commands:

```sh
git status --short
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '261,340p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '261,380p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-043-react-dom-hydration-plan.md
sed -n '261,360p' worker-progress/worker-043-react-dom-hydration-plan.md
sed -n '1,280p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '281,340p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
test -f worker-progress/worker-049-react-dom-hydration-marker-oracle.md && sed -n '1,260p' worker-progress/worker-049-react-dom-hydration-marker-oracle.md || true
test -f worker-progress/worker-088-dom-container-root-markers-oracle.md && sed -n '1,260p' worker-progress/worker-088-dom-container-root-markers-oracle.md || true
test -f worker-progress/worker-089-dom-root-listener-installation-oracle.md && sed -n '1,260p' worker-progress/worker-089-dom-root-listener-installation-oracle.md || true
test -f worker-progress/worker-095-hydrate-root-facade-plan.md && sed -n '1,260p' worker-progress/worker-095-hydrate-root-facade-plan.md || true
wc -l worker-progress/worker-043-react-dom-hydration-plan.md worker-progress/worker-055-react-dom-client-roots-implementation-plan.md MASTER_PLAN.md MASTER_PROGRESS.md
rg --files packages/react-dom crates/fast-react-core/src crates/fast-react-reconciler/src crates/fast-react-host-config/src tests/conformance | sed -n '1,260p'
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,260p' packages/react-dom/profiling.js
sed -n '1,320p' packages/react-dom/placeholder-utils.js
sed -n '1,340p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '341,520p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,360p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '361,620p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,340p' worker-progress/worker-042-react-dom-server-fizz-plan.md
sed -n '341,620p' worker-progress/worker-042-react-dom-server-fizz-plan.md
sed -n '1,300p' worker-progress/worker-033-react-dom-inventory.md
sed -n '301,620p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,260p' worker-progress/worker-036-react-dom-export-oracle.md
sed -n '1,300p' worker-progress/worker-048-react-dom-event-priority-oracle.md
sed -n '1,340p' crates/fast-react-host-config/src/lib.rs
sed -n '340,760p' crates/fast-react-host-config/src/lib.rs
sed -n '760,1180p' crates/fast-react-host-config/src/lib.rs
sed -n '1260,1365p' crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,260p' crates/fast-react-core/src/lane.rs
sed -n '260,620p' crates/fast-react-core/src/lane.rs
rg -n "Hydration|hydrate|Hydrat|HostScheduling|CurrentUpdate|EventPriority|Portal|prepare_portal|Form|Resource|Singleton|HostFiberToken" crates/fast-react-host-config/src/lib.rs
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMRoot.js | sed -n '175,245p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMRoot.js | sed -n '240,380p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMRoot.js | rg -n "ReactDOMRoot\\.prototype|ReactDOMHydrationRoot\\.prototype|render =|unmount =|unstable_scheduleHydration" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberRoot.js | sed -n '150,285p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberReconciler.js | sed -n '300,500p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberShellHydration.js | sed -n '1,160p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberHydrationContext.js | rg -n "enterHydrationState|isDehydrated|formState|FormMarker|queueHydrationError|upgradeHydrationErrorsToRecoverable|tryToClaimNextHydratable|popHydrationState|dehydrated" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberHydrationContext.js | sed -n '500,540p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberWorkLoop.js | rg -n "onRecoverableError|recoverableErrors|makeErrorInfo|reportGlobalError|root\\.onRecoverableError" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventReplaying.js | rg -n "discreteReplayableEvents|queueExplicitHydrationTarget|attemptExplicitHydrationTarget|retryIfBlockedOn|queueIfContinuousEvent|attemptReplayContinuousQueuedEvent|queuedExplicitHydrationTargets|formReplaying|dispatchReplayedFormAction|SelectiveHydration|runWithPriority" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | rg -n "commitHydratedContainer|commitHydratedActivityInstance|commitHydratedSuspenseInstance|retryIfBlockedOn|FORM_STATE_IS_MATCHING|canHydrateFormStateMarker|clearSuspenseBoundary|clearActivityBoundary|flushHydrationEvents|supportsHydration" -C 3
```

Final audit and verification commands:

```sh
nl -ba worker-progress/worker-095-hydrate-root-facade-plan.md | sed -n '1,180p'
nl -ba worker-progress/worker-095-hydrate-root-facade-plan.md | sed -n '480,700p'
for p in ../fast-react-worker-049-react-dom-hydration-marker-oracle/worker-progress/worker-049-react-dom-hydration-marker-oracle.md ../fast-react-worker-088-dom-container-root-markers-oracle/worker-progress/worker-088-dom-container-root-markers-oracle.md ../fast-react-worker-089-dom-root-listener-installation-oracle/worker-progress/worker-089-dom-root-listener-installation-oracle.md ../fast-react-worker-092-react-dom-create-root-facade-plan/worker-progress/worker-092-react-dom-create-root-facade-plan.md ../fast-react-worker-093-root-render-integration-plan/worker-progress/worker-093-root-render-integration-plan.md ../fast-react-worker-094-root-unmount-flushsync-plan/worker-progress/worker-094-root-unmount-flushsync-plan.md; do if [ -f "$p" ]; then printf 'FOUND %s\n' "$p"; else printf 'MISSING %s\n' "$p"; fi; done
sed -n '1,180p' ../fast-react-worker-049-react-dom-hydration-marker-oracle/worker-progress/worker-049-react-dom-hydration-marker-oracle.md
sed -n '1,180p' ../fast-react-worker-088-dom-container-root-markers-oracle/worker-progress/worker-088-dom-container-root-markers-oracle.md
sed -n '1,180p' ../fast-react-worker-089-dom-root-listener-installation-oracle/worker-progress/worker-089-dom-root-listener-installation-oracle.md
sed -n '1,220p' ../fast-react-worker-092-react-dom-create-root-facade-plan/worker-progress/worker-092-react-dom-create-root-facade-plan.md
sed -n '1,180p' ../fast-react-worker-093-root-render-integration-plan/worker-progress/worker-093-root-render-integration-plan.md
sed -n '1,180p' ../fast-react-worker-094-root-unmount-flushsync-plan/worker-progress/worker-094-root-unmount-flushsync-plan.md
git status --short
rg -n '(/[U]sers/|/[p]rivate/var|/var/[f]olders|/[t]mp/|<{7}|={7}|>{7})' worker-progress/worker-095-hydrate-root-facade-plan.md || true
perl -ne 'print "$ARGV:$.: trailing whitespace\n" if /[ \t]$/' worker-progress/worker-095-hydrate-root-facade-plan.md
git diff --check -- worker-progress/worker-095-hydrate-root-facade-plan.md
git diff --check --no-index /dev/null worker-progress/worker-095-hydrate-root-facade-plan.md; rc=$?; if [ "$rc" -gt 1 ]; then exit "$rc"; fi; exit 0
rg -n 'initial children|initialChildren|RootKind::Hydration|is_dehydrated|isDehydrated|recoverable|formState|unstable_scheduleHydration|Event Replay Hooks|Root Object Sharing|Why `hydrateRoot` Cannot|Future Write Scopes|hydrateRoot` facade implementation|No source tests|Verification' worker-progress/worker-095-hydrate-root-facade-plan.md
```

No source tests were run because this worker is report-only.

## Verification

Report verification passed:

- scoped status check: only
  `worker-progress/worker-095-hydrate-root-facade-plan.md` is untracked.
- scoped local/temp path and conflict-marker check: no matches.
- scoped trailing-whitespace check: no output.
- scoped `git diff --check`: no output.
- scoped no-index whitespace check for this untracked report: no output.
- requirement coverage scan found the required topics in this report:
  initial children, explicit hydration root kind, dehydrated root state,
  recoverable errors, `formState`, `unstable_scheduleHydration`, event replay
  hooks, root object sharing, future write scopes/tests, and the explanation
  for why `hydrateRoot` cannot be a `createRoot` option flag.

## Completion Audit

Objective restated: produce a report-only plan, in
`worker-progress/worker-095-hydrate-root-facade-plan.md`, for the
`hydrateRoot` public facade, hydration root state, and replay hooks, without
source-code changes.

Prompt-to-artifact checklist:

- Write only the assigned report: satisfied by `git status --short`, which
  shows only `worker-progress/worker-095-hydrate-root-facade-plan.md`.
- Call and record goal tools: satisfied by the Goal Tool Status section.
- Read the required worker context files and avoid `ORCHESTRATOR.md`:
  satisfied by Evidence Gathered and Commands Run.
- Cover initial children requirement: satisfied in Summary, Why
  `hydrateRoot` Cannot Be A `createRoot` Option Flag, and Public Facade Plan.
- Cover hydration root kind and dehydrated root state: satisfied in Summary,
  Why `hydrateRoot` Cannot Be A `createRoot` Option Flag, and Hydration Root
  State Plan.
- Cover recoverable errors: satisfied in Recoverable Errors and future
  hydration root-state tests.
- Cover `formState`: satisfied in the dedicated `formState` section and future
  DOM marker/form-state oracle scope.
- Cover `unstable_scheduleHydration`: satisfied in the dedicated section and
  hydration facade/replay test scopes.
- Cover event replay hooks: satisfied in Event Replay Hooks and hydration event
  replay future scope.
- Cover root object sharing with `createRoot`: satisfied in Root Object Sharing
  and nested-agent findings.
- State why `hydrateRoot` cannot be a `createRoot` option flag: satisfied in
  the dedicated section.
- Include future write scopes and tests: satisfied in Future Write Scopes And
  Tests plus Recommended Next Tasks.
- Verify report-only scope with standard report checks: satisfied by
  Verification.
