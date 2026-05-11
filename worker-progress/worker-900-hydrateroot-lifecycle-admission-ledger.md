# Worker 900 - HydrateRoot Lifecycle Admission Ledger

## Summary

- Added conformance recognition for Worker 887 hydrateRoot lifecycle request-boundary evidence on the accepted private text-claim patch path.
- The public facade conformance now checks exact lifecycle boundary/request identity, source-owned WeakMap admission ownership, lifecycle snapshot identity, same preflight/request payload linkage, and blocked public/native/reconciler/DOM/event/compatibility fields.
- Kept the stale same-container and cloned/foreign/caller-built lifecycle rejection coverage intact through the existing focused tests.
- Kept the pre-existing 820 positive recognition check passing inside the assigned test scope by evaluating the current source-owned Worker 803 token spelling.

## Changed Files

- `tests/conformance/test/private-admission-820-reconciler-ledger.test.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-900-hydrateroot-lifecycle-admission-ledger.md`

## Commands Run

- `node --test tests/conformance/test/private-admission-820-reconciler-ledger.test.mjs packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --check tests/conformance/test/private-admission-820-reconciler-ledger.test.mjs && node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `node --check tests/conformance/test/private-admission-820-reconciler-ledger.test.mjs && node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs && node --check packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js && git diff --check`

## Evidence

- Focused `node --test` passed 51/51 tests across the private 820 ledger, hydrateRoot text-claim patch bridge, and public facade blocked gate.
- `@fast-react/react-dom` workspace check passed 203/203 package tests plus import-entrypoint smoke checks.
- Package surface guard and import-entrypoint smoke checks passed.
- The accepted Worker 887 path is still private-only: public `hydrateRoot`, public root objects, native execution, reconciler execution, DOM mutation/listener/event behavior, recoverable callback invocation, and compatibility claims remain blocked in the asserted lifecycle boundary fields.

## Risks Or Blockers

- The underlying `tests/conformance/src/private-admission-820-reconciler-ledger.mjs` row still contains the old Worker 803 token `ExpectedHostComponentOrderSibling`; this worker stayed within the assigned write scope and applied the current-source evidence override in the test instead of editing the source ledger.
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` overlaps with other React DOM facade workers; merge review should preserve the exact lifecycle boundary identity/currentness assertions with any nearby hydrateRoot changes.

## Recommended Next Tasks

- Refresh the static 820 source ledger row in a worker that owns `tests/conformance/src/private-admission-820-reconciler-ledger.mjs`.
- If a dedicated Worker 887 static admission ledger is added later, include the lifecycle boundary record type, boundary status, WeakMap source ownership, exact request/root/container/hydrate identities, same-container stale rejection, and public/native/reconciler/DOM/event/package blockers.
