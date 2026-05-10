# Worker 514 - DOM Event Portal Error Routing Refresh

## Goal

- Final pane closeout observed by orchestrator: complete (tmux reported `Goal achieved`).
- Status recorded from `get_goal`: active
- Objective: Add private portal event error-routing diagnostics that connect accepted portal owner-root event path metadata with the worker 488 root option error-routing records, without enabling public portal event compatibility.

## Summary

- Extended private event-listener root error routing so callers may pass an accepted private portal owner-root gate record.
- The routing path now validates that the worker 488 listener error canary target matches the accepted portal owner-root event path target, root owner, and blocked portal event metadata.
- Added portal-specific accepted and blocked capability rows, root routing fields, callback-record fields, and hidden payload links for the portal owner-root gate/plugin gate records.
- Kept portal behavior private: no browser dispatch, portal container listener dispatch, SyntheticEvent dispatch, global error reporting, public root callback invocation, or public portal bubbling compatibility is enabled.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `worker-progress/worker-514-dom-event-portal-error-routing-refresh.md`

## Evidence

- Package test now covers portal listener error routing from an accepted portal owner-root gate through root option callback metadata while asserting public portal bubbling and public callbacks remain blocked.
- Conformance now covers the same portal owner-root path and validates the hidden payload linkage plus fail-closed rejection for a foreign/invalid portal gate input.
- Hidden payloads retain the raw error only privately through existing listener error route payloads; public records do not expose `error`, listeners, native events, or SyntheticEvents.
- Nested agents: two read-only explorer agents were spawned for worker 488 routing and portal owner-root metadata, but they did not return final results before the implementation was complete and were closed. Conclusions and changes are based on direct code/test inspection.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/src/events/root-listeners.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js && node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `find packages/react-dom/src/events -name '*.js' -exec node --check {} \;`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Results

- Syntax checks passed.
- Private root bridge package tests passed: 31/31.
- Event dispatch conformance passed: 24/24.
- React DOM workspace check passed: 69/69 package tests plus import-entrypoint smoke.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers.
- This remains an explicit private fake-DOM diagnostic. It invokes listener functions only through the existing private canary request and does not imply real portal DOM bubbling or public React DOM event compatibility.

## Recommended Next Tasks

- After merge, run the broader batch-level JS check if other workers land overlapping React DOM changes.
- Keep future portal event work gated on explicit private metadata until real root/portal dispatch semantics are implemented.
