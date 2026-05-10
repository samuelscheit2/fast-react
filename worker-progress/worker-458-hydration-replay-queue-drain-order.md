# Worker 458: Hydration Replay Queue Drain-Order Gate

Date: 2026-05-10

## Goal Tool State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Add private hydration replay
  queue drain-order diagnostics that keep blocked events ordered by dehydrated
  target/root metadata without replaying public events.

## Summary

- Added a private
  `FastReactDomHydrationReplayQueueDrainOrderDiagnostic` to the React DOM plugin
  event-system diagnostics.
- Hydration replay event queue entries now copy private dehydrated
  target-resolution metadata: target path/status, dehydrated root ownership,
  boundary owner id/path/index/status, and blocked-on kind/status.
- Added a deterministic drain-order view sorted by dehydrated target path/root
  ownership metadata while preserving no-op behavior: no queue mutation, no
  queue draining, no hydration, no dispatch, and no public event replay.
- Threaded the new drain-order diagnostic through unsupported hydration boundary
  replay blockers.
- Added focused package and conformance coverage for out-of-input-order blocked
  events across two marker-derived Suspense boundaries and a dehydrated-root
  target.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-458-hydration-replay-queue-drain-order.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and present worker reports 169, 372, 401, 433, and 442.
- Inspected current private hydration marker replay queues, event replay queue
  diagnostics, dehydrated target-resolution diagnostics, unsupported
  `hydrateRoot` boundary records, and focused hydration tests.
- Checked pinned React 19.2.6 source
  `ReactDOMEventReplaying.js` and `ReactDOMEventListener.js` for continuous
  replay queues, explicit hydration target priority ordering,
  `retryIfBlockedOn`, `replayUnblockedEvents`, and blocked target detection.
- Confirmed `hydration-marker-parser.js` remained read-only for this slice:
  accepted marker paths already feed marker replay target candidates and the
  event-system target-resolution diagnostic has the path parser needed for
  drain-order sorting.

## Commands Run

- `create_goal`
- `get_goal`
- `git status --short`
- `rg --files ...`
- `sed -n ... WORKER_BRIEF.md`
- `sed -n ... MASTER_PLAN.md`
- `sed -n ... MASTER_PROGRESS.md`
- `sed -n ... worker-progress/worker-169-hydration-boundary-skeleton.md`
- `sed -n ... worker-progress/worker-372-hydration-marker-replay-queue-private.md`
- `sed -n ... worker-progress/worker-401-hydration-marker-replay-event-queue-private.md`
- `sed -n ... worker-progress/worker-433-hydration-dehydrated-target-resolution.md`
- `sed -n ... worker-progress/worker-442-dom-root-marker-listener-public-facade-preflight.md`
- `sed` / `rg` inspections for assigned React DOM hydration/event source,
  focused tests, and pinned React 19.2.6 replay source.
- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/src/client/hydration-marker-parser.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git add --intent-to-add worker-progress/worker-458-hydration-replay-queue-drain-order.md && git diff --check`

## Verification

- JS syntax checks passed for all touched JS/MJS files and the assigned marker
  parser file.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed, 6
  tests.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed, 10 tests.
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`:
  passed, 17 tests.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed, 26 tests.
- `node --test tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`:
  passed, 9 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 54 package tests
  plus import-entrypoint smoke. npm emitted the existing
  `minimum-release-age` config warning.
- `git diff --check`: passed with the new progress report included via
  intent-to-add.

## Risks Or Blockers

- The new drain-order data is diagnostic-only. It does not queue explicit
  hydration targets, mutate replay queues, drain queues, hydrate host
  instances, dispatch synthetic/native events, schedule callbacks, install
  listeners, or unblock public `hydrateRoot`.
- Ordering is based on private marker-derived target paths and dehydrated owner
  metadata, not real reconciler dehydrated HostRoot/Suspense/Activity state.
- Public hydration compatibility remains intentionally unclaimed.

## Recommended Next Tasks

- Add executable replay queue draining only after real reconciler hydration
  roots, dehydrated boundary state, hydratable cursors, and retry scheduling are
  available.
- Replace marker-derived owner/path diagnostics with real hydratable instance
  ownership once DOM marker consumption exists.
- Keep public `hydrateRoot` blocked until scheduling, marker consumption,
  mismatch handling, event replay, and host hydration are implemented together.

## Nested Agents

- None spawned.
