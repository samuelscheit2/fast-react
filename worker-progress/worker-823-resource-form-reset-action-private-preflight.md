# Worker 823 Resource/Form Reset Action Private Preflight

## Summary

- Added private reset/action preflight hardening for the form action fake reset
  and callback/action preflight path.
- Public form submission, submit dispatch, requestFormReset, action
  invocation, DOM mutation, React update, and package compatibility claims now
  fail before reset/action preflight records are created.
- Callback/action preflight records a frozen reset/action public-blocker
  matrix, and root/source-adapter summaries now expose the submit-reset and
  callback/action preflight boundaries directly.
- Added focused package tests for stale source IDs, foreign reset execution
  records, fake cloned metadata, frozen accepted records, fake-form-path raw
  fields, and public/package claim rejection.
- Kept public resource/form behavior blocked; no public resource dispatch,
  form submit/reset/action execution, DOM mutation, error routing, package
  surface, or compatibility path was admitted.
- Audit follow-up added broader alias blockers for reset/action preflight and
  rejected-error preflight admissions, including public submit/reset/action
  reachability, DOM mutation enablement, React update/updateQueue aliases, and
  public package/export compatibility claims.

## Changed Files

- `packages/react-dom/src/shared/form-actions.js`
  - Tightened submit reset execution admission with source dispatch ID checks,
    public behavior blockers, package compatibility blockers, and fake-form
    path raw/public metadata rejection.
  - Tightened callback/action preflight admission with source dispatch/reset
    execution ID checks and public behavior/package blockers.
  - Audit follow-up: added shared fail-closed alias checks for
    `publicSubmitDispatchReachable`, `publicRequestFormResetReachable`,
    `publicActionInvocationReachable`, `domMutation`,
    `publicDomMutationEnabled`, `reactUpdate`, `updateQueue`,
    `publicPackageCompatibilityClaimed`, and
    `packageExportCompatibilityClaimed`.
  - Added frozen reset/action public-blocker metadata to callback/action
    preflight records and unsupported errors.
  - Expanded public form action boundaries for submit-reset and
    callback/action preflight to keep public submit/reset/action/DOM/package
    behavior visibly false.
- `packages/react-dom/src/resource-form-gates.js`
  - Added submit-reset execution and callback/action preflight boundaries to
    root-bridge and source-adapter summaries.
  - Exported private boundary describers for those two gates.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added accepted metadata assertions for the new public blockers.
  - Added reset/action preflight negative matrix coverage for stale, foreign,
    fake, raw, public, and package-claim inputs.
  - Audit follow-up: expanded reset/action and rejected-error negative
    matrices to cover broader public/update/package alias claims.
  - Updated exact root/source-adapter boundary shape assertions.
- `worker-progress/worker-823-resource-form-reset-action-private-preflight.md`
  - This handoff.

## Commands Run

- `node --check packages/react-dom/src/shared/form-actions.js`
- `node --check packages/react-dom/src/resource-form-gates.js`
- `node --check packages/react-dom/src/resource-form-internals-gate.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test --test-name-pattern "submit reset execution|callback/action invocation preflight|reset/action preflight|fake metadata negative matrix|root-map storage preflight|rejected-error" packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- Audit follow-up:
  - `node --check packages/react-dom/src/shared/form-actions.js`
  - `node --check packages/react-dom/src/resource-form-gates.js`
  - `node --check packages/react-dom/src/resource-form-internals-gate.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test --test-name-pattern "submit reset execution|callback/action invocation preflight|reset/action preflight|rejected-error|fake metadata negative matrix" packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `npm run check --workspace @fast-react/react-dom`
  - `node tests/smoke/package-surface-guard.mjs`
  - `node tests/smoke/import-entrypoints.mjs`
  - `git diff --check`

## Evidence Gathered

- Worker 808’s ledger keeps public resource/form behavior blocked and pins
  reset/action public blockers, submit dispatch blockers, package/export
  blockers, and accepted private form/resource gate IDs.
- Worker 812’s fake metadata matrix already covers rejected-error and
  resource root-map paths; this worker filled the adjacent reset/action
  preflight gap.
- Existing submit-reset and callback/action preflight gates admitted a private
  metadata/fake path, but did not explicitly reject all public/package claim
  fields or record callback/action public blockers at the preflight layer.
- The new matrix proves accepted reset/action records are frozen and branded,
  fake/cloned records are rejected by WeakMap branding, foreign reset
  execution rows do not pair with unrelated submit dispatch rows, and stale
  source IDs fail before record creation.
- Package-surface and import smoke checks still pass, so no public package
  compatibility was added.
- Audit follow-up proves the broader alias names cannot be smuggled through
  admission as ignored false-positive compatibility evidence.

## Verification

Passed:

- Focused reset/action/resource/rejected-error package pattern: 10 tests
  passed.
- Full `packages/react-dom/test/resource-form-unsupported-gates.test.js`: 58
  tests passed.
- `npm run check --workspace @fast-react/react-dom`: 180 tests passed plus
  import-entrypoint smoke passed.
- Package surface smoke passed.
- Import entrypoints smoke passed.
- `git diff --check` passed.
- Audit follow-up:
  - Focused alias/resource/form package pattern: 7 tests passed.
  - Full `packages/react-dom/test/resource-form-unsupported-gates.test.js`:
    58 tests passed.
  - `npm run check --workspace @fast-react/react-dom`: 180 tests passed plus
    import-entrypoint smoke passed.
  - Package surface smoke passed.
  - Import entrypoints smoke passed.
  - `git diff --check` passed.

`npm` printed the existing `minimum-release-age` warning; it did not affect the
result.

## Risks Or Blockers

- No blocker remains in this worker scope.
- Merge risk is moderate because this worker touches the same
  `resource-form-unsupported-gates.test.js` form/resource matrix used by nearby
  workers. Preserve both matrices on merge.
- `packages/react-dom/src/resource-form-internals-gate.js` was inspected and
  syntax-checked but did not require changes for this reset/action preflight
  hardening.

## Recommended Next Tasks

- Keep public form action compatibility blocked until real submit dispatch,
  requestFormReset, action invocation, host transitions, React updates, reset
  commits, and DOM behavior have execution-backed evidence.
- Keep public resource compatibility blocked until root-owned resource maps,
  public resource dispatch, DOM/head insertion, stylesheet/script lifecycle,
  and package compatibility have end-to-end evidence.
