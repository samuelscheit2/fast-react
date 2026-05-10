# Worker 728: Test Renderer Unmount Native Identity Argument Guard

## Summary

- Added a fail-closed guard in the hidden CJS react-test-renderer native serialization facades so `unmount` native execution rejects any non-`undefined` `finishedWorkIdentityEvidence` argument.
- Kept unmount serialization accepted when no identity evidence is supplied; the result still reports `finishedWorkIdentity: null` and `consumesAcceptedFinishedWorkIdentityGate: false`.
- Covered both `create().toJSON` and `create().toTree` hidden native diagnostic helpers in development and production CJS files.
- Did not add a Rust unmount identity adapter. Rust create/update native serialization APIs take identity options; the unmount Rust APIs do not expose an identity argument path.

## Changed Files

- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`

## Evidence

- Before the guard, the new focused conformance case failed because `canCreateAcceptedNativeExecutionDiagnosticResult(unmountRecord, report, identityEvidence)` returned `true`.
- After the guard, the same focused conformance command passed and the new test verifies:
  - toJSON unmount native serialization succeeds with no identity evidence.
  - toJSON unmount native serialization rejects non-`undefined` identity evidence with `FastReactTestRendererPrivateToJSONSerializationError`.
  - toTree unmount native serialization succeeds with no identity evidence.
  - toTree unmount native serialization rejects non-`undefined` identity evidence with `FastReactTestRendererPrivateToTreeMetadataError`.

## Commands Run

- `npm --workspace @fast-react/conformance test -- src/react-test-renderer-serialization-local-gate.test.mjs`
  - First run before the guard: failed on the new focused assertion, proving the prior fail-open behavior.
  - Second run after the guard: passed, `819` tests.
- `npm --workspace @fast-react/react-test-renderer run check`
  - Passed.
- `npm run check:package-surface`
  - Passed.
- `node tests/smoke/import-entrypoints.mjs`
  - Passed.
- `rg -n "finished.*identity|FinishedWorkIdentity|unmount.*identity|identity.*unmount" crates/fast-react-test-renderer/src/lib.rs`
  - Confirmed Rust unmount native serialization has no identity argument path analogous to the JS facade argument.
- `git diff --check`
  - Passed.
- `git status --short`
  - Shows only the intended CJS facade, conformance test, and worker progress changes.

## Risks Or Blockers

- No blockers.
- The guard is intentionally hidden-facade only and does not change public `toJSON`, `toTree`, `.root`, `update`, `unmount`, native loading, native bridge, `act`, React DOM, Scheduler, hydration, events, refs, resources, forms, or controlled input behavior.

## Recommended Next Tasks

- Merge with Worker 727's private-admission ledger updates only after that worker's owned files are ready; this worker did not edit those ledger files.
