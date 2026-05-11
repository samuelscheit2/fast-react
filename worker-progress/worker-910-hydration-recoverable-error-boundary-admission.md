# Worker 910 Hydration Recoverable Error Boundary Admission

## Summary

- Repaired the first-load hydrateRoot source-ledger cache-poisoning hole.
- `root-bridge.js` now publishes its already frozen export object through a
  non-writable, non-configurable `module.exports` property. Loading
  `root-bridge.js` first no longer leaves a mutable
  `require.cache[rootBridgePath].exports` slot that can be swapped before
  `hydrate-root-source-ledger.js` imports the bridge getters.
- Kept the removed source-ledger registration/installer surface absent.
- Added a fresh-process regression that requires `root-bridge.js`, attempts to
  replace its cache `exports`, then imports the ledger through
  `hydration-boundary-gate.js` and proves tailored cloned source-ledger rows
  still resolve to `null` and cannot create an accepted recoverable-error
  boundary admission record.
- Follow-up smoke investigation proved
  `tests/smoke/react-dom-private-root-bridge-shell.mjs` has the same unmount
  host-output cleanup failure on current `main` without the Worker 910
  export-lock commit, so that failure is not caused by this branch.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `worker-progress/worker-910-hydration-recoverable-error-boundary-admission.md`

## First-Load Fix

1. `root-bridge.js` builds `rootBridgeExports` with `Object.freeze(...)` as
   before.
2. Instead of assigning `module.exports = rootBridgeExports`, it defines the
   module `exports` property with `writable: false` and
   `configurable: false`.
3. The first-load attack sequence can still require `root-bridge.js`, but
   `Reflect.set(require.cache[rootBridgePath], 'exports', fakeExports)` now
   returns `false`, and strict assignment throws `TypeError`.
4. When `hydrate-root-source-ledger.js` is imported after that failed swap, it
   captures the real frozen root-bridge WeakMap-backed getter functions.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/src/client/hydrate-root-source-ledger.js`
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
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
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs` failed with
  `FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD` at the existing
  unmount host-output cleanup path.
- On current `main` at `e62d3c816bdd6b11a60b8ac369200232e0d23462`,
  `node tests/smoke/react-dom-private-root-bridge-shell.mjs` failed with the
  same `FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD` at
  `tests/smoke/react-dom-private-root-bridge-shell.mjs:386`.
- `git diff --check`

## Evidence Gathered

- Focused hydration-boundary tests pass and include the new fresh-process
  first-load cache export replacement regression.
- Adjacent private hydration, hydrateRoot text patch, and root-bridge suites
  pass.
- HydrateRoot preflight/text patch conformance ledgers, hydration boundary
  conformance, public facade blocked-gate conformance, client-root oracle, and
  hydration-marker oracle tests pass.
- Package surface and import smoke checks pass.
- Workspace React DOM check passes.
- Branch ancestry confirms `main` does not contain Worker 910 commit
  `aa5a97e4b61c252c47bb9a8893cf5d1e053a3948`; the smoke failure reproduces
  on `main` at `e62d3c816bdd6b11a60b8ac369200232e0d23462` with the same error
  code, message, and smoke callsite.

## Risks Or Blockers

- `tests/smoke/react-dom-private-root-bridge-shell.mjs` still fails on an
  unmount host-output cleanup mismatch, but the exact same failure exists on
  current `main` without this branch. The focused
  `react-dom-private-root-bridge-shell.test.js` suite passes.
- This remains private diagnostic evidence only; no public `hydrateRoot`, real
  hydration/replay, root scheduling, callback routing, native execution,
  reconciler execution, or DOM mutation compatibility is opened.
- A caller that replaces the entire `require.cache[rootBridgePath]` module
  entry is outside this repair; this patch specifically closes the audited
  first-load `require.cache[rootBridgePath].exports` replacement path.

## Recommended Next Tasks

- Assign a separate root-bridge smoke refresh for
  `tests/smoke/react-dom-private-root-bridge-shell.mjs`; its unmount cleanup
  scenario fails on current `main` and no longer matches the passing focused
  root-bridge test suite.
- If later work changes hydrateRoot lifecycle/source-ledger field names, rerun
  the Worker 910 admission tests and align the ledger assertions.
