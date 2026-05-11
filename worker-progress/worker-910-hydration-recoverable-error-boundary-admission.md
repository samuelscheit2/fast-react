# Worker 910 Hydration Recoverable Error Boundary Admission

## Summary

- Added a private/test-only `FastReactDomHydrationRecoverableErrorBoundaryAdmissionRecord`.
- Extended accepted hydration boundary metadata with `hydration-recoverable-error-boundary-admission`.
- The new admission requires canonical WeakMap-backed hydration boundary, recoverable-error preflight, target-claiming, and blocked replay execution records.
- The admission also requires hydrateRoot public-facade source-ledger evidence: current hydrateRoot preflight, event replay preflight, execution preflight, and source-owned active lifecycle request boundary.
- Rechecks marker and target currentness at admission time so replay is rejected after marker or target state changes.
- Rejects cloned/caller-built rows, cross-root source ledgers, missing lifecycle/source ledger evidence, stale marker/target evidence, and recoverable-error callback/value alias options.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-910-hydration-recoverable-error-boundary-admission.md`

## Admission And Currentness Path

1. `recordUnsupportedHydrateRoot` creates the private hydration boundary record and accepted metadata ledger.
2. hydrateRoot public facade preflight creates the recoverable-error preflight plus lifecycle request-boundary ledger.
3. target claiming and event replay preflight create canonical target-claiming and blocked replay execution records.
4. `createHydrationRecoverableErrorBoundaryAdmissionRecord` accepts only when all identities match the same boundary/options/source ledger.
5. The admission re-inspects current markers and re-resolves the target path against the original dispatch target before recording the boundary row.

## Commands Run

- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/hydration-private.test.js`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

All commands passed.

## Evidence Gathered

- Positive hydration boundary test proves a current hydrateRoot lifecycle/replay/recoverable-error source chain admits exactly one private recoverable-error boundary row without invoking callbacks or mutating DOM/listeners.
- Negative hydration boundary test proves cloned preflight/claim/replay records, missing lifecycle ledger, cross-root source ledger, callback/root-options aliases, stale marker rows, and stale target rows fail closed.
- Adjacent private hydration/root-bridge tests pass with the added accepted metadata row.

## Risks Or Blockers

- This remains diagnostic/private evidence only; no public `hydrateRoot`, real replay, real hydration, root scheduling, or DOM mutation behavior is opened.
- Source-ledger validation ducks the exported private hydrateRoot public-facade record shapes from `root-bridge.js` because importing root bridge into the boundary gate would create a cycle.
- Worker 901 is concurrently changing React DOM root bridge lifecycle evidence. If its lifecycle record field names/status strings change, this admission canary may need a small alignment patch.

## Recommended Next Tasks

- After Worker 901 lands, rerun hydrateRoot public-facade lifecycle/currentness tests and align the source-ledger shape if needed.
- Add a root-bridge-owned wrapper for this admission if the orchestrator wants the canary reachable directly from hydrateRoot preflight APIs.
