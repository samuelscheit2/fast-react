# Worker 796: Private Admission 778-779 Resource/Form Ledger

## Summary

- Added a static/read-only private-admission ledger for accepted Workers 778 and
  779 under conformance.
- Pinned durable gate IDs, record types, request/contract IDs, accepted
  statuses, and public-compatibility blockers for the resource root-map storage
  preflight and form rejected-error preflight.
- Kept the ledger source-token-only: it reads source/test text and does not
  invoke resource gates, form gates, public resource APIs, public form APIs,
  DOM/head mutation, submit/reset/action paths, package compatibility, or
  exports.
- No package script wiring was needed because the conformance workspace already
  runs `test/*.test.mjs`.

## Changed Files

- `tests/conformance/src/private-admission-778-779-gate.mjs`
  - New static ledger/evaluator for Workers 778 and 779.
  - Records resource/form diagnostic IDs and statuses plus required false
    public blocker fields.
  - Rejects public compatibility claims, public blocker leaks, runtime/package/
    export claims, stale status lists, unknown claim keys, and missing source
    evidence tokens.
- `tests/conformance/test/private-admission-778-779-gate.test.mjs`
  - New focused tests for the accepted static ledger and its negative cases.
- `worker-progress/worker-796-private-admission-778-779-resource-form-ledger.md`
  - This handoff.

## Evidence Gathered

- Worker 778 source evidence is pinned to
  `packages/react-dom/src/resource-form-internals-gate.js` and package tests.
  Durable tokens include:
  - `resource-hint-root-map-storage-preflight-private-gate-1`
  - `fast.react_dom.private_resource_hint_root_map_storage_preflight_record`
  - `preflighted-private-resource-hint-root-map-storage-record`
  - `diagnosed-private-resource-hint-root-map-storage-preflight`
  - `blocked-public-resource-root-map-storage`
  - required false blockers for resource dispatch, root storage mutation,
    hoistable map mutation, script/module dispatch, stylesheet load-state
    dispatch, and compatibility.
- Worker 779 source evidence is pinned to
  `packages/react-dom/src/shared/form-actions.js` and the focused conformance
  source.
  Durable tokens include:
  - `form-action-rejected-error-preflight-private-gate-1`
  - `fast.react_dom.private_form_action_rejected_error_preflight_record`
  - `private-form-action-rejected-error-preflight-metadata-only`
  - `recorded-private-form-action-rejected-error-preflight`
  - `blocked-public-form-action-reset-and-rejected-error-routing`
  - required false blockers for submit dispatch, request reset, action
    invocation, error routing, React update queueing, root error callbacks, and
    real form reset.

## Commands Run

- `node --check tests/conformance/src/private-admission-778-779-gate.mjs`
- `node --check tests/conformance/test/private-admission-778-779-gate.test.mjs`
- `node --test tests/conformance/test/private-admission-778-779-gate.test.mjs`
  - 6 tests passed.
- `npm run check:package-surface`
  - Passed; npm printed the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs`
  - Passed.
- `git diff --cached --check`
  - Passed.
- `git diff --check`
  - Passed.

## Risks Or Blockers

- No blocker remains in this worker scope.
- This ledger intentionally performs source-token and manifest evaluation only.
  It does not run the private gates or claim public resource/form compatibility.
- The evidence tokens are source identifiers, statuses, and blocker fields. If
  those contracts are intentionally renamed, update the ledger and focused tests
  together.
- Overlap risk is limited to future private-admission ledgers that may also
  append after Worker 779; this worker only adds a new 778-779 pair and progress
  file.

## Recommended Next Tasks

- Keep public resource root-map storage compatibility blocked until resource
  map creation/mutation, DOM/head insertion, and resource lifecycle behavior
  have separate oracle-backed evidence.
- Keep public form action rejected-error compatibility blocked until submit
  dispatch, reset commit, action invocation, error routing, and React update
  scheduling are admitted with execution evidence.
