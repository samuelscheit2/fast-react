# Worker 616: DOM Click Event Delegation Private Dispatch

## Goal

- Status: active
- Objective: Add a private click-event delegation dispatch gate that can route one accepted listener record without opening public DOM event compatibility.
- `get_goal` was available and returned the active goal above.

## Summary

- Added a private click delegation dispatch gate in the plugin event system that accepts a private listener queue entry, routes it through plugin extraction, and invokes exactly one matching dispatch listener record.
- Added a root-listener level gate that starts from reversible private root listener metadata, dispatches a private fake click through one installed root listener shell, and forwards the selected listener record into the plugin gate.
- Added fail-closed checks for stale accepted listener records, unsupported click phases, unsupported event types/flags, and portal owner-root mismatch before callback invocation.
- Kept public DOM event compatibility blocked through explicit metadata fields (`publicDispatchEnabled: false`, `publicDispatchBlocked: true`, no synthetic event creation, no public root behavior change).

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/test/events-private.test.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `worker-progress/worker-616-dom-click-event-delegation-private-dispatch.md`

## Evidence Gathered

- Existing event plugin code already created private dispatch listener records from accepted private listener queue entries.
- Existing root listener shells already recorded private dispatch metadata without invoking listeners by default.
- Existing portal owner-root gate records exposed target root ownership and path metadata suitable for pre-invocation validation.
- A managed explorer was spawned for code orientation but did not return a result used in the implementation.

## Commands Run

- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/src/events/root-listeners.js`
- `node --check packages/react-dom/test/events-private.test.js`
- `node --test packages/react-dom/test/events-private.test.js`
- `node --test packages/react-dom/test/*.test.js`
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Verification Result

- React DOM package tests: passed, 111/111.
- DOM event delegation conformance: passed, 14/14.
- Event dispatch plugin skeleton conformance: passed, 26/26.
- React DOM workspace check: passed, including package tests and import smoke.
- Diff whitespace check: passed.

## Risks Or Blockers

- No blockers remain.
- The gate intentionally invokes only private accepted listener queue records; public latest-props DOM listener compatibility remains blocked.
- The root-level private gate still uses fake click events and explicit private admission, so it is not a browser DOM event compatibility claim.

## Recommended Next Tasks

- Extend private routing to multi-listener dispatch only after a separate worker owns propagation semantics and public compatibility remains blocked.
- Add root-bridge consumption of the new root-level gate if a future worker needs portal/error-routing integration beyond metadata.
