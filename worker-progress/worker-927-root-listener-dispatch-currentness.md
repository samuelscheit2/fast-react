# Worker 927 - Root Listener Dispatch Currentness

## Summary

- Required private root click/focus dispatch gates to receive a WeakMap-backed
  root listener currentness gate before dispatching root listener shells.
- Dispatch admission now uses the currentness gate payload owned by
  `createPrivateRootListenerCurrentnessGateRecord`, verifies it belongs to the
  same active listener registration record, and recomputes listener state before
  fake dispatch.
- Public/browser/synthetic compatibility claims passed through dispatch options
  are rejected before listeners can run.

## Changed Files

- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/test/events-private.test.js`

## Dispatch / Currentness Path

1. Caller creates `createPrivateRootListenerCurrentnessGateRecord(...)`.
2. Caller passes that record as `rootListenerCurrentnessGateRecord` in private
   click/focus dispatch options.
3. `invokePrivateRootClickEventDelegationDispatchGate` and
   `invokePrivateRootFocusBlurEventDispatchExecution` resolve the source-owned
   payload through `getPrivateRootListenerCurrentnessGatePayload`.
4. The dispatch gate rejects missing, cloned, foreign, or stale currentness
   records, then recomputes root listener state and compares it with the
   captured `afterState` before invoking any private listener.

## Commands Run

- `node --check packages/react-dom/src/events/root-listeners.js`
- `node --check packages/react-dom/test/events-private.test.js`
- `node --test packages/react-dom/test/events-private.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

All commands passed.

## Evidence Gathered

- Added positive click/focus coverage showing accepted dispatch payloads retain
  the root listener currentness gate and source-owned payload.
- Added negatives for missing currentness, cloned currentness records, foreign
  currentness registration evidence, listener registration mutation after
  evidence capture, and forged public/synthetic/browser behavior claims.
- Existing public DOM event compatibility blockers remain asserted as false on
  dispatch records.

## Risks Or Blockers

- No public DOM event compatibility, browser listener install path, synthetic
  dispatch, or package surface expansion was added.
- No hydrateRoot source-kind or source-ledger code was consumed or modified;
  overlap risk with Worker 910 is limited to neighboring tests that still pass.

## Recommended Next Tasks

- Have the orchestrator decide whether facade-level private click/focus helpers
  should thread this currentness gate automatically once public root dispatch
  remains intentionally blocked.
