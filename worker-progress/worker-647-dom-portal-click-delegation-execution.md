# Worker 647: DOM Portal Click Delegation Execution

## Goal Evidence

- `create_goal` was called as the first action with objective: Broaden private
  click delegation execution across a portal child path, proving owner-root
  validation and listener invocation without public portal event compatibility.
- `get_goal` was available after setup.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Broaden private click delegation
  execution across a portal child path, proving owner-root validation and
  listener invocation without public portal event compatibility.

## Summary

- Broadened the private click delegation gate so a supplied portal owner-root
  gate must match the click dispatch path entry-by-entry before the private
  listener is invoked.
- Exposed portal owner-root, portal-container containment, public portal
  bubbling blocker, and target dispatch-path evidence on the private click
  gate and the root-listener click gate.
- Added package and conformance coverage for a portal child under a portal
  container with a parent HostComponent on the same owner root. The accepted
  child listener is invoked once, the parent listener is not selected, and no
  portal/root public compatibility flags are opened.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/test/events-private.test.js`
- `tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `worker-progress/worker-647-dom-portal-click-delegation-execution.md`

## Commands Run And Results

- `node --check packages/react-dom/src/events/plugin-event-system.js`: passed.
- `node --check packages/react-dom/src/events/root-listeners.js`: passed.
- `node --check packages/react-dom/test/events-private.test.js`: passed.
- `node --check tests/conformance/test/dom-event-delegation-oracle.test.mjs`:
  passed.
- `node --test packages/react-dom/test/events-private.test.js`: passed, 11/11.
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`:
  passed, 15/15.
- `npm run check --workspace @fast-react/react-dom`: passed, 126/126 package
  tests plus import-entrypoint smoke. npm emitted the existing
  `minimum-release-age` warning.
- `git diff --check`: passed.

## Evidence Gathered

- Worker 616 already added one accepted private click listener route, stale
  record rejection, phase rejection, and portal owner mismatch rejection.
- React 19.2.6 reference `DOMPluginEventSystem.js` validates root/portal
  ownership before dispatching through portal paths; this worker keeps the Fast
  React path private and fake-DOM only.
- The new package root-listener test proves reversible root listener metadata
  can dispatch a fake click for a portal child, validate the portal owner-root
  gate, and invoke exactly the accepted child private listener.
- The conformance test proves the same private portal child path at the plugin
  gate while keeping `publicDispatchEnabled`, `publicPortalBubblingEnabled`,
  `browserDomEventCompatibilityClaimed`, and `compatibilityClaimed` false.
- No nested managed agents were spawned.

## Risks Or Blockers

- No blockers remain.
- This remains a private fake-DOM canary. It does not install portal container
  listeners, create SyntheticEvents, enable public portal bubbling, or claim
  browser DOM event compatibility.
- The portal owner-root gate is now stricter for private click execution: when
  supplied, it must describe a real portal-container target path that matches
  the click dispatch path entries.

## Recommended Next Tasks

1. Extend private click execution to additional portal shapes only with
   explicit owner-root and path-entry validation.
2. Keep public portal event compatibility blocked until real portal listener
   installation, SyntheticEvent propagation, and browser dispatch behavior are
   proven against React DOM oracles.
