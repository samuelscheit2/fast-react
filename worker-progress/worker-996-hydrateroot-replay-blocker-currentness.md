# Worker 996: hydrateRoot replay blocker currentness

## Summary

Added a source-owned private hydrateRoot replay blocker currentness lane and required it for recoverable-error boundary admission. The new evidence binds the event replay preflight to the exact blocked replay blocker report, lifecycle request boundary, replay execution record, and hydrateRoot source-ledger chain.

Repair update: source-ledger/root-bridge registration now opens only for the
root bridge module that `rememberPrivateHydrateRootSourceLedgerRootBridgeModule`
is actively registering, or for the already remembered canonical module. Caller
or cache-poisoned frozen root-bridge-shaped exports cannot obtain their own
authority token through the public request path.

## Changed files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`

## Implementation notes

- Event replay preflight now creates and publishes a frozen replay blocker currentness record with a private payload and source-ledger entry.
- Event replay and execution preflight records carry explicit replay blocker currentness/report acceptance flags while continuing to block public hydrateRoot, replay, dispatch, scheduling, DOM mutation, native/Rust, package, and compatibility claims.
- Recoverable-error boundary admission now requires source-owned hydrateRoot preflight, event replay preflight, execution preflight, lifecycle boundary, and replay blocker currentness source-ledger evidence from the same bridge/request chain.
- Admission option normalization rejects caller source-ledger aliases, root-listener replay aliases, public hydration/replay/browser/native/package claims, hidden symbol/non-enumerable aliases, and proxy-surfaced compatibility claims.
- The source-ledger root-bridge registrar is guarded by an in-flight canonical
  registration candidate and then pinned to the remembered module instance.
- Added hostile subprocess regressions for a poisoned `require.cache` entry
  that uses copied root-bridge exports, and for forged source-ledger module
  admission attempts after cache poisoning.

## Verification

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js --test-name-pattern "hydrateRoot event replay preflight validates blocked dispatch metadata"`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git diff --cached --check`

All checks passed.

## Risks

- The new lane is deliberately private and diagnostic-only. It does not enable real replay, DOM mutation, root scheduling, public hydrateRoot compatibility, callback routing, or native/Rust execution.
- The source-ledger trust check now requires the replay blocker currentness getter/type guard on the trusted root bridge module and does not hand the registrar to caller-owned root-bridge-shaped modules.
