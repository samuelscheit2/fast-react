# Worker 682: DOM Form Action Callback Preflight

## Goal Evidence

- `create_goal` was called as the first action with objective:
  `add a private form action callback/action invocation preflight that consumes accepted submit dispatch/reset metadata but proves callbacks and actions remain uninvoked`
- `get_goal` was called immediately after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`:
  `add a private form action callback/action invocation preflight that consumes accepted submit dispatch/reset metadata but proves callbacks and actions remain uninvoked`

## Summary

Added a private form action callback/action invocation preflight downstream of
the accepted submit dispatch and fake submit-reset execution records. The gate
consumes both metadata records, records callback dispatch and action invocation
preflight rows, and keeps callback dispatch, submit callback invocation, action
function capture/invocation, form data construction, SyntheticEvent creation,
host transition start, React update queueing, and real form reset blocked.

## Changed Files

- `packages/react-dom/src/shared/form-actions.js`
  - Added the callback/action preflight gate, record type, side-effect
    snapshots, admission and record validation, unsupported error helper,
    payload accessors, describe helper, default record helper, and exports.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added focused package coverage for the accepted callback/action preflight
    path and rejection coverage for live callback/action values, requested
    callback/action/form data execution, and invalid source records.
- `tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
  - Extended the private form-action conformance helper to consume submit
    dispatch and submit-reset execution records in the new preflight.
- `tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
  - Renamed the private form-action conformance test to cover submit, reset,
    and callback preflight gates.
- `worker-progress/worker-682-dom-form-action-callback-preflight.md`
  - Recorded goal evidence, verification, and remaining risk.

## Verification

- `node --check packages/react-dom/src/shared/form-actions.js` passed.
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js` passed.
- `node --check tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs` passed.
- `node --check tests/conformance/test/react-dom-form-actions-oracle.test.mjs` passed.
- `node --test --test-name-pattern='callback/action invocation preflight' packages/react-dom/test/resource-form-unsupported-gates.test.js` passed: 1/1.
- `node --test --test-name-pattern='callback/action invocation preflight|submit reset execution|submit dispatch gate' packages/react-dom/test/resource-form-unsupported-gates.test.js` passed: 3/3.
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js` passed: 48/48.
- `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs` passed: 15/15.
- `npm run check --workspace @fast-react/react-dom` passed: 136/136 package tests plus import-entrypoint smoke checks. npm emitted the existing `minimum-release-age` warning.
- `git diff --check` passed before and after adding this report.

## Delegation

- Spawned one read-only explorer to inspect the existing form-action gate chain.
  It confirmed the new preflight should sit after submit reset execution and
  mirror the existing private gate pattern. The implementation consumes both
  submit dispatch and submit-reset execution records to satisfy this worker's
  explicit submit/reset metadata requirement.

## Risks

- This is private metadata-only evidence. It does not implement real
  SyntheticEvent construction, form data construction, host transitions, public
  form action compatibility, live callback dispatch, action invocation, React
  reset queue writes, or real form reset execution.

## Completion Audit

- Objective deliverable: private callback/action invocation preflight added in
  `packages/react-dom/src/shared/form-actions.js`.
  Evidence: exported create/record/describe/error helpers and WeakMap-backed
  payload accessors for the new preflight record.
- Submit/reset metadata consumption: the preflight accepts a submit dispatch
  record and a submit reset execution record, validates both are accepted
  metadata-only records, and records consumption summaries for both sources.
- Callback/action non-invocation: side-effect snapshots, preflight rows, and
  tests keep `callbackDispatchExecuted`, `submitCallbackInvoked`,
  `actionFunctionCaptured`, `actionInvoked`, and `hostTransitionStarted` false.
- Explicit blocked implementation scope: no real SyntheticEvent, FormData,
  host transition, or live form reset execution was added; source-token audit
  for `form-actions.js` passed.
- Required files: implementation, package test, conformance helper,
  form-action conformance test, and this progress report are the only touched
  files.
- Required verification rerun during completion audit:
  - syntax checks passed for all touched JS/MJS files.
  - focused package tests passed: 3/3.
  - `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
    passed: 15/15.
  - `npm run check --workspace @fast-react/react-dom` passed: 136/136 plus
    import-entrypoint smoke checks, with the existing npm
    `minimum-release-age` warning.
  - `git diff --check` passed.
