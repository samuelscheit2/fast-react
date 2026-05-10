# Worker 549: Form Action FormData Blocker Diagnostic

## Objective

Add private form action `FormData` blocker diagnostics that record why real
form inspection and action invocation remain blocked while accepted submit/reset
metadata is present.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted form action event extraction and reset queue/commit metadata.

## Write Scope

- `packages/react-dom/src/shared/form-actions.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `worker-progress/worker-549-form-action-formdata-blocker-diagnostic.md`

## Requirements

- Record form target shape, submitter shape, accepted event/reset metadata ids,
  blocked FormData construction, and blocked action invocation.
- Keep real form reads, previous dispatcher calls, reset execution, and public
  compatibility blocked.

## Verification

- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

