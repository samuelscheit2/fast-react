# Worker 779: Form Action Rejected-Error Preflight

## Summary

Added a private React DOM form-action rejected-error preflight downstream of
the accepted private async callback execution gate. The new gate consumes only
accepted rejected fake-callback execution records, records rejected async/action
error metadata, and records reset/action public blockers while keeping public
form submission, reset dispatch, action invocation, error routing, DOM mutation,
React update queueing, and compatibility claims blocked.

## Changed Files

- `packages/react-dom/src/shared/form-actions.js`
  - Added the rejected-error preflight gate, record type, schema/status/error
    constants, WeakMap payload accessors, describe/error helpers, admission and
    record validation, side-effect snapshots, metadata builders, and private
    module exports.
- `packages/react-dom/src/resource-form-gates.js`
  - Wired the new private gate into resource/form root and source-adapter
    boundary metadata and root boundary blocked side effects.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added package coverage for rejected async/action error metadata, stale
    reuse, foreign cloned records, malformed fulfilled sources, and public
    reset/action/error blockers remaining false.
- `tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
  - Added focused conformance coverage for the private rejected-error preflight.
- `tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
  - Added the focused conformance test entry.
- `worker-progress/worker-779-form-action-rejected-error-preflight.md`
  - Recorded evidence, verification, risks, and next tasks.

## Commands Run

- `node --check packages/react-dom/src/shared/form-actions.js`
- `node --check packages/react-dom/src/resource-form-gates.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
- `node --check tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `node --test --test-name-pattern='rejected-error preflight|async callback execution|root bridge boundary metadata' packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test --test-name-pattern='rejected-error preflight|async callback execution' tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- conflict marker scan over touched source/test files

## Evidence Gathered

- React 19.2.6 reference source shows form actions set pending status, request
  reset before invoking actions, and rejected async action state is represented
  as rejected thenable/error metadata.
- Package tests prove the preflight accepts only a rejected private async
  callback execution record and records summarized error metadata without raw
  error capture, public error routing, action invocation, React updates, or real
  form resets.
- Negative tests cover stale reuse on the same preflight gate, foreign cloned
  rejection objects, fulfilled async callback records as malformed rejection
  sources, and admissions that request public error routing, action invocation,
  or public reset.
- Resource/form boundary tests prove the new gate appears only as blocked
  metadata in root/source-adapter summaries.
- Package-surface and import-entrypoint smoke checks passed, so no public
  package export or entrypoint shape changed.

## Risks Or Blockers

- This remains private metadata/preflight evidence. It does not implement real
  submit dispatch, SyntheticEvent construction, FormData construction, host
  transitions, public action invocation, public error routing, error-boundary
  recovery, React update queueing, or live form reset behavior.
- The new gate intentionally consumes only records produced by the private fake
  async callback execution gate; broader public form action error behavior still
  needs separate end-to-end renderer and reconciler evidence.

## Recommended Next Tasks

- Add private error-boundary/root error routing evidence for form action errors
  only after accepted root error update scheduling exists.
- Keep public form action APIs blocked until FormData construction, submit event
  dispatch, host transition scheduling, reset commit, and error propagation are
  implemented and compared against React DOM.
