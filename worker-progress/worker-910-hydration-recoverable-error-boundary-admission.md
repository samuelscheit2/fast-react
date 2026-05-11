# Worker 910 Hydration Recoverable Error Boundary Admission

## Summary

- Repaired the audited pre-load `require.cache[rootBridgePath]` poisoning
  path for hydrateRoot recoverable-error boundary admission.
- `hydrate-root-source-ledger.js` still exposes fail-closed public readers, but
  now owns a symbol-keyed private WeakMap ledger used only by `root-bridge.js`
  as writer and `hydration-boundary-gate.js` as reader.
- The authoritative admission source ledger is exact-record provenance:
  root bridge registers the real hydrateRoot preflight, event-replay preflight,
  execution preflight, and lifecycle boundary records after creating them, and
  admission requires those exact WeakMap keys.
- `hydration-boundary-gate.js` no longer accepts
  `options.hydrateRootSourceLedgerContext` as authority; forged caller
  preflight-state arrays are ignored and cloned records are absent from the
  private ledger.
- Added a fresh-process regression that pre-seeds
  `require.cache[rootBridgePath]` with fake source-ledger readers before
  importing `hydrate-root-source-ledger.js` and
  `hydration-boundary-gate.js`; cloned/forged records still reject and the real
  source path still admits.
- Added a fresh-process regression for the audit reproduction: a caller-created
  recoverable-error preflight with forged `preflightState` arrays containing
  cloned hydrate/event/execution/lifecycle records rejects.
- Merged current `main`, including Worker 947's root-bridge smoke fix, and
  preserved the Worker 910 source-ledger hardening.
- Updated the public client facade spy regression to preload a frozen fake
  `root-bridge.js` cache entry instead of mutating the real frozen root-bridge
  exports.

## Changed Files

- `packages/react-dom/src/client/hydrate-root-source-ledger.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `worker-progress/worker-910-hydration-recoverable-error-boundary-admission.md`

## Cache-Poisoning-Resistant Path

1. `hydrate-root-source-ledger.js` has no dependency on `root-bridge.js`; its
   public reader APIs remain fail-closed.
2. Root bridge registers exact source records in the ledger through a
   non-enumerable symbol-keyed private writer after the records are created.
3. Hydration boundary admission reads only the symbol-keyed private ledger
   payloads for the exact records supplied to admission.
4. Caller-provided `hydrateRootSourceLedgerContext` objects are ignored by
   recoverable-error preflight creation and cannot seed admission provenance.
5. A forged root-bridge cache module can still exist before imports, but its
   fake readers are never consulted by boundary admission.

## Commands Run

- `node --check packages/react-dom/src/client/hydrate-root-source-ledger.js`
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --check packages/react-dom/test/hydration-private.test.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js`
- `node --check packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `node --check tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/hydration-private.test.js`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js`
- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `node --test tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-849-hydrateroot-text-patch-ledger.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-client-root-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/react-dom-root-exports.mjs`
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Evidence Gathered

- Focused hydration-boundary tests pass, including the new fresh-process
  forged preflight-state regression and the pre-load root-bridge cache
  poisoning regression.
- Adjacent private hydration, hydrateRoot text claim patch, and root-bridge
  suites pass.
- The public client facade symbol regression passes with immutable real
  root-bridge exports by cache-preloading a frozen fake module only inside the
  child-process import path.
- HydrateRoot preflight/text-patch conformance ledgers, hydration boundary
  conformance, public facade blocked-gate conformance, client-root oracle, and
  hydration-marker oracle tests pass.
- Package surface, root export, import smoke, and React DOM workspace checks
  pass.
- The root-bridge smoke script now passes after the Worker 947 mainline fix
  was merged.

## Risks Or Blockers

- This remains private diagnostic evidence only; no public `hydrateRoot`,
  real hydration/replay, root scheduling, callback routing, native execution,
  reconciler execution, DOM mutation, package, or Rust compatibility is opened.
- A fresh read-only audit should still be run before handoff because this branch
  merged current `main` after the original Worker 910 commit.

## Recommended Next Tasks

- Re-run the Worker 910 admission tests if future hydrateRoot work renames or
  moves preflight source-ledger fields.
