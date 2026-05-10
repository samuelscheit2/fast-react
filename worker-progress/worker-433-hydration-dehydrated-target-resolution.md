# Worker 433: Hydration Dehydrated Target Resolution Gate

## Goal Tool State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: add a private hydration
  target-resolution gate that records dehydrated root/boundary ownership and
  hydratable event target lookup without draining replay queues.

## Summary

- Added a private
  `FastReactDomHydrationDehydratedTargetResolutionDiagnostic` gate to the React
  DOM plugin event system.
- The diagnostic records unsupported dehydrated root ownership, marker-derived
  dehydrated boundary owners, and hydratable event target lookup rows for
  private blocked dispatch records.
- Threaded the empty ownership diagnostic through unsupported private
  `hydrateRoot` boundary records, private root bridge hydrate records, hydrate
  admission records, event replay blockers, and hydration replay queue
  diagnostics.
- Preserved fail-closed behavior: no public `hydrateRoot`, replay queue
  mutation/draining, event dispatch, host hydration attempts, DOM mutation, or
  hydration compatibility claims were enabled.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-433-hydration-dehydrated-target-resolution.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 169, 218, 246, 341, 372, and 401.
- Inspected current private hydration marker/parser/replay queue gates,
  component-tree event target lookup, root bridge hydrate records, and focused
  hydration tests.
- Checked pinned React 19.2.6 source for the target-resolution flow:
  `getClosestInstanceFromNode`, `findInstanceBlockingEvent`,
  `findInstanceBlockingTarget`, `isRootDehydrated`, Suspense/Activity
  dehydrated state, and replay queue ownership in
  `ReactDOMEventListener.js`, `ReactDOMEventReplaying.js`,
  `ReactDOMComponentTree.js`, `ReactFiberShellHydration.js`,
  `ReactFiberSuspenseComponent.js`, and `ReactFiberActivityComponent.js`.

## Commands Run

- `create_goal`
- `get_goal`
- `sed` / `rg` inspections for assigned context, prior worker reports,
  current React DOM hydration/event files, tests, and React 19.2.6 reference
  source.
- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `git add --intent-to-add worker-progress/worker-433-hydration-dehydrated-target-resolution.md && git diff --check`

## Verification

- JS syntax checks passed for all touched JS/MJS files.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed, 5
  tests.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed, 9 tests.
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`:
  passed, 14 tests.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed, 19 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 44 package tests
  plus entrypoint smoke. npm emitted the existing unknown
  `minimum-release-age` config warning.
- `git diff --check`: passed with the new progress report included via
  intent-to-add.

## Risks Or Blockers

- The new target-resolution diagnostic is record-only and marker-derived. It
  does not claim real reconciler dehydrated HostRoot/Suspense/Activity state,
  does not hydrate host instances, and does not queue or drain replay work.
- Boundary ownership is inferred from accepted marker diagnostics and DOM-like
  child paths; real browser hydration still needs reconciler hydration state,
  marker consumption, hydratable cursors, retry scheduling, and mismatch
  handling.
- Public `hydrateRoot` remains intentionally unsupported.

## Recommended Next Tasks

- Add real dehydrated HostRoot/Suspense/Activity ownership only after
  reconciler hydration root construction and boundary state are available.
- Replace marker-derived target lookup with executable hydratable instance
  lookup only when DOM marker consumption and hydration cursors exist.
- Add replay queue mutation/draining in a separate gate after target ownership
  can be resolved and cleared safely.

## Nested Agents

- Spawned two read-only explorer agents for local hydration gate shape and
  pinned React target-resolution source context. They did not return usable
  final reports before implementation completed, were closed, and no
  conclusions depend on their results.
