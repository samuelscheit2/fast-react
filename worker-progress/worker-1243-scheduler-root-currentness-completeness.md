# Worker 1243 - Scheduler Root Currentness Completeness

## Summary

- Extended `scheduler-root-currentness-gate` from the old subset to all 11 `SCHEDULER_ROOT_SCENARIO_IDS`.
- Added currentness coverage for `scheduler-root-task-object-shape`, `scheduler-root-did-timeout`, and `scheduler-root-priority-context`.
- Tightened the scenario manifest check so checked-oracle/source scenario ids missing from the currentness gate, or unexpected currentness ids, fail closed.
- Tightened public compatibility claim name detection to catch `Compatible` claim names such as `fastReactBehaviorCompatible`.
- Follow-up audit repair: local observation rows now require an exact expected manifest, source rows now require an exact expected manifest and identity, and local row/evidence claim-like fields are rejected.
- Second audit repair: local observation manifests now use exact `rowId` values, and source row identity now rejects extra fields such as injected public claim aliases or forged identity fields.
- Third audit repair: local row/evidence claim scanning now normalizes snake_case and dash-separated aliases, blocking forms such as `public_native_compatibility_claimed`.

## Changed Files

- `tests/conformance/src/scheduler-root-currentness-gate.mjs`
- `tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `worker-progress/worker-1243-scheduler-root-currentness-completeness.md`

## Commands Run

- `node --check tests/conformance/src/scheduler-root-currentness-gate.mjs`
- `node --check tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `node --test tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `node --test tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs`
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- Focused currentness test passed with 11 tests, including missing-row and stale-row cases for task shape, didTimeout, and priority context.
- Follow-up focused currentness test passed with 15 tests, including unexpected local rows, omitted/forged source rows, and local row/evidence public claim fields.
- Second follow-up focused currentness test passed with 17 tests, including forged local `rowId` and extra source-row field identity bypass cases.
- Third follow-up focused currentness test passed with 18 tests, including snake_case compatibility aliases on local rows and behavior evidence.
- Companion Scheduler/root/blocker/variant conformance suite passed with 111 tests.
- Scheduler workspace check, package surface guard, smoke import checks, and diff whitespace check passed.
- Negative evidence now rejects deep CJS, native, mock, postTask, and private variant evidence as root behavior evidence.
- Public compatibility claim mutation is rejected from conformance claims, evidence claims, package behavior compatibility, and implementation comparison summaries.
- Public compatibility claim mutation is also rejected from claim-like fields injected directly on local observation rows and behavior evidence.

## Audit Or Review Findings

- No nested agents were used.
- While adding compatibility-claim tests, found and fixed case-sensitive claim detection that missed `fastReactBehaviorCompatible`.
- Source audit found fail-open caller-injection paths for unexpected local rows, omitted source rows, and local row/evidence claim-like fields; all were repaired with focused hostile coverage.
- Second source audit found row identity bypasses for forged local `rowId` values and extra source row fields; both were repaired with exact manifest/key validation.
- Third source audit found snake_case public compatibility aliases on local row/evidence fields; normalized claim matching now rejects those aliases.

## Risks Or Blockers

- No known blockers.
- Residual risk is limited to future scenario ids introduced without probe-runner support; the manifest/currentness gate now fails closed instead of silently ignoring them.
- Future additions to source-row definitions must update the exact source manifest expectations; omission now fails closed.

## Recommended Next Tasks

- None for this worker scope.
