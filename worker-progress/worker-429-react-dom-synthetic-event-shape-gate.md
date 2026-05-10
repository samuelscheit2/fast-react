# Worker 429: React DOM SyntheticEvent Shape Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: add a private SyntheticEvent
  shape gate for root-output event diagnostics, covering
  target/currentTarget/defaultPrevented fields without broad dispatch queue
  processing.

## Summary

Added a private SyntheticEvent shape gate to the React DOM private event
diagnostics. The new gate builds SyntheticBaseEvent-shaped private objects from
dispatch listener metadata, records target, dispatch-scoped currentTarget,
currentTarget reset, and defaultPrevented/preventDefault state, and keeps
listener invocation and dispatch queue processing at zero.

Root-output diagnostics now expose an explicit private click shape helper that
uses installed inert root listener shells to produce capture/bubble dispatch
records, then records the SyntheticEvent shape evidence without invoking
component listeners, enabling propagation stop, routing listener errors,
hydration replay, portal retargeting, controlled restore, public dispatch, or
public root event compatibility.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
  - Added private SyntheticBaseEvent-shaped diagnostic objects.
  - Added per-listener SyntheticEvent shape records and a metadata-only gate
    over private dispatch records.
  - Added hidden payload accessors while keeping event objects off public record
    fields.
- `packages/react-dom/src/events/root-listeners.js`
  - Added a private root host-output click SyntheticEvent shape gate.
  - Extended the private fake click event with deterministic default-prevented
    state for the shape diagnostic.
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  - Added root-output shape coverage for target/currentTarget/defaultPrevented.
  - Added invalid-record and public-export assertions for the new private gate.
- `worker-progress/worker-429-react-dom-synthetic-event-shape-gate.md`
  - This report.

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested worker reports 170, 339, 370, 397, and 401.
- Inspected current private event dispatch, listener invocation canary,
  root-listener, component-tree event target, and root-output bridge tests.
- Checked React 19.2.6 reference source for `SyntheticEvent`,
  `SimpleEventPlugin`, and `DOMPluginEventSystem.executeDispatch` to ground
  currentTarget assignment/reset and defaultPrevented behavior.
- Reviewed the checked DOM event delegation oracle tests for existing
  target/currentTarget/defaultPrevented evidence.

## Verification

Passed:

```sh
node --check packages/react-dom/src/events/plugin-event-system.js
node --check packages/react-dom/src/events/root-listeners.js
node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs
node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
npm run check --workspace @fast-react/react-dom
git add --intent-to-add worker-progress/worker-429-react-dom-synthetic-event-shape-gate.md && git diff --check
```

Results:

- Focused event dispatch skeleton passed: 15 tests.
- Event priority shell passed: 7 tests.
- Root listener installation oracle passed: 15 tests.
- Container listener shell smoke passed.
- Private root bridge package test passed: 19 tests.
- React DOM workspace check passed: 43 package tests plus import-entrypoint
  smoke. npm printed the existing `minimum-release-age` warning.
- `git diff --check` passed with this progress report included via
  intent-to-add; the intent entry was reset afterward.

Additional non-required smokes run while checking nearby surfaces failed on
pre-existing expectation drift outside this worker's touched files:

```sh
node tests/smoke/react-dom-component-tree-map-shell.mjs
node tests/smoke/react-dom-private-root-bridge-shell.mjs
```

- `react-dom-component-tree-map-shell.mjs` expected an unsafe latest-props
  payload exception that the current source did not throw.
- `react-dom-private-root-bridge-shell.mjs` expected an older accepted
  capability list that omitted `property-payload-evidence` and
  `attribute-payload-rows`.

## Risks Or Blockers

- No blocker for this worker's scoped change.
- The new SyntheticEvent-shaped object is private diagnostic evidence only; it
  is not exported publicly and is not used by installed root listeners.
- The shape gate does not implement broad dispatch queue processing,
  propagation stop, listener error routing, hydration replay, portal
  retargeting, controlled restore, or public event compatibility.

## Nested Agents

- Spawned two read-only explorer agents for event/root-output context.
- Both were closed before returning usable findings, so they did not affect the
  implementation or conclusions.

## Recommended Next Tasks

- Add a separate private propagation-stop diagnostic once SyntheticEvent shape
  evidence is accepted.
- Add listener-error routing diagnostics behind private helpers before using
  SyntheticEvent-shaped objects for any broader invocation path.
- Keep portal retargeting, hydration replay, controlled restore, and public
  dispatch compatibility behind separate explicit gates.
