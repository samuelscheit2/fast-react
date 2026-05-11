# Worker 941 - CJS TestInstance Currentness

## Summary

- Hardened `react-test-renderer/cjs/react-test-renderer.production` private TestInstance diagnostics so production now carries the same private findBy/query-bridge preflight metadata as CJS development.
- Kept public `root`, `ReactTestInstance.find*`, `toJSON`, `toTree`, `act`, Scheduler execution, native bridge execution, and compatibility claims fail-closed.
- Strengthened production TestInstance lifecycle acceptance so query diagnostics require source-owned lifecycle evidence from the private WeakSet, current create/update/unmount sequencing, expected source record ids, public/native/package blocker fields, and the current root request.
- Added conformance coverage for production CJS findBy/preflight parity, stale lifecycle-gated preflight access, shape-only query row rejection, public TestInstance/serialization/native/act/Scheduler/package claim smuggling, and package-root/development/production cross-entrypoint lifecycle drift.

## Exact CJS TestInstance Currentness Path

`create().root/ReactTestInstance.find*` remains public-blocked. The private path is:

1. `consumePrivateRootLifecycleExecutionEvidence({create, update, unmount})`
2. `isAcceptedTestInstanceLifecycleEvidenceForRootRequest(...)`
3. `isAcceptedTestInstanceLifecycleEvidenceSequencedForRootRequest(...)`
4. `getTestInstanceQueryDiagnosticsForRootRequest(currentUnmountRequest)`
5. `createPrivateTestInstanceWrapperRecordForRootRequest(...)`
6. `createPrivateTestInstanceQueryBridgePreflightRecord(...)`

Production CJS now rejects cloned/stale/cross-entrypoint lifecycle rows before query diagnostics and rejects caller-shaped query diagnostic rows before preflight consumption.

## Changed Files

- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-941-test-renderer-cjs-testinstance-currentness.md`

## Commands Run

- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- CJS production and development both expose private findBy query diagnostics and query-bridge preflight only after accepted, source-owned lifecycle evidence.
- Stale `create` request preflight access returns the lifecycle gate, not query diagnostics.
- Caller-shaped query rows with public TestInstance, public serialization/toJSON/toTree, native execution, act/Scheduler, or package compatibility claims are rejected.
- Package-root rows are rejected by CJS development and production; CJS development rows are rejected by CJS production.
- Public TestInstance/root/serialization surfaces remain blocked and public `act` production remains unavailable.

## Risks Or Blockers

- No blockers.
- Overlap risk: active Rust inspection/currentness work may later add stronger native query evidence; this JS-side production gate should merge cleanly but may need test expectation updates if Rust begins exposing real public TestInstance behavior.

## Recommended Next Tasks

- If Rust later exposes production-owned TestInstance findBy/preflight rows, wire those rows into this same source-owned preflight consumer instead of adding a parallel public TestInstance path.
