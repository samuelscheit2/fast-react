# Worker 1000 - Scheduler Boundary Factory Fail-Closed

## Status

Complete.

## Summary

- Hardened the Scheduler variant boundary diagnostics report factory and
  evaluator against caller-shaped option containers.
- Top-level factory/evaluator option public claims, hidden public claims, and
  inherited `variantCurrentnessGate` / `boundaryDiagnosticsReport` options now
  fail closed as structured rejection or violation ids.
- Rejected caller-supplied source gates no longer emit full boundary diagnostic
  rows; malformed or untrusted source-gate input returns an empty row set with
  structured rejection ids.
- `rowsByVariant` now rejects array-shaped and unusual-prototype containers
  before row construction.
- Source-row validation now requires own string fields on null-prototype
  normalized rows, so inherited or `Object.prototype`-polluted fields cannot
  satisfy Worker 937 currentness rows.
- Raw reports are checked for inherited or hidden
  `sourceGateReportRejectionIds`, preventing rejection ids from being hidden
  behind prototype or proxy `get` behavior.
- Expanded native/package/root/act/mock/postTask alias rejection names and
  added symbol public-claim coverage.

## Changed Files

- `tests/conformance/src/scheduler-variant-boundary-diagnostics-currentness.mjs`
- `tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs`
- `worker-progress/worker-1000-scheduler-boundary-factory-failclosed.md`

## Evidence Gathered

- Historical malformed `variantCurrentnessGate` / empty `rowsByVariant`
  coverage was already present on main.
- New in-memory probes confirmed that before this change:
  - `createSchedulerVariantBoundaryDiagnosticsReport(Object.freeze({
    publicPackageCompatibilityClaimed: true }))` produced an accepted report.
  - `evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate(Object.freeze({
    publicNativeCompatibility: true }))` returned the accepted gate.
  - inherited option accessors were ignored.
- Source audit found additional adjacent gaps: rejected source gates emitted
  rows, array-shaped `rowsByVariant` was not rejected as a record-shape error,
  inherited source-row fields could satisfy validation through
  `Object.prototype`, inherited rejection-id arrays were ignored, and several
  non-public native/package alias names were not reported as public claim ids.
- Focused regressions now cover all of those cases.

## Commands Run

- `node --check tests/conformance/src/scheduler-variant-boundary-diagnostics-currentness.mjs`
- `node --check tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs`
- `node --test tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs`
- `node --test tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-post-task-oracle.test.mjs tests/conformance/test/scheduler-post-task-root-continuation.test.mjs`
- `node --test tests/conformance/test/scheduler-root-currentness-gate.test.mjs tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git diff --cached --check`

All commands passed. The npm commands emitted the existing
`minimum-release-age` npm config warning only.

## Risks Or Blockers

- No implementation blocker remains.
- The Worker 987 progress report was not present in this worktree; this branch
  did not depend on Worker 987 output.
- Rejected caller-supplied source gates now suppress all boundary rows. This is
  intentionally stricter and keeps source-owned Worker 886/937 currentness as
  the only accepted row producer.
- Public Scheduler timing, mock, postTask, native, root, act, and package
  compatibility remain blocked.

## Recommended Next Tasks

- After any future Scheduler source-boundary or Worker 937 row shape changes,
  rerun the Worker 886, Worker 937, and boundary diagnostics suites together.
- Keep future caller-input hardening checks focused on raw-report and
  source-gate data before normalization drops hidden or inherited evidence.
