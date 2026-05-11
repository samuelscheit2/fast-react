# Worker 808 Resource/Form Admission Ledger

## Summary

- Added a static/read-only conformance ledger for accepted resource/form
  hardening from Workers 778, 779, 794, 796, 800, and 802.
- Pinned durable worker IDs, gate/record IDs, statuses, and field names for
  root-map storage, root-map negative coverage, rejected-error preflight,
  stale rejected async execution handling, reset/public boundary blockers, and
  public-claim rejection.
- Kept all public resource/form behavior blocked: no public resource dispatch,
  root resource-map mutation, DOM/head mutation, stylesheet/script lifecycle,
  submit dispatch, reset/action invocation, error routing, package/export
  compatibility, or public compatibility is admitted.
- The ledger reads source/test/package files and the existing 778-779 ledger
  only. It does not execute resource/form gates or public APIs.
- Audit follow-up added the missing root-map negative blocker fields for
  stylesheet resource behavior, stylesheet precedence behavior, and root
  manifest/lockfile mutation; added Worker 800 reset/action blocker fields for
  action invocation requests and public reset requests; and replaced brittle
  expression/object-literal evidence tokens with durable field/function/status
  identifiers.

## Changed Files

- `tests/conformance/src/private-admission-808-resource-form-ledger.mjs`
  - New static evaluator for the six-worker resource/form hardening ledger.
  - Imports and requires the accepted Worker 796 / 778-779 ledger to remain
    recognized.
  - Records exact accepted IDs/statuses/field-name arrays and false public
    blocker fields.
  - Rejects public resource/form claims, reset/action/submit/error routing
    leaks, DOM/head/lifecycle leaks, package/export leaks, static-mode drift,
    missing evidence tokens, stale status/id arrays, and blocker field drift.
  - Audit follow-up: expanded the public blocker inventory and evidence tokens
    for `publicStylesheetResourceBehavior`,
    `publicStylesheetPrecedenceBehavior`,
    `rootManifestsOrLockfilesMutated`, `actionInvocationRequested`, and
    `publicRequestFormResetRequested`.
- `tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
  - New focused tests for the accepted ledger and its fail-closed cases.
  - Audit follow-up: asserts the added resource/package and form reset/action
    blockers fail closed without brittle evidence snippets.
- `worker-progress/worker-808-resource-form-admission-ledger.md`
  - This handoff.

## Commands Run

- `node --check tests/conformance/src/private-admission-808-resource-form-ledger.mjs`
- `node --check tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
  - 6 tests passed.
- `node --test --test-name-pattern "root-map storage preflight" tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - 4 tests passed.
- `node --test --test-name-pattern "rejected-error preflight|async callback execution" tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
  - 2 tests passed.
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --cached --check`
- `git diff --check`
- `git commit -m "Add resource form admission ledger"`
- Audit follow-up:
  - `node --check tests/conformance/src/private-admission-808-resource-form-ledger.mjs`
  - `node --check tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
  - `node --test tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
    - 6 tests passed.
  - `node --test --test-name-pattern "root-map storage preflight" tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
    - 4 tests passed.
  - `node --test --test-name-pattern "rejected-error preflight|async callback execution" tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
    - 2 tests passed.
  - `node tests/smoke/package-surface-guard.mjs`
  - `node tests/smoke/import-entrypoints.mjs`

## Evidence Gathered

- Worker 778 root-map source still exposes private gate IDs/statuses,
  `createResourceHintRootMapStoragePreflightGate`, root-map public blockers,
  and blocked public resource dispatch fields.
- Worker 794 conformance coverage pins canonical `hoistableStyles` and
  `hoistableScripts` root-map rows, skipped `preload-props`, source-row
  validation, stale source rejection, and unchanged React DOM package exports.
- Worker 802 negative coverage pins mixed-row rejection, preload-props/root
  storage claims, public head/DOM mutation claims, stylesheet/script lifecycle
  claims, stylesheet resource/precedence public behavior blockers, raw target
  blockers, root manifest/lockfile mutation blockers, and package/export claim
  rejection.
- Worker 779/800 form source and conformance coverage pins rejected async
  preflight IDs/statuses, stale rejected execution consumption, reset/action
  public blockers, submit dispatch, action invocation requests, public reset
  requests, error routing, DOM mutation, and package compatibility blockers.
- Package surface and import smoke checks still pass, so no public resource/form
  package export was added.

## Verification

Passed:

- `node --check tests/conformance/src/private-admission-808-resource-form-ledger.mjs`
- `node --check tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
- `node --test --test-name-pattern "root-map storage preflight" tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `node --test --test-name-pattern "rejected-error preflight|async callback execution" tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --cached --check`
- `git diff --check`
- Audit follow-up:
  - `node --check tests/conformance/src/private-admission-808-resource-form-ledger.mjs`
  - `node --check tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
  - `node --test tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
  - `node --test --test-name-pattern "root-map storage preflight" tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - `node --test --test-name-pattern "rejected-error preflight|async callback execution" tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
  - `node tests/smoke/package-surface-guard.mjs`
  - `node tests/smoke/import-entrypoints.mjs`

## Risks Or Blockers

- No blocker remains in this worker scope.
- Overlap risk is limited to adjacent resource/form conformance and private
  admission ledger files. This worker added a new ledger pair instead of
  editing shared resource/form implementation paths.
- The ledger intentionally uses source identifiers, statuses, function names,
  and field names as evidence. If those contracts are intentionally renamed,
  update the ledger and focused tests together.

## Recommended Next Tasks

- Keep public resource compatibility blocked until root-owned resource maps,
  public resource dispatch, DOM/head insertion, stylesheet/script lifecycle,
  and package compatibility have execution-backed evidence.
- Keep public form action compatibility blocked until submit dispatch, reset
  commit, action invocation, error routing, and React update scheduling are
  admitted with end-to-end evidence.
