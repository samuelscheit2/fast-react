# Worker 171 - DOM Root Marker Listener Guard

## Goal

- Status: active
- Objective: strengthen private DOM root marker and listener shell tests without enabling public createRoot or dispatching events
- Recorded via create_goal/get_goal: 2026-05-10

## Progress

- Initialized worker progress report.
- Read the assigned worker brief and prior worker reports for marker oracles,
  listener-installation oracles, the private shell implementation, and the
  root bridge refresh.
- Inspected the private React DOM container, root marker, listener registry,
  root listener, event-name helpers, and public `react-dom/client` placeholder.
- Strengthened `tests/smoke/react-dom-container-listener-shell.mjs` only.

## Summary

Added focused smoke coverage for private DOM root marker and root listener
guard behavior without exposing public `createRoot`, wiring `hydrateRoot`, or
adding event dispatch behavior.

The test now asserts:

- `react-dom/client` remains a placeholder with only `createRoot`,
  `hydrateRoot`, and `version` enumerable exports.
- Both public root functions still throw `FAST_REACT_UNIMPLEMENTED` and do not
  mark containers or install listeners.
- Duplicate private root marker warnings are deterministic and warning-only,
  while explicit private re-marking keeps one marker property.
- Unmark and re-mark behavior preserves a single private marker expando.
- Root listener sets dedupe by event and phase, including a pre-seeded listener
  before `listenToAllSupportedEvents`.
- Repeated all-supported-event installation keeps root registrations and
  owner-document `selectionchange` at the expected once-only counts.
- Listener shell metadata is asserted without invoking listener functions or
  dispatching events.

## Changed Files

- `tests/smoke/react-dom-container-listener-shell.mjs`
- `worker-progress/worker-171-dom-root-marker-listener-guard.md`

## Evidence Gathered

- `get_goal` reported status `active` and objective
  `strengthen private DOM root marker and listener shell tests without enabling public createRoot or dispatching events`.
- Existing helper code already existed under private `packages/react-dom/src/*`
  paths, so no package implementation changes were needed.
- Public `packages/react-dom/client.js` still exports placeholder functions.
- No Rust files, public React DOM entrypoints, or dispatch/plugin code were
  changed.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' worker-progress/worker-088-dom-container-root-markers-oracle.md
sed -n '1,260p' worker-progress/worker-089-dom-root-listener-installation-oracle.md
sed -n '1,260p' worker-progress/worker-122-dom-container-listener-shell.md
sed -n '1,260p' worker-progress/worker-135-react-dom-root-bridge-refresh.md
sed -n '1,260p' packages/react-dom/src/client/dom-container.js
sed -n '1,280p' packages/react-dom/src/client/root-markers.js
sed -n '1,340p' packages/react-dom/src/events/root-listeners.js
sed -n '1,360p' packages/react-dom/src/events/listener-registry.js
sed -n '1,360p' packages/react-dom/src/events/event-names.js
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,620p' tests/smoke/react-dom-container-listener-shell.mjs
sed -n '1,260p' packages/react-dom/placeholder-utils.js
node --check tests/smoke/react-dom-container-listener-shell.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
npm run check:js
git add --intent-to-add worker-progress/worker-171-dom-root-marker-listener-guard.md
git diff --check
git reset -- worker-progress/worker-171-dom-root-marker-listener-guard.md
```

## Verification

- `node --check tests/smoke/react-dom-container-listener-shell.mjs` passed.
- `node tests/smoke/react-dom-container-listener-shell.mjs` passed:
  `React DOM internal container marker and root listener shell smoke checks passed.`
- `npm run check:js` passed, including `@fast-react/conformance` with 415
  passing tests.
- `git diff --check` passed with the new progress file included through
  `git add --intent-to-add`.

## Risks Or Blockers

- None blocked this worker slice.
- The strengthened tests intentionally remain shell-level. They do not claim
  public root compatibility, event plugin extraction, synthetic dispatch,
  portal rendering, hydration, commit behavior, or browser-specific DOM event
  behavior.

## Recommended Next Tasks

- Keep public root facade work blocked on the separate root bridge and commit
  path tasks.
- When public `createRoot` is intentionally enabled later, retain these private
  tests as guardrails and add separate public facade tests for real root
  lifecycle behavior.
