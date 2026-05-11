# Worker 910 Hydration Recoverable Error Boundary Admission

## Summary

- Repaired the audited pre-load `require.cache[rootBridgePath]` poisoning
  path for hydrateRoot recoverable-error boundary admission.
- Removed all source-ledger authority from the cache-preseedable
  `hydrate-root-source-ledger.js` module. It now exposes only fail-closed
  public readers, with no symbol properties, `Symbol.for(...)` hooks, register
  capability, or private payload reader.
- Removed the exported hydration-gate source-ledger registrar rejected by the
  follow-up audit. There is no caller-usable writer, no stack-string caller
  check, and no first-token binding path.
- The authoritative admission source ledger now comes from root-bridge
  module-local WeakMap provenance: `hydration-boundary-gate.js` lazily reads
  the existing exact-record root-bridge payload getters during admission and
  caches the immutable real root-bridge export when the root-bridge-owned
  recoverable-error preflight is created. Cloned hydrateRoot preflight,
  event-replay preflight, execution preflight, and lifecycle boundary records
  remain absent from source-owned provenance.
- `hydration-boundary-gate.js` no longer accepts
  `options.hydrateRootSourceLedgerContext` as authority; forged caller
  preflight-state arrays are ignored and cloned records are absent from the
  private ledger.
- Added a fresh-process regression that pre-seeds both
  `require.cache[rootBridgePath]` and
  `require.cache[hydrateRootSourceLedgerPath]` with fake source-ledger
  readers/writers before importing the real hydration gate. The fake public
  ledger module is visible to callers, but cloned/forged records still reject
  and the real root-bridge source path still admits after the fake root bridge
  cache entry is removed.
- Added a fresh-process regression for the audit reproduction: a caller-created
  recoverable-error preflight with forged `preflightState` arrays containing
  cloned hydrate/event/execution/lifecycle records rejects.
- Added stack-spoof and first-token-binding regressions: even with
  `Error.prepareStackTrace` returning the root-bridge path and a VM filename set
  to `root-bridge.js`, the hydration gate exposes no source-ledger registrar to
  call.
- Added a post-load `require.cache[rootBridgePath]` replacement regression with
  fake `isPrivate...` and payload readers that would admit cloned records if
  boundary admission consulted the cache replacement instead of the cached real
  root-bridge module-local WeakMaps.
- Merged current `main`, including Worker 947's root-bridge smoke fix, and
  preserved the Worker 910 source-ledger hardening.

## Changed Files

- `packages/react-dom/src/client/hydrate-root-source-ledger.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `worker-progress/worker-910-hydration-recoverable-error-boundary-admission.md`

## Cache-Poisoning-Resistant Path

1. `hydrate-root-source-ledger.js` has no dependency on `root-bridge.js`; its
   public reader APIs remain fail-closed and expose no private symbol hooks.
2. Root bridge does not register hydrateRoot source records through any
   exported hydration-gate writer.
3. Hydration boundary admission reads root-bridge module-local WeakMap payloads
   through the existing private payload getters for the exact records supplied
   to admission. The root-bridge module reference is cached only from the real
   immutable cache entry.
4. Caller-provided `hydrateRootSourceLedgerContext` objects are ignored by
   recoverable-error preflight creation and cannot seed admission provenance.
5. Forged root-bridge and hydrate-root-source-ledger cache modules can still
   exist before imports; after the real root bridge is loaded, cloned records
   still miss the root-bridge WeakMaps and forged ledger readers/writers are not
   consulted by boundary admission, even if `require.cache[rootBridgePath]` is
   replaced afterward.

## Commands Run

- `node --check packages/react-dom/src/client/hydrate-root-source-ledger.js`
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test packages/react-dom/test/hydration-private.test.js`
- `node --test packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `node tests/smoke/import-entrypoints.mjs`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/react-dom-root-exports.mjs`
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `node --test tests/conformance/test/private-admission-806-hydrateroot-preflight-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-849-hydrateroot-text-patch-ledger.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-client-root-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
- `git diff --check`

## Evidence Gathered

- Focused hydration-boundary tests pass, including the fresh-process forged
  preflight-state regression, the pre-load fake root-bridge plus fake
  hydrate-root-source-ledger cache-poisoning regression, the post-load fake
  root-bridge cache replacement regression, and the new
  stack-spoof/first-token-binding negative.
- Adjacent private hydration, hydrateRoot text claim patch, and root-bridge
  suites pass.
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
