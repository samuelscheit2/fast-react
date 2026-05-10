# Worker 711: DOM Form Action Async Callback Execution

## Goal Evidence

- `create_goal` was called as the first action with objective:
  `add private React DOM form-action evidence for admitted async action callbacks, pending/reset metadata, and fail-closed error paths without enabling public form action compatibility`
- `get_goal` was called immediately after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`:
  `add private React DOM form-action evidence for admitted async action callbacks, pending/reset metadata, and fail-closed error paths without enabling public form action compatibility`

## Summary

Added a private React DOM form-action async callback execution gate downstream
of the existing callback/action preflight. The gate admits only an explicit
`asyncActionCallback`, invokes it with a frozen fake metadata payload, records
pending-status and reset metadata, captures fulfilled/rejected/non-thenable
outcomes, and keeps public submit dispatch, client form data construction,
host transition start, React update queueing, reset commits, and real form
reset blocked.

## Changed Files

- `packages/react-dom/src/shared/form-actions.js`
  - Added the async callback execution gate, record type, WeakMap payload
    accessors, describe/error helpers, blocked side-effect snapshots,
    admission and source-record validation, fulfilled/rejected/non-thenable
    outcome rows, pending/reset metadata rows, and exports.
- `packages/react-dom/src/resource-form-gates.js`
  - Wired the new private gate into root/source-adapter boundary metadata and
    root boundary side-effect blockers.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added focused package coverage for fulfilled private async callbacks,
    rejected/non-thenable fail-closed outcomes, invalid admissions, invalid
    source records, and updated root boundary expectations.
- `tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
  - Added focused form-action conformance coverage for the private async
    callback execution gate.
- `tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
  - Added the focused conformance test entry.
- `worker-progress/worker-711-dom-form-action-async-callback-execution.md`
  - Recorded goal evidence, verification, risks, and next-task notes.

## Commands Run

- `node --check packages/react-dom/src/shared/form-actions.js`
- `node --check packages/react-dom/src/resource-form-gates.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
- `node --check tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `node --test --test-name-pattern='async callback execution|callback/action invocation preflight|root bridge boundary metadata' packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test --test-name-pattern='async callback execution|private submit/reset/callback' tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- conflict-marker scan over touched source/test files
- `git diff --check`

## Evidence Gathered

- React 19.2.6 source reference confirms the form submit path records pending
  status, requests reset before invoking the action, and lets async callbacks
  settle through thenable state/error handling.
- Package test coverage proves the new gate:
  - consumes an accepted callback/action preflight record;
  - records pending-status metadata without constructing client form data;
  - records reset metadata without queueing React updates or resetting forms;
  - invokes only a private `asyncActionCallback` with a frozen fake payload;
  - records fulfilled thenable metadata;
  - records rejected and non-thenable outcomes as fail-closed metadata;
  - rejects live form/public-dispatch admissions before invoking callbacks.
- Resource/form root boundary coverage proves the new private async callback
  gate appears only as blocked source-adapter/root metadata.
- Focused form-action conformance coverage includes the new private async
  callback execution path while public form action compatibility remains
  unclaimed.
- `npm run check --workspace @fast-react/react-dom` passed 142 package tests
  plus import-entrypoint smoke checks. npm emitted the existing
  `minimum-release-age` config warning.

## Risks Or Blockers

- This remains private fake-path evidence. It does not implement real
  SyntheticEvent construction, client form data construction, host transition
  scheduling, public callback dispatch, React update queueing, reset commits,
  error-boundary routing, or live form reset behavior.
- The private gate intentionally executes an admitted callback, so callers must
  use deterministic test callbacks; invalid admissions are validated before
  invocation.

## Recommended Next Tasks

- Add native/reconciler evidence for real async action transition entanglement
  before promoting any public form-action behavior.
- Add separate private error-boundary routing evidence for rejected form
  actions when root/error-boundary execution exists.
- Keep public form action APIs blocked until form data construction, submit
  event dispatch, host transition, and reset commit prerequisites are all
  implemented and compared against React DOM.
