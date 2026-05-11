# Worker 824: hydrateRoot Execution Preflight Boundary

## Summary

- Added a private `hydrateRoot` execution-preflight boundary after the accepted
  marker/listener, recoverable-error, target-claiming, and event-replay
  preflight chain.
- The new boundary consumes the exact WeakMap-owned event replay preflight and
  replay target-dispatch execution metadata. It remains diagnostic-only:
  public `hydrateRoot`, public root objects, native/reconciler execution, DOM
  mutation, marker writes, listener installation, event dispatch/replay drain,
  recoverable-error queueing/callback invocation, and compatibility claims stay
  blocked.
- Added conformance coverage for the positive private boundary plus stale,
  cloned, foreign, tampered public-claim, tampered native-execution, wrong-stage,
  and stale marker/listener-state inputs.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-824-hydrateroot-execution-preflight-boundary.md`

## Evidence Gathered

- Worker 806's accepted admission ledger is consumed by preserving the
  hydrateRoot public-facade request, marker/listener, recoverable-error,
  target-claiming, and event-replay preflight chain as private-only metadata.
- Worker 811's negative matrix is consumed by requiring the exact canonical
  replay execution record from the accepted event replay preflight and rejecting
  stale/foreign/tampered replay execution records at the new boundary.
- The boundary verifies current marker/listener state still matches the accepted
  event replay preflight before accepting execution-preflight metadata.
- Package surface and import smoke remain unchanged; public hydrateRoot exports
  remain unsupported placeholders.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --check packages/react-dom/test/hydration-private.test.js`
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs --test-name-pattern "hydrateRoot execution preflight|hydrateRoot event replay preflight|hydrateRoot preflight matrix"`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs --test-name-pattern "hydrateRoot"`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js --test-name-pattern "hydrateRoot event replay preflight|hydrateRoot preflight matrix|hydrateRoot target-claiming preflight"`
- `node --test packages/react-dom/test/hydration-private.test.js --test-name-pattern "target|replay|recoverable|hydrateRoot"`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs --test-name-pattern "target|replay|recoverable|hydrateRoot"`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Verification

- Focused root-facade conformance suite passed: 33 tests.
- Focused private root bridge hydrateRoot suite passed: 65 tests.
- Focused hydration-private suite passed: 11 tests.
- Focused hydration-boundary conformance suite passed: 17 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 180 package tests
  plus import-entrypoint smoke. npm emitted the existing unknown
  `minimum-release-age` warning.
- Package surface guard and import-entrypoint smoke passed.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers remain.
- This does not enable public hydration compatibility. It adds only a private
  execution-preflight metadata boundary and negative checks.
- Merge risk is localized to root-bridge hydrateRoot public-facade preflight
  code and the adjacent root public-facade conformance tests.

## Recommended Next Tasks

- If later workers add real hydrateRoot execution, keep this boundary as the
  last private preflight gate before root construction and add public DOM,
  listener, replay drain, recoverable-callback timing, and package-surface
  compatibility tests together.
