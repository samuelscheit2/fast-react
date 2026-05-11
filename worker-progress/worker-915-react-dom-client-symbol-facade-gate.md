# Worker 915 - React DOM Client Symbol Facade Gate

## Summary

- Added an internal `definePrivateSymbolOnlyFacadeGate` helper in
  `packages/react-dom/client.js` so the private client facade hooks are attached
  through one explicit non-enumerable, non-configurable, non-writable symbol
  descriptor path.
- Added
  `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`, a
  focused package gate for public `react-dom/client` placeholders and private
  symbol-only facade hooks.

## Changed Files

- `packages/react-dom/client.js`
- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `worker-progress/worker-915-react-dom-client-symbol-facade-gate.md`

## Evidence Gathered

- Symbol/facade evidence path:
  `packages/react-dom/client.js` ->
  `definePrivateSymbolOnlyFacadeGate()` ->
  `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`.
- The focused gate proves:
  - `createRoot` owns only
    `privateRootPublicFacadeAdapterSymbol` and
    `privateRootPublicFacadePreflightSymbol`; `hydrateRoot` owns only
    `privateHydrateRootPublicFacadePreflightSymbol`.
  - Private facade symbols are non-enumerable, do not copy through
    `Object.assign`, are not exposed as module symbols, and reject descriptor
    rewrites or direct assignment.
  - Public `createRoot` and `hydrateRoot` throw
    `FAST_REACT_UNIMPLEMENTED` before creating root objects, invoking callbacks,
    marking containers, installing listeners, or mutating fake DOM.
  - An isolated child-process spy verifies public calls do not invoke the
    private adapter/preflight lifecycle factories even when those factories are
    the installed symbol descriptor values.
  - `react-dom/profiling`, `client.react-server.js`, and
    `profiling.react-server.js` do not leak the client facade symbols or true
    compatibility claims.

## Commands Run

- `node --check packages/react-dom/client.js`
- `node --check packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-client-root-oracle.test.mjs`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Results

- All commands passed.

## Risks Or Blockers

- No blockers.
- Overlap risk is low because the new assertions live in a dedicated package
  test file. The only shared implementation touch is `packages/react-dom/client.js`,
  where the existing descriptors were refactored through a local helper without
  changing descriptor shape or public exports.
- Workers 910 and 912 may still touch nearby React DOM root tests; this worker
  did not edit the existing large bridge/conformance test files.

## Recommended Next Tasks

- Keep this gate as a required canary before promoting any public
  `react-dom/client` behavior.
- If public root behavior is intentionally opened later, update this gate in the
  same change that updates the conformance oracle and compatibility claims.
