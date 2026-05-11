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

## Acceptance Audit Follow-Up

- Added explicit row-level and top-level compatibility/public-claim rejection.
  Rows are no longer recognized when overrides set `compatibilityClaimed` or
  `publicCompatibilityClaimed` true, and top-level gate compatibility booleans
  are separately rejected.
- Expanded Worker 779 required public blocker fields to pin the full durable
  rejected-error public boundary shape, including real form acceptance/
  inspection, callback dispatch, action function capture, private async action
  reachability, host transition, previous dispatcher, reset fiber/state,
  reset instance, and reset commit blockers.
- Replaced brittle evidence tokens with durable gate IDs, record types,
  statuses, exported constant names, source function names, and source field
  names. Removed package test-title and error-string evidence tokens.

## Changed Files

- `tests/conformance/src/private-admission-778-779-gate.mjs`
  - New static ledger/evaluator for Workers 778 and 779.
  - Records resource/form diagnostic IDs and statuses plus required false
    public blocker fields.
  - Rejects public compatibility claims, public blocker leaks, runtime/package/
    export claims, stale status lists, unknown claim keys, and missing source
    evidence tokens.
  - Follow-up: rejects row/top-level compatibility booleans and expands Worker
    779 public boundary blockers.
- `tests/conformance/test/private-admission-778-779-gate.test.mjs`
  - New focused tests for the accepted static ledger and its negative cases.
  - Follow-up: added row/top-level compatibility boolean and public form
    boundary blocker leak coverage.
- `worker-progress/worker-796-private-admission-778-779-resource-form-ledger.md`
  - This handoff.

## Evidence Gathered

- Worker 778 source evidence is pinned to
  `packages/react-dom/src/resource-form-internals-gate.js`.
  Durable tokens include:
  - `privateResourceHintRootMapStoragePreflightGateId`
  - `resource-hint-root-map-storage-preflight-private-gate-1`
  - `privateResourceHintRootMapStoragePreflightRecordType`
  - `fast.react_dom.private_resource_hint_root_map_storage_preflight_record`
  - `privateResourceHintRootMapStoragePreflightStatus`
  - `preflighted-private-resource-hint-root-map-storage-record`
  - `recordResourceHintRootMapStoragePreflightWithGate`
  - `createPublicResourceRootMapStorageBoundary`
  - `resourceHintRootMapStoragePreflightBlockedSideEffects`
  - `diagnosed-private-resource-hint-root-map-storage-preflight`
  - required false blockers for resource dispatch, root storage mutation,
    hoistable map mutation, script/module dispatch, stylesheet load-state
    dispatch, and compatibility.
- Worker 779 source evidence is pinned to
  `packages/react-dom/src/shared/form-actions.js` and the focused conformance
  source.
  Durable tokens include:
  - `privateFormActionRejectedErrorPreflightGateId`
  - `form-action-rejected-error-preflight-private-gate-1`
  - `privateFormActionRejectedErrorPreflightRecordType`
  - `fast.react_dom.private_form_action_rejected_error_preflight_record`
  - `privateFormActionRejectedErrorPreflightStatus`
  - `private-form-action-rejected-error-preflight-metadata-only`
  - `recorded-private-form-action-rejected-error-preflight`
  - `recordFormActionRejectedErrorPreflightWithGate`
  - `createPublicFormActionRejectedErrorPreflightBoundary`
  - `formActionRejectedErrorPreflightBlockedSideEffects`
  - `blocked-public-form-action-reset-and-rejected-error-routing`
  - required false blockers for submit dispatch, request reset, action
    invocation, error routing, React update queueing, root error callbacks, and
    real form reset.

## Commands Run

- `node --check tests/conformance/src/private-admission-778-779-gate.mjs`
- `node --check tests/conformance/test/private-admission-778-779-gate.test.mjs`
- `node --test tests/conformance/test/private-admission-778-779-gate.test.mjs`
  - Initial run: 6 tests passed.
  - Follow-up run: 8 tests passed.
- `npm run check:package-surface`
  - Passed; npm printed the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs`
  - Passed.
- `git diff --cached --check`
  - Passed.
- `git diff --check`
  - Passed.

## Follow-Up Commands Run

- `node --check tests/conformance/src/private-admission-778-779-gate.mjs`
- `node --check tests/conformance/test/private-admission-778-779-gate.test.mjs`
- `node --test tests/conformance/test/private-admission-778-779-gate.test.mjs`
  - 8 tests passed.
- `npm run check:package-surface`
  - Passed; npm printed the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs`
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
