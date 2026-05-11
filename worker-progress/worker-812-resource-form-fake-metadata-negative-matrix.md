# Worker 812 Resource/Form Fake Metadata Negative Matrix

## Summary

- Added package tests proving accepted private resource root-map storage and
  form rejected-error preflight records remain frozen, private metadata only.
- Added narrow negative matrices for stale root-map/skipped preload rows,
  tampered stylesheet/script lifecycle metadata, stale async form execution,
  wrong form/action identity clones, reset/public submit dispatch claims, error
  routing claims, DOM/head mutation claims, package/export claims, and public
  resource/form compatibility claims.
- Kept this test-only; no public resource, form, reset/action invocation,
  submit dispatch, DOM/head mutation, or package export behavior was enabled.

## Changed Files

- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added rejected-error fake metadata negative matrix after the accepted
    rejected-error preflight coverage.
  - Added resource root-map fake metadata negative matrix after the accepted
    root-map storage preflight coverage.
  - Added a small helper for creating a rejected private async form-action
    execution fixture.
- `worker-progress/worker-812-resource-form-fake-metadata-negative-matrix.md`
  - Recorded this handoff.

## Commands Run

- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test --test-name-pattern "fake metadata negative matrix|root-map storage preflight|rejected-error" packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Evidence Gathered

- Accepted root-map storage rows, skipped preload-props rows, rejected async
  execution records, and rejected-error preflight payloads are frozen.
- Tampered cloned records are rejected by the private WeakMap branding checks.
- Admission matrices reject stale root-map expectations, skipped preload source
  rows, raw root/form targets, public dispatch/reset/error routing claims,
  lifecycle execution claims, DOM/head mutation claims, and package/export
  compatibility claims before any public behavior can run.
- Accepted records still strip raw resource URLs, integrity strings, nonces, and
  form error objects from public-facing diagnostics.

## Verification

Passed:

- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- Focused resource/form package test pattern: 7 tests passed.
- Full `packages/react-dom/test/resource-form-unsupported-gates.test.js`: 57
  tests passed.
- `npm run check --workspace @fast-react/react-dom`: 179 tests passed plus
  import-entrypoint smoke passed.
- `git diff --check`

`npm` printed the existing `minimum-release-age` warning; it did not affect the
result.

## Risks Or Blockers

- No blocker remains in this worker scope.
- Merge risk is moderate because adjacent workers also edit
  `packages/react-dom/test/resource-form-unsupported-gates.test.js`; this patch
  is test-only and should merge by preserving both new matrix tests.

## Recommended Next Tasks

- Keep these negative tests until public resources/forms, reset/action
  invocation, submit dispatch, DOM/head mutation, and package compatibility are
  implemented with real compatibility evidence.
