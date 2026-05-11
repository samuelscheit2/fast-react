# Worker 802 Resource Root-Map Negative Matrix

## Summary

- Added negative conformance coverage for the private resource root-map storage
  preflight after Worker 794.
- Hardened the root-map storage preflight admission validator to reject
  root-storage/preload-props mutation claims, public head/DOM mutation claims,
  stylesheet/script lifecycle claims, package/export compatibility claims, and
  mixed style/script source rows.
- Kept public resources, DOM/head mutation, stylesheet/script execution,
  package exports, and compatibility claims blocked.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
  - Added root-map preflight claim validation groups.
  - Added canonical row-kind validation for hoistable style/script rows.
  - Extended root-map preflight blocked capability and side-effect summaries.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added package-level negative coverage for tampered source records and claim
    matrices.
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - Added conformance coverage for stale owner/source ids, duplicate canonical
    rows, tampered mixed-kind records, skipped preload-props storage claims,
    raw targets, public resource/head claims, lifecycle claims, and
    package/export claims.
- `worker-progress/worker-802-resource-root-map-negative-matrix.md`
  - Recorded this handoff.

## Commands Run

- `node --check packages/react-dom/src/resource-form-internals-gate.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `node --test --test-name-pattern "root-map storage preflight" tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `node --test --test-name-pattern "root-map storage preflight" packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- The preflight already rejected duplicate canonical root-map rows, stale
  expected source row ids, stale source commit ids, foreign owner roots, and raw
  target fields.
- The admission validator accepted several explicit claim fields that should
  stay impossible for the private preflight boundary. The source now rejects
  those as invalid admissions before producing a preflight record.
- Accepted resource-map commit records and source rows are frozen and WeakMap
  branded; cloned tampered mixed-kind rows are rejected as invalid preflight
  source records.
- The package surface still does not export the private resource-form gates.

## Verification

Passed:

- `node --check packages/react-dom/src/resource-form-internals-gate.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `node --test --test-name-pattern "root-map storage preflight" tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - 4 tests passed.
- `node --test --test-name-pattern "root-map storage preflight" packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - 3 tests passed.
- `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - 22 tests passed.
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - 55 tests passed.
- `npm run check --workspace @fast-react/react-dom`
  - 176 package tests plus import-entrypoint smoke passed.
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

`npm` printed the existing `minimum-release-age` warning; it did not affect the
result.

## Risks Or Blockers

- No blocker remains in this worker scope.
- Overlap risk is in the shared resource/form oracle and unsupported-gates
  files. This change is scoped to the private resource root-map preflight and
  should merge with adjacent resource oracle work by preserving the new
  fail-closed validator and negative matrix assertions.

## Recommended Next Tasks

- Keep these negative assertions until public resource dispatch, real root
  resource storage, DOM/head mutation, stylesheet/script lifecycle behavior,
  and package compatibility are admitted together with public compatibility
  evidence.
