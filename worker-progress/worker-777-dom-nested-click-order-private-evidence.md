# Worker 777: DOM Nested Click Order Private Evidence

## Summary

- Added private accepted click-order owner-root validation for React DOM event
  delegation records.
- Added nested fake-DOM parent/child click-order evidence for a private
  root-render handoff: parent capture, child capture, child bubble, parent
  bubble.
- Added stale listener and foreign owner-root rejection coverage before any
  accepted private listener is invoked.
- Kept public DOM event dispatch, browser DOM compatibility, SyntheticEvent
  creation, and package surface changes blocked.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/test/events-private.test.js`
- `worker-progress/worker-777-dom-nested-click-order-private-evidence.md`

## Commands Run

- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/test/events-private.test.js`
- `node --test packages/react-dom/test/events-private.test.js --test-name-pattern "nested click event delegation accepted order|accepted order targets root-render|dispatch gate rejects stale listener"`
- `node --test packages/react-dom/test/events-private.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- The private accepted-order record now reports owner-root preservation counts
  for dispatch records and accepted listener queue entries.
- The nested click-order test proves dispatch processing order is deterministic
  even when accepted listener records are provided in a scrambled input order.
- The accepted order is parent capture, child capture, child bubble, and parent
  bubble across a `section > span > text` private fake-DOM handoff.
- The target record must match active private root-render metadata for the child
  target, while public dispatch and browser compatibility flags remain false.
- Stale accepted listener records are rejected with
  `stale-listener-record`; records from a different owner root are rejected with
  `foreign-owner-root`; neither path invokes private listeners.
- React DOM workspace check passed 167 package tests plus import smoke. npm
  emitted the existing `minimum-release-age` config warning.
- Package surface guard, standalone import smoke, syntax checks, and whitespace
  diff check passed.

## Risks Or Blockers

- No blockers remain.
- This is private evidence only. It does not implement public DOM event
  dispatch, public SyntheticEvent compatibility, or real browser listener
  dispatch beyond the already accepted private fake-DOM listener rows.
- The private canary event still follows the existing per-listener
  `targetInst` metadata model for ancestor listeners; public event semantics
  remain blocked until separately admitted.

## Recommended Next Tasks

- Add public-oracle-backed event target/currentTarget semantics before widening
  beyond private canary dispatch.
- Keep hydration, portal, and public event compatibility blocked until their
  owner-root and replay paths have matching private and public evidence.
