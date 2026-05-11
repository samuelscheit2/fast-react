# Worker 910 Hydration Recoverable Error Boundary Admission

## Summary

- Added a private/test-only `FastReactDomHydrationRecoverableErrorBoundaryAdmissionRecord`.
- Extended accepted hydration boundary metadata with `hydration-recoverable-error-boundary-admission`.
- The new admission requires canonical WeakMap-backed hydration boundary, recoverable-error preflight, target-claiming, and blocked replay execution records.
- The admission also requires hydrateRoot public-facade source-ledger evidence: current hydrateRoot preflight, event replay preflight, execution preflight, and source-owned active lifecycle request boundary derived from root-bridge WeakMap payload ownership.
- Rechecks marker and target currentness at admission time so replay is rejected after marker or target state changes.
- Rejects cloned/caller-built rows, cloned or rewired source-ledger records, cross-root source ledgers, missing lifecycle/source ledger evidence, stale marker/target evidence, and recoverable-error callback/value alias options.
- Freezes the root-bridge export object so the hydrateRoot source-ledger getter capabilities are non-writable/non-configurable before source-ledger lookup can use them.
- Removes the source-ledger lazy `require('./root-bridge.js')` path; root-bridge initialization now installs closure-owned payload readers into the source-ledger module, and admission uses those captured references instead of cache-resolved exports.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/hydrate-root-source-ledger.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `tests/smoke/package-surface-snapshot.json`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-910-hydration-recoverable-error-boundary-admission.md`

## Admission And Currentness Path

1. `recordUnsupportedHydrateRoot` creates the private hydration boundary record and accepted metadata ledger.
2. hydrateRoot public facade preflight creates the recoverable-error preflight plus lifecycle request-boundary ledger.
3. target claiming and event replay preflight create canonical target-claiming and blocked replay execution records.
4. `root-bridge.js` installs its WeakMap-backed hydrateRoot public-facade payload readers into `hydrate-root-source-ledger.js` during root-bridge initialization.
5. `createHydrationRecoverableErrorBoundaryAdmissionRecord` accepts only when all identities match the same boundary/options/source ledger and all ledger rows resolve to root-bridge source-owned WeakMap payloads.
6. The admission re-inspects current markers and re-resolves the target path against the original dispatch target before recording the boundary row.

## Commands Run

- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/src/client/hydrate-root-source-ledger.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/hydration-private.test.js`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface` (failed before snapshot update for the new private implementation file, then passed)
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

All commands passed after the root-bridge export freeze, captured source-ledger reader install, require-cache export replacement regression, and monkeypatch regression rerun.

## Evidence Gathered

- Positive hydration boundary test proves a current hydrateRoot lifecycle/replay/recoverable-error source chain admits exactly one private recoverable-error boundary row without invoking callbacks or mutating DOM/listeners.
- Negative hydration boundary test proves cloned preflight/claim/replay records, cloned/rewired source-ledger rows, caller registrar import abuse, one-at-a-time mixed source-ledger swaps, missing lifecycle ledger, cross-root source ledger, callback/root-options aliases, stale marker rows, and stale target rows fail closed.
- Negative hydration boundary test also proves direct assignment and `Object.defineProperty` monkeypatch attempts against the four hydrateRoot source-ledger getter exports throw, caller attempts to install source-ledger readers are rejected, replacing `require.cache[rootBridgePath].exports` with fake getter payloads does not redirect source-ledger reads, and cloned source-ledger rows still resolve to `null`.
- Adjacent private hydration/root-bridge tests pass with the added accepted metadata row.

## Risks Or Blockers

- This remains diagnostic/private evidence only; no public `hydrateRoot`, real replay, real hydration, root scheduling, or DOM mutation behavior is opened.
- Source-ledger validation uses captured `hydrate-root-source-ledger.js` readers over root-bridge WeakMap payloads. The source-ledger module exports no ledger record registration capability, its non-enumerable reader installer is guarded for root-bridge initialization, it no longer lazily resolves root-bridge through `require.cache`, and the root-bridge getter capabilities it reads are frozen/non-writable/non-configurable, so caller-shaped clones cannot become source-owned by importing or monkeypatching the bridge modules.
- Worker 901 is concurrently changing React DOM root bridge lifecycle evidence. If its lifecycle record field names/status strings change, this admission canary may need a small alignment patch.

## Recommended Next Tasks

- After Worker 901 lands, rerun hydrateRoot public-facade lifecycle/currentness tests and align the source-ledger shape if needed.
- Add a root-bridge-owned wrapper for this admission if the orchestrator wants the canary reachable directly from hydrateRoot preflight APIs.
