# worker-092-react-dom-create-root-facade-plan

## Summary

This is a report-only plan for the React DOM `createRoot` public facade and
returned non-hydration root object. No source code was changed.

Fast React should not implement `createRoot` as a package-level shortcut that
directly mutates a DOM container. In React DOM 19.2.6, `createRoot` is a public
facade over a concurrent reconciler root: it validates a DOM container, parses
root options, creates a HostRoot container, marks the DOM container, installs
delegated root listeners, and returns a small root object. The root object's
`render` and `unmount` methods then delegate to reconciler update APIs.

The compatible facade should land only after the lower layers exist. In this
checkout, `react-dom/client` and `react-dom/profiling` still expose loud
unsupported placeholders, the reconciler has no `FiberRoot` or HostRoot update
queue, DOM root markers/listener installation are not implemented, and the
optional worker 088/089 oracle reports are absent.

## Goal Tool Status

- `create_goal` was available and was called before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after goal setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: `Produce a report-only plan
  for the React DOM createRoot public facade and root object.`
- `update_goal(status: "complete")` must be called only after the final scoped
  report checks pass; this report records the pre-completion goal state.

## Changed Files

- `worker-progress/worker-092-react-dom-create-root-facade-plan.md`

## Current State

- `packages/react-dom/client.js` exports placeholder `createRoot`,
  `hydrateRoot`, and `version`.
- `packages/react-dom/profiling.js` exports placeholder `createRoot`,
  `hydrateRoot`, `flushSync`, root DOM APIs, resource hint APIs, form APIs, and
  `version`.
- `packages/react-dom/client.react-server.js` and
  `packages/react-dom/profiling.react-server.js` already throw the unsupported
  React Server Components entrypoint errors.
- `crates/fast-react-core` has lane primitives, but this checkout has no root
  lane bookkeeping or event priority type.
- `crates/fast-react-reconciler` still has placeholder scheduling/render entry
  points and no `FiberRoot`, HostRoot fiber, update queues, root scheduler,
  commit traversal, or `flushSyncWork`.
- `crates/fast-react-host-config` has token-aware host boundary types such as
  `HostFiberTokenRef`, `HostScheduling`, `PortalHost`, `HydrationHost`, and
  `MutationRenderer`, but reconciler token production, DOM node maps, and DOM
  root lifecycle behavior are still prerequisites.
- `git status --short` showed an untracked root `Cargo.lock` before this report
  was rewritten. Per worker policy, that regenerable artifact was left alone.

## Evidence Gathered

Required inputs:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-036-react-dom-export-oracle.md`
- `worker-progress/worker-044-react-dom-client-roots-plan.md`
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`

Optional dependency reports:

- `worker-progress/worker-088-dom-container-root-markers-oracle.md` was absent.
- `worker-progress/worker-089-dom-root-listener-installation-oracle.md` was
  absent.

Supporting local evidence:

- `worker-progress/worker-033-react-dom-inventory.md`
- `worker-progress/worker-037-react-dom-type-inventory.md`
- `worker-progress/worker-040-dom-mutation-renderer-plan.md`
- `worker-progress/worker-041-dom-events-priority-plan.md`
- `worker-progress/worker-043-react-dom-hydration-plan.md`
- `worker-progress/worker-048-react-dom-event-priority-oracle.md`
- `worker-progress/worker-051-dom-host-token-boundary.md`
- `worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md`
- `packages/react-dom/client.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/index.js`
- `packages/react-dom/placeholder-utils.js`
- `packages/react-dom/package.json`
- `crates/fast-react-core/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-host-config/src/lib.rs`

Direct React DOM 19.2.6 tarball probe:

- Exact tarballs for `react@19.2.6`, `react-dom@19.2.6`, and
  `scheduler@0.27.0` were extracted to a temporary directory and removed after
  probing.
- The probe observed `react-dom/client` export keys `createRoot`,
  `hydrateRoot`, and `version`.
- The probe observed `react-dom/profiling.createRoot` as a function.
- The probe observed a non-hydration root object with one own `_internalRoot`
  property, prototype `constructor`, `render`, and `unmount`, no
  `unstable_scheduleHydration`, `render` and `unmount` returning `undefined`,
  and `root.render` after unmount throwing `Cannot update an unmounted root.`
- The probe observed delegated listener installation on the root container and
  owner-document `selectionchange` installation.
- The probe observed a duplicate `createRoot` development warning and the
  `root.render` callback-argument development warning.

Nested agents:

- Explorer `019e0eea-5735-7ad2-9e17-2ebdfb79f779` confirmed the root
  prerequisite chain and pointed out that worker 036 is export-surface
  evidence only, not evidence for root lifecycle, listeners, DOM mutation, or
  scheduling.
- Explorer `019e0eea-5850-7012-b880-76b95c260a1e` audited the report against
  the prompt and identified fixes applied here: include the JSX-element
  `options` warning, align future report paths with worker 046/088/089 scopes,
  and remove stale delegation notes.

## Prerequisites Before A Compatible Facade Can Land

The first compatible `createRoot` facade must wait for these prerequisites:

1. A client-root public behavior oracle covering invalid containers, duplicate
   warnings, option parsing, root object descriptors, render/unmount warnings,
   unmounted-root errors, listener/marker side effects, and profiling
   alignment. Worker 036 is only export/descriptor evidence; it does not prove
   root lifecycle behavior.
2. Container/root marker and root listener installation oracles. Worker 088 and
   worker 089 reports are not present in this worktree, so their checked
   evidence must be added or consumed before implementation.
3. Core lane/root bookkeeping on top of `Lane`, `Lanes`, and `LaneMap<T>`:
   pending/suspended/pinged/expired/entangled lanes, transition lane claiming,
   `getNextLanes`, and sync-flush lane selection.
4. A lane-backed core or reconciler event priority model, consuming worker 048
   and worker 041 without conflating internal event-priority lanes with public
   Scheduler numeric priorities.
5. Reconciler `FiberRoot` and HostRoot records with root options, container
   handles, root callback handles, current HostRoot fiber, lifecycle state, and
   callback/rooting disposal policy.
6. HostRoot update queues and `update_container` / `update_container_sync`
   using React's circular pending queue and base queue rebase model, not FIFO.
7. Root scheduler and `flushSyncWork`: root linked list, microtask scheduling,
   Scheduler callback reuse/cancellation, cross-root sync flushing, passive
   preflush hooks, and render/commit reentrancy guards.
8. Commit skeleton and host token generation so DOM node maps can associate host
   nodes with reconciler identity and clear those associations on deletion.
9. DOM container validation, root marker storage, listener marker storage, node
   maps, current props maps, and delegated root listener installation.
10. A minimal DOM mutation host path. Public `root.render` must enqueue and
   commit through host operations; it must not directly mutate DOM children from
   the facade.
11. JS callback handle/rooting rules for root error callbacks. Rust must not
   store raw JS values or invoke user JS from background threads.

Until these exist, `createRoot` should remain loudly unsupported rather than
returning a fake root object that appears render-capable.

## Facade Ownership

`packages/react-dom` should own only the public package boundary:

- export-map behavior and `react-server` condition branches
- public `version` alignment
- public error and warning text
- `RootOptions` ingestion
- public `ReactDOMRoot` object shape
- handoff to private DOM/reconciler root creation APIs

The facade must not own:

- DOM mutation or property/style diffing
- event plugin dispatch
- lane selection or root scheduling
- hydration matching/replay
- resource, form, singleton, or view-transition behavior
- server/Fizz marker generation

## `createRoot` Public Plan

`createRoot(container, options)` should eventually perform this sequence:

1. Validate the container before allocating root state. Invalid containers throw
   `Target container is not a DOM element.`
2. In development, warn on containers previously passed to legacy
   `ReactDOM.render` and warn separately on containers already passed to
   `createRoot`. These are warnings, not throws.
3. Parse options into structured root configuration:
   - `unstable_strictMode === true` sets strict mode.
   - `identifierPrefix` defaults to `""` and is stored on the root.
   - `onUncaughtError`, `onCaughtError`, and `onRecoverableError` default to
     reconciler defaults and are stored as root-owned JS callback handles.
   - `options.hydrate` follows React DOM's development warning path but must not
     switch `createRoot` into hydration mode.
   - Passing a React element as the `options` argument follows React DOM's
     development warning path for likely misuse of the old callback argument.
   - Stable 19.2.6 must not expose source-only transition callbacks or default
     transition indicator behavior without oracle proof.
4. Call a private concurrent root creation API equivalent to React's
   `createContainer(..., ConcurrentRoot, ...)`.
5. Mark the DOM container as a root only after root creation succeeds.
6. Install delegated listeners with the same root/owner-document listener
   dedupe path used by React DOM. This only installs listeners; it does not
   implement dispatch.
7. Return a `ReactDOMRoot` public object.

Option parsing should be covered by oracle tests before implementation. Fast
React should not add eager type validation for options or callbacks unless
React DOM 19.2.6 does so observably.

## Root Object Shape

The non-hydration root object should match React DOM's public shape:

- one own `_internalRoot` slot pointing to the internal reconciler root
- prototype methods `render` and `unmount`
- no `unstable_scheduleHydration` on `ReactDOMRoot`
- methods return `undefined`

`root.render(children)`:

- throws `Cannot update an unmounted root.` when `_internalRoot` is `null`
- warns in development for a second argument, with distinct handling for
  callback, DOM-container, and other defined values
- calls the reconciler update path equivalent to
  `updateContainer(children, root, null, null)`
- must not mutate the DOM directly

`root.unmount()`:

- warns in development for a callback argument
- returns `undefined`
- is idempotent after the first unmount
- sets `_internalRoot = null` before scheduling the unmount
- enqueues a sync `null` HostRoot update
- calls cross-root `flushSyncWork`
- unmarks the DOM container only after the sync unmount work is flushed

Tests should assert own/prototype property names and descriptors because React's
constructor/prototype assignment style makes these observable.

## Duplicate Root Warnings

Duplicate root handling belongs to the DOM container marker layer, not the
facade alone.

Required behavior:

- invalid containers fail before any marker or listener side effect
- successful root creation marks the container with the HostRoot identity
- development duplicate warnings distinguish legacy `_reactRootContainer` from
  duplicate `createRoot`
- duplicate `createRoot` still returns a new root object after warning, matching
  React's warning-not-throw behavior
- unmount clears the root marker after the synchronous null update flush
- portal listener dedupe must remain separate from root duplicate warnings

Because worker 088 is not present, a future worker should first add or consume a
container/root marker oracle before implementing this behavior.

## Public Errors And Warnings

The first facade implementation should lock these public surfaces with tests:

- `react-dom/client` under `react-server` throws
  `react-dom/client is not supported in React Server Components.`
- `react-dom/profiling` under `react-server` throws
  `react-dom/profiling is not supported in React Server Components.`
- invalid root containers throw `Target container is not a DOM element.`
- `root.render` after unmount throws `Cannot update an unmounted root.`
- development duplicate-root warnings are emitted through the same console path
  as React DOM and are not thrown exceptions
- development `createRoot` option warnings cover `hydrate` and React-element
  `options` misuse
- development `root.render` second-argument warnings are distinct for callback,
  container, and other defined argument values
- development `root.unmount` callback warnings are distinct from render warnings
- root-level `onUncaughtError`, `onCaughtError`, and `onRecoverableError`
  callback failures must follow reconciler error logging/rethrow behavior, not a
  facade-local console wrapper

Current Fast React placeholder errors should remain for unimplemented paths
until the real behavior is available. Once `createRoot` is implemented, the
placeholder error must be removed for that export and replaced with the public
React DOM error/warning behavior above.

## Profiling Entrypoint Alignment

`react-dom/profiling` is a public runtime entrypoint with no matching
`@types/react-dom` declaration subpath in worker 037's inventory. Runtime
alignment still matters:

- default `react-dom/profiling` exports `createRoot`, `hydrateRoot`,
  `flushSync`, `createPortal`, resource hint APIs, form APIs,
  `unstable_batchedUpdates`, private internals, and `version`
- its `createRoot` and `hydrateRoot` should call the same public facade layer as
  `react-dom/client`, not a forked implementation
- `flushSync` alignment must consume worker 058's root/profiling oracle and wait
  for root scheduler priority overrides and cross-root sync flushing
- profiling-specific instrumentation should be gated behind normal client-root
  correctness; do not ship profiling roots that diverge from normal roots
- `react-server` must keep the unsupported profiling entrypoint throw

Recommended initial implementation: factor `createRoot` root object code into a
shared internal module, import it from both `client.js` and `profiling.js`, and
keep profiling-only scheduler/profiler instrumentation disabled until a
separate profiling evidence slice exists.

## Unsupported Hydration Separation

`hydrateRoot` must stay separate from `createRoot`.

`createRoot` should reserve shared pieces such as option parsing, error
callback storage, container validation, markers, and delegated listener setup,
but it must not:

- create a dehydrated HostRoot
- expose `unstable_scheduleHydration`
- parse Fizz markers
- claim hydratable DOM nodes
- queue explicit hydration targets
- run hydration event replay
- report hydration mismatch/recoverable errors

`hydrateRoot` needs its own facade and root kind after worker 043's hydration
state machine, Fizz marker compatibility, event replay hooks, and worker 095's
public facade plan are available. A createRoot-only worker should leave
`hydrateRoot` as a loud unsupported placeholder unless those dependencies have
landed.

## Future Write Scopes And Tests

Behavior oracle first:

- Write scope:
  `tests/conformance/src/react-dom-client-root-*.mjs`,
  `tests/conformance/scripts/*react-dom-client-root*.mjs`,
  `tests/conformance/test/react-dom-client-root-oracle.test.mjs`,
  `tests/conformance/oracles/react-19.2.6-react-dom-client-root-oracle.json`,
  `worker-progress/worker-046-react-dom-client-root-oracle.md`
- Tests: export descriptors, invalid containers, duplicate warnings, option
  parsing including `hydrate` and React-element `options` warnings, root object
  descriptors, render/unmount warnings, unmounted-root throw, stable ignored
  source-only options, and `react-server` errors.

DOM container/root marker oracle:

- Write scope:
  `tests/conformance/src/react-dom-container-root-markers-*.mjs`,
  `tests/conformance/scripts/*react-dom-container-root-markers*.mjs`,
  `tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`,
  `tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json`,
  `worker-progress/worker-088-dom-container-root-markers-oracle.md`
- Tests: valid/invalid containers, mark/unmark ordering, duplicate warnings,
  legacy `_reactRootContainer` warning distinction, comment-container feature
  gate, and no marker/listener side effects after invalid container failure.

DOM root listener installation oracle:

- Write scope:
  `tests/conformance/src/react-dom-root-listener-installation-*.mjs`,
  `tests/conformance/scripts/*react-dom-root-listener-installation*.mjs`,
  `tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`,
  `tests/conformance/oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json`,
  `worker-progress/worker-089-dom-root-listener-installation-oracle.md`
- Tests: root listener marker dedupe, one capture/bubble registration per
  supported delegated event, non-delegated event handling, owner-document
  `selectionchange`, passive listener flags, and portal listener separation.

Internal root and scheduler prerequisites:

- Write scope:
  `crates/fast-react-core/src/event_priority.rs`,
  `crates/fast-react-core/src/root_lanes.rs`,
  `crates/fast-react-reconciler/src/fiber_root.rs`,
  `crates/fast-react-reconciler/src/update_queue.rs`,
  `crates/fast-react-reconciler/src/root_updates.rs`,
  `crates/fast-react-reconciler/src/root_scheduler.rs`,
  `crates/fast-react-reconciler/src/work_loop.rs`,
  `crates/fast-react-reconciler/src/commit.rs`, and worker reports.
- Tests: lane priority conversion, root lane bookkeeping, circular HostRoot
  queues, transition entanglement, callback storage, sync `null` unmount update,
  Scheduler callback reuse/cancellation, cross-root sync flushing, and
  reentrancy guards.

DOM marker/listener implementation prerequisites:

- Write scope:
  `packages/react-dom/src/client/dom-container.js`,
  `packages/react-dom/src/client/root-markers.js`,
  `packages/react-dom/src/events/root-listeners.js`,
  `packages/react-dom/src/events/event-names.js`, related tests, and worker
  reports.
- Tests: valid/invalid containers, mark/unmark ordering, duplicate warnings,
  listener marker dedupe, owner-document `selectionchange`, capture/bubble
  registration, passive listener flags, and portal listener separation.

DOM mutation and node map prerequisites:

- Write scope:
  `packages/react-dom/src/dom-host/**`,
  `packages/react-dom/src/client/node-maps.js`,
  `packages/react-dom/src/client/dom-component-tree.js`, related conformance
  tests/oracles, and worker reports.
- Tests: node-to-token/current-props maps, cleanup after deletion/unmount,
  public instance lookup, owner document, namespace context, element/text
  creation, append/insert/remove/clear, text update, hide/unhide, and no strong
  references that keep deleted nodes or roots alive.

`createRoot` facade implementation:

- Write scope:
  `packages/react-dom/client.js`,
  `packages/react-dom/profiling.js`,
  `packages/react-dom/src/client/create-root.js`,
  `packages/react-dom/src/client/root-object.js`,
  `packages/react-dom/src/client/root-options.js`,
  `tests/smoke/react-dom-client-root.mjs`,
  `tests/conformance/src/react-dom-client-root-fast-*.mjs`,
  `worker-progress/worker-create-root-facade.md`
- Tests: Fast React comparison against the client-root oracle for exports,
  invalid container throw, duplicate warnings, options ingestion, root object
  own/prototype shape, second-argument warnings, unmounted-root render throw,
  marker/listener side effects, and profiling/client shared behavior.

Hydration facade implementation:

- Write scope:
  future `packages/react-dom/src/client/hydrate-root.js`,
  `packages/react-dom/src/client/hydration-root-object.js`, hydration
  conformance files, and worker 095's report path.
- Tests: separate hydration root object shape, required initial children,
  `unstable_scheduleHydration`, form state, hydration callbacks, Fizz marker
  interaction, event replay, and recoverable hydration errors.

## Recommended Next Tasks

1. Merge or relaunch worker 046 for a client-root public behavior oracle before
   implementing any facade behavior.
2. Add or consume worker 088 and worker 089 oracles for container/root markers
   and root listener installation.
3. Implement core event priority and root lane bookkeeping before exposing a
   root object that accepts updates.
4. Implement reconciler `FiberRoot`, HostRoot update queues, root scheduler,
   `flushSyncWork`, commit ordering, and host token generation.
5. Add DOM node maps, container markers, listener markers, root listeners, and
   a minimal DOM mutation host.
6. Implement the shared `createRoot` facade for `react-dom/client` and
   `react-dom/profiling` only after the above prerequisites are in place.
7. Keep `hydrateRoot` unsupported until its own hydration root state, marker,
   replay, and facade plan have landed.

## Risks Or Blockers

- Worker 088 and worker 089 outputs are not present, so this report cannot rely
  on checked container-marker or root-listener installation oracles.
- A behavior-compatible facade is blocked by missing reconciler roots, HostRoot
  queues, root scheduler, commit traversal, DOM markers/listeners, and minimal
  DOM mutation host behavior.
- Implementing `root.render` as synchronous DOM replacement would create a
  root-cause mismatch with React's lane scheduling, transitions, error
  callbacks, passive effects, and cross-root sync flushing.
- `root.unmount` and `flushSync` require cross-root flushing and render/commit
  reentrancy checks; a per-root shortcut should not land.
- Callback rooting and disposal rules across JS/Rust are not settled.
- Hydration has a distinct root object and scheduling path; merging it into
  `createRoot` would block later Fizz/event-replay compatibility.
- A reliable DOM fixture environment is needed before asserting descriptor,
  marker, listener, and duplicate-warning parity.

## Commands Run

- `create_goal` for objective `Produce a report-only plan for the React DOM
  createRoot public facade and root object.`
- `get_goal`
- `git status --short`
- `rg --files`
- `sed -n '1,260p' WORKER_BRIEF.md`
- `sed -n '1,620p' MASTER_PLAN.md`
- `sed -n '1,620p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-036-react-dom-export-oracle.md`
- `sed -n '1,760p' worker-progress/worker-044-react-dom-client-roots-plan.md`
- `sed -n '1,360p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`
- `sed -n '1,760p' worker-progress/worker-092-react-dom-create-root-facade-plan.md`
- `sed -n '1,260p' worker-progress/worker-033-react-dom-inventory.md`
- `sed -n '1,260p' worker-progress/worker-037-react-dom-type-inventory.md`
- `sed -n '1,260p' worker-progress/worker-048-react-dom-event-priority-oracle.md`
- `sed -n '1,260p' worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md`
- `sed -n '1,260p' packages/react-dom/client.js`
- `sed -n '1,320p' packages/react-dom/profiling.js`
- `sed -n '1,320p' packages/react-dom/index.js`
- `sed -n '1,320p' packages/react-dom/placeholder-utils.js`
- `sed -n '1,160p' packages/react-dom/client.react-server.js`
- `sed -n '1,160p' packages/react-dom/profiling.react-server.js`
- `sed -n '1,340p' crates/fast-react-core/src/lib.rs`
- `sed -n '1,420p' crates/fast-react-reconciler/src/lib.rs`
- `sed -n '1,520p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '1,260p' package.json`
- `rg --files worker-progress | rg 'worker-088|worker-089'`
- `rg -n "FiberRoot|HostRoot|update_container|updateContainer|root_scheduler|flushSyncWork|EventPriority|HostFiberToken|HostScheduling|PortalHost|HydrationHost|MutationRenderer|createRoot|hydrateRoot|unstable_scheduleHydration" crates packages/react-dom worker-progress/worker-040-dom-mutation-renderer-plan.md worker-progress/worker-041-dom-events-priority-plan.md worker-progress/worker-043-react-dom-hydration-plan.md worker-progress/worker-051-dom-host-token-boundary.md`
- Spawned explorer `019e0eea-5735-7ad2-9e17-2ebdfb79f779` for prerequisite
  hypothesis testing.
- Spawned explorer `019e0eea-5850-7012-b880-76b95c260a1e` for report audit.
- `wait_agent` for both explorers.
- Direct React DOM tarball probe using exact `react`, `react-dom`, and
  `scheduler` tarballs in a removed temporary directory.
- `apply_patch` to rewrite this report.

Final verification commands are recorded in the completion audit.

## Verification Results

Scoped report verification passed after the report rewrite:

- `git status --short` showed only `?? Cargo.lock` and the assigned untracked
  report file. The root `Cargo.lock` is a regenerable artifact left alone by
  worker policy.
- Scoped local/temp path leak scan over this report found no matches.
- Scoped trailing whitespace check over this report found no matches.
- Scoped `git diff --check --no-index /dev/null
  worker-progress/worker-092-react-dom-create-root-facade-plan.md` passed.
- Prompt coverage scan found the required sections and no stale client-root
  oracle report path.

No source tests are required for this report-only worker.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan keeps public `createRoot` behavior tied to the real reconciler root
  contract instead of a temporary DOM mutation shortcut.
- Worker 036 export evidence is treated as package-surface evidence only, not
  as proof of root lifecycle behavior.
- Missing worker 088/089 evidence is treated as a blocker, not inferred.

Maintainability:

- The future scopes split package facade, DOM markers/listeners, node maps,
  mutation host, root scheduler, and hydration into separable ownership areas.
- Profiling roots are aligned to the shared client facade to avoid duplicate
  public-root implementations.

Performance:

- The plan preserves lane bitsets, fixed lane maps, delegated root listeners,
  Scheduler callback reuse, and cross-root sync flushing.
- It avoids per-node event listeners and facade-level synchronous rendering
  shortcuts.

Security:

- DOM writes stay in host operations using structured DOM APIs, not facade-level
  HTML string construction.
- JS callbacks are explicitly called out as rooted handles with lifecycle and
  reentrancy rules.
- Hydration remains separated so future Fizz marker parsing and event replay can
  be implemented with dedicated validation instead of accidental client-render
  fallback behavior.

## Completion Audit

Objective restated as success criteria:

- Produce one report-only plan at
  `worker-progress/worker-092-react-dom-create-root-facade-plan.md`.
- Do not modify source code.
- Cover option parsing, root object shape, duplicate root warnings, public
  errors, profiling entrypoint alignment, and unsupported hydration separation.
- State prerequisites before any behavior-compatible facade can land.
- Include future write scopes and tests.
- Read the required reports and record goal status/objective from `get_goal`.
- Verify report-only scope with standard report checks.

Prompt-to-artifact checklist:

| Requirement | Evidence |
| --- | --- |
| First action uses `create_goal` for exact objective | `Goal Tool Status` and `Commands Run` record `create_goal` before file reads. |
| `get_goal` called and active status/objective recorded | `Goal Tool Status` records `active` and exact objective. |
| Read `WORKER_BRIEF.md` | Listed under `Evidence Gathered` and `Commands Run`. |
| Read `MASTER_PLAN.md` | Listed under `Evidence Gathered` and `Commands Run`. |
| Read `MASTER_PROGRESS.md` | Listed under `Evidence Gathered` and `Commands Run`. |
| Read worker 036 report | Listed under `Evidence Gathered`; report notes export-only scope. |
| Read worker 044 report | Listed under `Evidence Gathered`; root lifecycle plan consumed. |
| Read worker 055 report | Listed under `Evidence Gathered`; implementation prerequisite chain consumed. |
| Check worker 088/089 if present | `Evidence Gathered` records both absent. |
| Do not read `ORCHESTRATOR.md` | It is not listed in `Commands Run`; no evidence was taken from it. |
| Write only assigned report | `Changed Files` lists only this report; final `git status --short` showed only `?? Cargo.lock` and `?? worker-progress/worker-092-react-dom-create-root-facade-plan.md`. |
| Do not modify source code | No source file appears in `Changed Files`; source reads only. |
| Cover option parsing | Covered in `createRoot Public Plan` and future behavior-oracle tests. |
| Cover root object shape | Covered in `Root Object Shape`; tarball probe evidence listed. |
| Cover duplicate root warnings | Covered in `Duplicate Root Warnings`; tarball probe evidence listed. |
| Cover public errors | Covered in `Public Errors And Warnings`. |
| Cover profiling entrypoint alignment | Covered in `Profiling Entrypoint Alignment`. |
| Cover unsupported hydration separation | Covered in `Unsupported Hydration Separation`. |
| State prerequisites | Covered in `Prerequisites Before A Compatible Facade Can Land`. |
| Include future write scopes and tests | Covered in `Future Write Scopes And Tests`. |
| Use subagents to test hypotheses | `Evidence Gathered` records both explorers and how their findings changed the report. |
| Standard report sections | This report includes summary, changed files, commands run, evidence gathered, risks/blockers, recommended next tasks, and review. |
| Standard report checks | Scoped status, local/temp path leak check, trailing whitespace check, scoped diff whitespace check, and prompt coverage scan passed after this rewrite. |

Audit result:

- All explicit worker requirements are covered by this report.
- No source files were modified.
- No uncovered prompt requirement remains.
