# Worker 401: Hydration Marker Replay Event Queue Private

## Goal Tool State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Add a private hydration
  marker replay queue diagnostic that records blocked event replay targets and
  ordering without hydrating host instances or installing public event replay
  behavior.

## Summary

- Added a private `FastReactDomHydrationReplayEventQueueDiagnostic` in the
  React DOM plugin event system.
- The diagnostic accepts private blocked dispatch records, records deterministic
  event replay target rows, preserves input order, and exposes a separate
  priority order without queuing, replaying, dispatching, hydrating host
  instances, or installing public replay behavior.
- Threaded an empty fail-closed event replay queue diagnostic through private
  unsupported `hydrateRoot` boundary records and event replay blockers.
- Added package and conformance coverage proving blocked target/order evidence
  for continuous and discrete events while public `hydrateRoot` remains inert.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-401-hydration-marker-replay-event-queue-private.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 169, 275, 341, and 372. Worker report 397 was requested
  but is not present in this checkout.
- Inspected current hydration boundary, private event dispatch, component-tree
  target lookup, event listener wrapper, and root bridge hydration wiring.
- Checked React 19.2.6 source
  `ReactDOMEventReplaying.js` and `ReactDOMEventListener.js` for replay queue
  names, discrete hydration event classification, continuous queue behavior,
  and capture-phase discrete hydration attempts.
- Confirmed the new diagnostic remains record-only: queued counts are zero,
  replay/dispatch/hydration flags are false, and no listener registrations or
  DOM-like node mutations are produced by tests.

## Commands Run

- `create_goal`
- `get_goal`
- `sed` / `rg` inspections for assigned context, prior reports, source files,
  tests, and React 19.2.6 reference files
- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git add --intent-to-add worker-progress/worker-401-hydration-marker-replay-event-queue-private.md`
- `git diff --check`
- `git status --short`
- `git diff --stat`
- `node --check worker-progress/worker-401-hydration-marker-replay-event-queue-private.md`
  was accidentally run against a Markdown file and failed with Node's unknown
  `.md` extension error; it was not a JS verification step.

## Verification

- JS syntax checks passed for all touched JS/MJS files.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed, 4
  tests.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed, 8 tests.
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`:
  passed, 13 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 38 package tests
  plus entrypoint smoke. npm emitted the existing `minimum-release-age`
  warning.
- `git diff --check`: passed, with the new progress report included via
  intent-to-add.

## Risks Or Blockers

- The diagnostic classifies event replay queues from private dispatch metadata
  only. It does not find dehydrated HostRoot/Suspense/Activity boundaries,
  queue explicit hydration targets, invoke hydration attempts, replay events,
  dispatch synthetic events, or install public listeners.
- Root bridge hydrate records still expose the new evidence through the nested
  hydration boundary blocker record; the root bridge was not changed because it
  was outside this worker's write scope.
- Real event replay remains blocked on dehydrated boundary ownership, target
  resolution against hydratable instances, queue mutation/draining semantics,
  and public hydration root support.

## Recommended Next Tasks

- Add executable replay queue behavior only after dehydrated root/boundary
  state and hydratable target resolution exist.
- If root bridge hydration records need top-level event replay queue evidence,
  assign a follow-up that includes `root-bridge.js` in scope.
- Keep public `hydrateRoot` and event replay compatibility blocked until marker
  consumption, hydration scheduling, boundary claiming, and replay draining are
  implemented together.

## Nested Agents

- None spawned.
