# Worker 794 Resource Root-Map Conformance Gate

## Summary

- Added conformance coverage for Worker 778's private resource root-map storage
  preflight.
- Validated canonical `hoistableStyles` and `hoistableScripts` root-map rows,
  skipped `preload-props` rows, stale source-row rejection, and fail-closed
  public/package export boundaries.
- Kept the coverage private and record-only: no public resource dispatch,
  DOM/head mutation, stylesheet/script lifecycle execution, root resource map
  mutation, package compatibility claim, or package export is admitted.

## Changed Files

- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - Added canonical root-map storage preflight conformance coverage.
  - Added stale source-row and stale source commit id rejection coverage.
  - Added a local deterministic root-map storage preflight scenario helper.
- `worker-progress/worker-794-resource-root-map-conformance-gate.md`
  - Recorded this handoff.

## Commands Run

- `node --check tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- Worker 778's package gate exposes
  `createResourceHintRootMapStoragePreflightGate()` as private source-only
  metadata and records root-owned storage rows from accepted resource-map commit
  rows.
- The preflight maps `hoistable-styles` to `hoistableStyles`,
  `hoistable-scripts` to `hoistableScripts`, and leaves `preload-props` rows
  skipped because they are not root-owned storage.
- The package export surface still does not expose the private root-map storage
  preflight gate.

## Verification

Passed:

- `node --check tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - 20 tests passed.
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - 55 tests passed.
- `npm run check --workspace @fast-react/react-dom`
  - 174 package tests plus import-entrypoint smoke passed.
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

`npm` printed the existing `minimum-release-age` warning; it did not affect the
results.

## Risks Or Blockers

- No blocker remains in this worker scope.
- Overlap risk is limited to the shared resource-hints conformance test file;
  this worker only added private root-map preflight assertions and a helper.

## Recommended Next Tasks

- Preserve these fail-closed assertions until public resource hint dispatch,
  real root resource storage, DOM/head mutation, and stylesheet/script
  lifecycle behavior are admitted together with public compatibility evidence.
