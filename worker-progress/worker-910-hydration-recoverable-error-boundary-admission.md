# Worker 910 Hydration Recoverable Error Boundary Admission

## Summary

- Repaired the audited `new Module(...)` pre-load
  `require.cache[rootBridgePath]` poisoning path for hydrateRoot
  recoverable-error boundary admission.
- Removed all source-ledger authority from the cache-preseedable
  `hydrate-root-source-ledger.js` module. It now exposes only fail-closed
  public readers, with no symbol properties, `Symbol.for(...)` hooks, register
  capability, or private payload reader.
- Removed the exported hydration-gate source-ledger registrar rejected by the
  follow-up audit. There is no caller-usable writer, no stack-string caller
  check, and no first-token binding path.
- Removed the public fourth `sourceLedgerReader` argument from
  `createHydrationBoundaryGate().recordUnsupportedHydrateRoot(...)`. Callers
  can still pass an extra value at runtime, but the gate ignores it and never
  records caller-owned source-ledger readers.
- The authoritative admission source ledger now comes from real root-bridge
  module-local WeakMap provenance. `root-bridge.js` records exact hydrateRoot
  public-facade preflight, event replay, execution, and lifecycle boundary
  payloads into a root-bridge-owned WeakMap as those records are created.
  `hydration-boundary-gate.js` reads only the real root-bridge source-ledger
  reader captured after rejecting fake cache entries; caller-owned readers and
  the public `hydrate-root-source-ledger.js` module are not consulted.
- The root-bridge source-ledger capture no longer trusts
  `require.cache[rootBridgePath].children` or other caller-writable `Module`
  metadata. Real evaluated `root-bridge.js` registers its exports with a
  hydration-gate module-local WeakSet through a callback that receives the
  root-bridge closure-owned authority token. Source-ledger payloads must carry
  that same token before admission accepts them. Unregistered preloaded
  root-bridge cache entries are evicted and replaced before any source-ledger
  reader is captured.
- Cloned hydrateRoot preflight, event-replay preflight, execution preflight,
  and lifecycle boundary records remain absent from source-owned provenance,
  even when a fake root-bridge cache module advertises matching `isPrivate...`
  and payload reader methods.
- `hydration-boundary-gate.js` no longer accepts
  `options.hydrateRootSourceLedgerContext` as authority; forged caller
  preflight-state arrays are ignored and cloned records are absent from the
  private ledger.
- Added a fresh-process regression that pre-seeds both
  `require.cache[rootBridgePath]` and
  `require.cache[hydrateRootSourceLedgerPath]` with fake source-ledger
  readers/writers before importing the real hydration gate. The fake root
  bridge cache entry is an actual `new Module(...)`, with immutable `exports`
  and caller-created Node-like `Symbol(kFormat)` / `Symbol(kIsExecuting)`
  properties, exported hydrateRoot/root-bridge facade methods, and a forged
  `readPrivateHydrateRootPublicFacadeSourceLedgerPayload(...)` reader. It also
  points `children` at the real loaded child module cache entries from the
  root-bridge dependency graph. The fake public ledger module is visible to
  callers, but it is never consulted by boundary admission.
- Added post-load regressions for both object-literal and `new Module(...)`
  fake root-bridge cache replacements with forged hydrate/event/execution/
  lifecycle payload readers. Real source records still admit through the
  captured root-bridge source-ledger reader; cloned source records still
  reject.
- Added a fresh-process regression for the latest audit reproduction: exported
  `createHydrationBoundaryGate().recordUnsupportedHydrateRoot(...)` is called
  with a caller-owned reader plus frozen caller-built hydrate/event/execution/
  lifecycle records backed by that reader, and boundary admission rejects.
- Added a fresh-process regression for the audit reproduction: a caller-created
  recoverable-error preflight with forged `preflightState` arrays containing
  cloned hydrate/event/execution/lifecycle records rejects.
- Added stack-spoof and first-token-binding regressions: even with
  `Error.prepareStackTrace` returning the root-bridge path and a VM filename set
  to `root-bridge.js`, the hydration gate exposes no source-ledger registrar to
  call.
- Added post-load `require.cache[rootBridgePath]` replacement regressions with
  fake `isPrivate...` and payload readers that would admit cloned records if
  boundary admission consulted the cache replacement instead of the captured
  root-bridge source-ledger reader.
- Merged current `main`, including Worker 947's root-bridge smoke fix, and
  preserved the Worker 910 source-ledger hardening.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `worker-progress/worker-910-hydration-recoverable-error-boundary-admission.md`

## Cache-Poisoning-Resistant Path

1. `hydrate-root-source-ledger.js` has no dependency on `root-bridge.js`; its
   public reader APIs remain fail-closed and expose no private symbol hooks.
2. Root bridge does not register hydrateRoot source records through any
   exported hydration-gate writer, exported public ledger writer, stack check,
   first-token binding, or cache-derived module reference.
3. Each root-bridge bridge state owns a module-local source-ledger WeakMap.
   Root bridge records exact hydrateRoot public-facade preflight, event replay,
   execution, and lifecycle boundary payloads into that WeakMap as the records
   are created.
4. Root bridge also mirrors those exact source-ledger payloads into a
   root-bridge-owned record-keyed WeakMap read by
   `readPrivateHydrateRootPublicFacadeSourceLedgerPayload(...)`.
5. The hydration gate captures a root-bridge module only if it is already in the
   hydration-gate WeakSet of evaluated root-bridge exports registered with the
   root-bridge closure-owned authority token, or if the gate first evicts the
   current cache entry and force-loads `root-bridge.js` itself so that the real
   root bridge can register through the callback. Fake preloaded cache entries
   with matching reader/facade exports and real child cache entries fail this
   check and are evicted. Admission reads only the captured root-bridge
   source-ledger reader and rejects payloads missing the registered token.
6. Caller-provided `hydrateRootSourceLedgerContext` objects are ignored by
   recoverable-error preflight creation and cannot seed admission provenance.
7. Forged root-bridge and hydrate-root-source-ledger cache modules can still
   exist before imports; cloned records still miss the root-bridge WeakMaps and
   forged cache readers/writers are not consulted by boundary admission, even if
   `require.cache[rootBridgePath]` is replaced afterward.

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
  caller-owned reader regression, the forged preflight-state regression, the
  pre-load `new Module(...)` fake root-bridge plus fake
  hydrate-root-source-ledger cache-poisoning regression, the object-literal and
  `new Module(...)` post-load fake root-bridge cache replacement regressions,
  and the stack-spoof/first-token-binding negative.
- Adjacent private hydration, hydrateRoot text claim patch, and root-bridge
  suites pass.
- HydrateRoot preflight/text-patch conformance ledgers, hydration boundary
  conformance, public facade blocked-gate conformance, client-root oracle, and
  hydration-marker oracle tests pass.
- Package surface, root export, import smoke, and React DOM workspace checks
  pass.
- The root-bridge smoke script passes.

## Risks Or Blockers

- This remains private diagnostic evidence only; no public `hydrateRoot`,
  real hydration/replay, root scheduling, callback routing, native execution,
  reconciler execution, DOM mutation, package, or Rust compatibility is opened.
- A fresh read-only audit should still be run before handoff because this
  change intentionally keeps all hydrateRoot admission evidence private and
  diagnostic-only.

## Recommended Next Tasks

- Re-run the Worker 910 admission tests if future hydrateRoot work renames or
  moves preflight source-ledger fields.
