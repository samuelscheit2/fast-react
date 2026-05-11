# Worker 787 - CJS Sibling Text toJSON Admission

## Summary

Extended the CJS-only private `create().toJSON` sibling-text admission path so
it now requires the dedicated sibling-text finished-work identity plus canonical
`rootFinishedLanesHandoff` evidence, committed fiber inspection parity, and
closed public/native/package compatibility flags. The generic finished-work
identity remains rejected for sibling-text reports, and public `toJSON`,
`toTree`, TestInstance, package root exports, and native bridge execution remain
blocked.

## Changed Files

- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`

## Evidence

- CJS dev/prod `toJSON` sibling-text private facade now advertises and consumes
  `rootFinishedLanesHandoff` and committed fiber inspection evidence.
- `createAcceptedSiblingTextDiagnosticResult` returns accepted handoff metadata,
  frozen handoff evidence, committed inspection metadata, and public/native
  compatibility blockers.
- Missing handoff, alias-only handoff, forged lane handoff, generic identity
  evidence, missing committed inspection, and invalid committed inspection all
  fail closed in tests.
- Follow-up audit coverage added for inherited/prototype
  `rootFinishedLanesHandoff` rejection on the CJS dev/prod private `toJSON`
  sibling-text path, with a routing-gate mirror.

## Commands Run

- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- Follow-up:
  - `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
  - `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
  - `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
  - `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
  - `node tests/smoke/package-surface-guard.mjs`
  - `node tests/smoke/import-entrypoints.mjs`
  - `git diff --check`

## Risks Or Blockers

- No blockers. The package-root `index.js` path was intentionally left unchanged
  because the task scope was the CJS private admission path.

## Recommended Next Tasks

- Consider a follow-up source-generation alignment if the CJS files are later
  generated from a shared source.
