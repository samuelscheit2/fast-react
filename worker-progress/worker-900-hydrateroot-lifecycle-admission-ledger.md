# Worker 900 - HydrateRoot Lifecycle Admission Ledger

## Summary

- Added conformance recognition for Worker 887 hydrateRoot lifecycle request-boundary evidence on the accepted private text-claim patch path.
- Updated the actual 820 source ledger to include Worker 887 source-owned hydrateRoot lifecycle boundary/admission evidence and to correct the stale Worker 803 sibling-order token.
- The public facade conformance now checks exact lifecycle boundary/request identity, source-owned WeakMap admission ownership, lifecycle snapshot identity, same preflight/request payload linkage, and blocked public/native/reconciler/DOM/event/compatibility fields.
- Kept the stale same-container and cloned/foreign/caller-built lifecycle rejection coverage intact through the existing focused tests.
- Hardened the 820 evidence evaluator against test-file evidence paths and added a Worker 887 test-title/source-snippet rejection case.
- Removed the test-side 820 ledger override; direct `evaluatePrivateAdmission820Gate()` now recognizes the real source ledger rows.

## Changed Files

- `tests/conformance/src/private-admission-820-reconciler-ledger.mjs`
- `tests/conformance/test/private-admission-820-reconciler-ledger.test.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-900-hydrateroot-lifecycle-admission-ledger.md`

## Commands Run

- `node --test tests/conformance/test/private-admission-820-reconciler-ledger.test.mjs packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --input-type=module -e 'import { evaluatePrivateAdmission820Gate } from "./tests/conformance/src/private-admission-820-reconciler-ledger.mjs"; const gate=evaluatePrivateAdmission820Gate(); console.log(JSON.stringify({status: gate.status, violations: gate.violations}, null, 2));'`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `node --check tests/conformance/src/private-admission-820-reconciler-ledger.mjs && node --check tests/conformance/test/private-admission-820-reconciler-ledger.test.mjs && node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs && node --check packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js && git diff --check`

## Evidence

- Direct `evaluatePrivateAdmission820Gate()` without overrides returned `recognized-accepted-private-reconciler-and-hydrateroot-lifecycle-boundary-public-blocked` with no violations.
- Focused `node --test` passed 52/52 tests across the private 820 ledger, hydrateRoot text-claim patch bridge, and public facade blocked gate.
- `@fast-react/react-dom` workspace check passed 203/203 package tests plus import-entrypoint smoke checks.
- Package surface guard and import-entrypoint smoke checks passed.
- The accepted Worker 887 source ledger row covers the lifecycle boundary record type/status, WeakMap source ownership, exact request/root/container/hydrate identities, same-container currentness functions, text-patch lifecycle admission, and blocked public/native/reconciler/DOM/event/compatibility fields.
- The 820 negative evidence test rejects worker-progress prose, test-title evidence paths, formatted prose tokens, and source-snippet tokens.

## Risks Or Blockers

- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` overlaps with other React DOM facade workers; merge review should preserve the exact lifecycle boundary identity/currentness assertions with any nearby hydrateRoot changes.
- The 820 source ledger now includes a React DOM `root-bridge.js` row in addition to Rust reconciler rows; this is intentional for the accepted Worker 887 admission gap.

## Recommended Next Tasks

- Keep any future hydrateRoot evidence consumers tied to `lifecycleRequestBoundary` identity/currentness before treating private hydration rows as mutation evidence.
- If this ledger is later split by domain, carry forward the Worker 887 row's lifecycle boundary record type, boundary status, WeakMap source ownership, exact request/root/container/hydrate identities, same-container stale rejection, and public/native/reconciler/DOM/event/package blockers.
