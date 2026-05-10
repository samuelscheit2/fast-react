# Worker 488: DOM Event Error Routing Gate

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and again before this report.
- Goal status after final pane closeout: `complete`.
- Active goal objective from `get_goal`: add private diagnostics for event
  listener errors flowing to accepted root option callback records without
  invoking public root callbacks.
- `update_goal(status: "complete")` succeeded after implementation and
  verification. Final reported time used: 552 seconds.

## Summary

Added a private React DOM root-bridge event-listener error routing record. The
record consumes the existing private root host-output click dispatch canary
listener error routes, validates that the event target belongs to the same
private root owner as the root request records, and creates metadata-only root
error option callback records for the captured listener errors.

The new diagnostic keeps public behavior blocked: it does not call
`reportGlobalError`, does not schedule root error updates, does not invoke
`onUncaughtError`, `onCaughtError`, or `onRecoverableError`, does not expose raw
errors on public record fields, and does not claim DOM event or root error
callback compatibility.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `worker-progress/worker-488-dom-event-error-routing-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 416, 430, 445, 455, 456, and 457.
- Inspected current private event dispatch/error-route records in
  `packages/react-dom/src/events/plugin-event-system.js` and root host-output
  click canary payloads in `packages/react-dom/src/events/root-listeners.js`.
- Inspected root option callback metadata preservation in
  `packages/react-dom/src/client/root-bridge.js`.
- Checked React 19.2.6 reference source:
  `DOMPluginEventSystem.executeDispatch` catches listener errors and calls
  `reportGlobalError`; root option callbacks are not invoked by that event
  dispatch path.

## Commands Run

```sh
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs
node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
npm run check --workspace @fast-react/react-dom
git diff --check
```

Additional inspection used `rg`, `sed`, `git diff`, `git status --short`,
local React reference reads, and `get_goal`.

## Verification Results

- Focused private root bridge package test passed: 28/28 tests.
- Focused event dispatch plugin conformance test passed: 21/21 tests.
- Root listener installation oracle passed: 15/15 tests.
- Event priority shell conformance passed: 7/7 tests.
- Container listener shell smoke passed.
- `npm run check --workspace @fast-react/react-dom` passed: 61 package tests
  plus import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check` passed with this report included via intent-to-add.

## Risks Or Blockers

- No blockers.
- The new record is private diagnostic metadata only. It consumes the existing
  fake-DOM canary error-route records and does not enable browser event
  dispatch, public SyntheticEvent dispatch, global error reporting, root error
  update scheduling, or public root error callbacks.
- The diagnostic currently targets the admitted private root host-output click
  canary. Broader DOM event types, hydration replay, and portal bubbling remain
  separate blocked surfaces.

## Recommended Next Tasks

1. Add equivalent metadata-only routing once broader private event-type
   dispatch canaries are admitted.
2. Keep public event error compatibility blocked until SyntheticEvent dispatch,
   hydration replay, controlled restore, browser event behavior, and root error
   policy are admitted together.

## Nested Agents

- Spawned two read-only explorer agents for local event/root routing context and
  React reference event error behavior. They did not return usable summaries
  before implementation and verification were complete, so both were closed and
  did not affect conclusions.
