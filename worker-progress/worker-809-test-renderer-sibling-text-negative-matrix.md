# Worker 809 - Test Renderer Sibling Text Negative Matrix

## Summary

- Added focused negative coverage for package-root `toJSON`, CJS `toJSON`, and
  CJS `toTree` sibling-text private admissions.
- Covered alias-only and inherited `rootFinishedLanesHandoff`, stale
  root request id/sequence/root id, stale handoff root identity, mismatched
  committed fiber inspection, generic finished-work identity, broad multichild
  identity, and public/native/package compatibility claims.
- The new tests exposed a real CJS `toJSON` validator gap: sibling-text
  host-output rows accepted top-level public/native/package flags. Development
  and production CJS validators now reject those row claims.
- Public `toJSON`, `toTree`, TestInstance, native bridge execution, and package
  compatibility remain blocked.

## Changed Files

- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-809-test-renderer-sibling-text-negative-matrix.md`

## Commands Run

- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs --test-name-pattern "sibling|toJSON|toTree|root finished"`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs --test-name-pattern "sibling|toJSON|toTree|root finished"`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- Focused serialization local-gate run passed: 14 tests.
- Focused create-routing run passed: 34 tests.
- Package surface snapshot guard passed.
- Import entrypoint smoke passed.
- `git diff --check` passed.
- CJS development and production now reject top-level sibling-text
  `hostOutputRow.publicToJSONAvailable`,
  `hostOutputRow.publicTestInstanceAvailable`,
  `hostOutputRow.nativeExecution`, and
  `hostOutputRow.compatibilityClaimed` claims.

## Risks Or Blockers

- No blockers.
- Test-renderer overlap risk is in the same sibling-text private admission
  region touched by Workers 768, 769, 787, and 799. This change preserves the
  accepted package-root vs CJS scope split: package-root `toJSON` still owns
  package-root sibling-text admission, while CJS-only committed fiber inspection
  requirements remain on CJS `toJSON` and `toTree`.

## Recommended Next Tasks

- Keep future sibling-text public/native promotion work behind these negative
  gates so compatibility flags cannot silently open private admission paths.
