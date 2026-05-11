# Worker 910 Hydration Recoverable Error Boundary Admission

## Summary

- Repaired the audited pre-load `require.cache[rootBridgePath]` poisoning
  path for hydrateRoot recoverable-error boundary admission.
- `hydration-boundary-gate.js` no longer imports
  `hydrate-root-source-ledger.js`, and the ledger shim no longer imports or
  trusts `root-bridge.js` exports.
- The authoritative admission source ledger now lives in
  `hydration-boundary-gate.js` as a gate-owned WeakMap context captured from
  the real hydrateRoot recoverable-error preflight.
- `root-bridge.js` passes the source preflight state, request payload,
  request record, lifecycle boundary, and admission record into that private
  preflight context. Admission then requires the hydrateRoot preflight,
  event-replay preflight, execution preflight, and lifecycle boundary records
  to be current members of the source-owned preflight state arrays.
- Added a fresh-process regression that pre-seeds
  `require.cache[rootBridgePath]` with fake source-ledger readers before
  importing `hydrate-root-source-ledger.js` and
  `hydration-boundary-gate.js`; cloned/forged records still reject and the real
  source path still admits.

## Changed Files

- `packages/react-dom/src/client/hydrate-root-source-ledger.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `worker-progress/worker-910-hydration-recoverable-error-boundary-admission.md`

## Cache-Poisoning-Resistant Path

1. `hydrate-root-source-ledger.js` is fail-closed and has no dependency on
   `root-bridge.js`.
2. `hydration-boundary-gate.js` consumes no source-ledger reader function from
   any CommonJS module export.
3. Root bridge passes source-owned context only while creating the canonical
   recoverable-error preflight record.
4. Admission reads that hidden gate WeakMap context and validates source
   records against the live root-bridge preflight state arrays instead of
   caller-replaceable exports.
5. A forged cache module can still exist before imports, but its fake readers
   are never consulted by boundary admission.

## Commands Run

- `node --check packages/react-dom/src/client/hydrate-root-source-ledger.js`
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/hydration-private.test.js`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js`
- `node --test tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-849-hydrateroot-text-patch-ledger.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-client-root-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/react-dom-root-exports.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs` failed with the
  existing baseline `FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD`
  at `tests/smoke/react-dom-private-root-bridge-shell.mjs:386`.

## Evidence Gathered

- Focused hydration-boundary tests pass, including the new fresh-process
  pre-load cache-poisoning regression.
- Adjacent private hydration, hydrateRoot text claim patch, and root-bridge
  suites pass.
- HydrateRoot preflight/text-patch conformance ledgers, hydration boundary
  conformance, public facade blocked-gate conformance, client-root oracle, and
  hydration-marker oracle tests pass.
- Package surface, root export, import smoke, and React DOM workspace checks
  pass.
- The root-bridge smoke failure matches the previously documented mainline
  unmount cleanup blocker and is not caused by this cache-poisoning repair.

## Risks Or Blockers

- `tests/smoke/react-dom-private-root-bridge-shell.mjs` still fails on the
  known unmount host-output cleanup scenario, while the focused
  `react-dom-private-root-bridge-shell.test.js` suite passes.
- This remains private diagnostic evidence only; no public `hydrateRoot`,
  real hydration/replay, root scheduling, callback routing, native execution,
  reconciler execution, DOM mutation, package, or Rust compatibility is opened.

## Recommended Next Tasks

- Keep the separate root-bridge smoke refresh for
  `tests/smoke/react-dom-private-root-bridge-shell.mjs`.
- Re-run the Worker 910 admission tests if future hydrateRoot work renames or
  moves preflight source-ledger fields.
