# Worker 560: Portal Nested Event Propagation Refresh

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Refresh private portal nested event
  propagation diagnostics for owner-root and portal-container paths without
  enabling public portal event bubbling.

## Summary

Refreshed the private portal owner-root event gate so it now records explicit
owner-root identity, owner-root event path entries, portal-container DOM path
entries, nested portal-container identity, and explicit blocked public bubbling
and dispatch flags. The root bridge carries these diagnostics through the
private portal owner-root gate and portal listener error-routing metadata.

The refresh remains metadata-only. It does not enable public portal bubbling,
public dispatch, portal container listener dispatch, global error reporting,
SyntheticEvent dispatch, compatibility claims, or new public exports.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `worker-progress/worker-560-portal-nested-event-propagation-refresh.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and prior
  worker reports 457, 513, and 514.
- Checked the React 19.2.6 reference source and tests for portal event
  propagation, especially nested portal/root ordering, to keep this worker as a
  private diagnostic only.
- Existing detached portal owner-root tests now assert explicit owner-root
  summaries, portal-container paths, and blocked public dispatch/bubbling flags.
- Added nested portal-container package and conformance tests where the portal
  container sits under a mounted owner-root HostComponent. The diagnostic records
  both the owner-root event path and the portal-container DOM path while
  listener invocation remains zero.
- A read-only explorer subagent was spawned for portal/event diagnostics, but it
  did not return results before implementation and was closed. Conclusions are
  based on direct source and test inspection.

## Commands Run

```sh
node --check packages/react-dom/src/events/plugin-event-system.js
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs
npm run check --workspace @fast-react/react-dom
git add --intent-to-add worker-progress/worker-560-portal-nested-event-propagation-refresh.md
git diff --check
```

## Verification Results

- JS syntax checks passed for all touched JS/MJS files.
- Focused private root bridge package test passed: 34/34 tests.
- Focused event dispatch conformance test passed: 26/26 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 79/79 package
  tests plus import-entrypoint smoke. npm emitted the existing
  `minimum-release-age` warning.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers remain.
- The new nested path rows are still fake-DOM/component-tree diagnostics. They
  do not prove public browser portal propagation, listener installation,
  SyntheticEvent propagation, global error routing, or public React DOM portal
  compatibility.

## Recommended Next Tasks

1. Add a separate private portal listener install/cleanup gate before admitting
   reversible portal listener side effects.
2. Add checked React DOM portal bubbling oracles before any public portal event
   compatibility claim.
3. Keep portal root-render public rows blocked until mounting, listener setup,
   child reconciliation, container mutation, and event propagation are proven
   together.
