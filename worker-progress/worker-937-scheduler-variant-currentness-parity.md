# Worker 937 - Scheduler Variant Currentness Parity

## Status

Complete.

## Summary

- Added a Scheduler variant currentness report and gate to
  `tests/conformance/src/scheduler-variant-oracle.mjs`.
- The report is derived from the accepted Worker 886/909 private admission
  source-currentness ledger and binds every Scheduler variant row to:
  entrypoint, mode, variant id/family, root/native/mock/post_task
  classification, package or deep-CJS path, source SHA, diagnostic export
  names, diagnostic symbol/source ids, diagnostic statuses, and public
  compatibility blockers.
- The gate consumes the checked scheduler variant oracle and the live
  source-owned report, then fails closed for stale oracle/report schema,
  wrong mode, root evidence used as variant evidence, variant evidence used as
  root behavior, forged diagnostic symbols/ids, package/deep-CJS alias
  smuggling, mock/postTask cross-variant aliases, missing CJS diagnostic
  coverage, and public timing/root/act/package compatibility claims.
- No Scheduler runtime or package surface files were changed.

## Changed Files

- `tests/conformance/src/scheduler-variant-oracle.mjs`
- `tests/conformance/test/scheduler-variant-oracle.test.mjs`
- `worker-progress/worker-937-scheduler-variant-currentness-parity.md`

## Currentness Path

- Producer/report:
  `createSchedulerVariantSourceCurrentnessReport()` in
  `tests/conformance/src/scheduler-variant-oracle.mjs`
- Consumer/gate:
  `evaluateSchedulerVariantCurrentnessGate()` in
  `tests/conformance/src/scheduler-variant-oracle.mjs`
- Source owner consumed:
  `evaluatePrivateAdmission886Gate()` from
  `tests/conformance/src/private-admission-886-scheduler-variant-boundary-ledger.mjs`
- Checked oracle consumed:
  `tests/conformance/oracles/scheduler-0.27.0-variant-oracle.json`

## Evidence Gathered

- Baseline variant currentness rows cover all 12 Scheduler source boundaries:
  root wrapper/CJS, native wrapper/CJS, unstable_mock root/CJS, and
  unstable_post_task wrapper/CJS.
- Development and production deep CJS diagnostic coverage is explicit for:
  `scheduler-cjs-unstable-mock-development`,
  `scheduler-cjs-unstable-mock-production`,
  `scheduler-cjs-unstable-post-task-development`, and
  `scheduler-cjs-unstable-post-task-production`.
- Public Scheduler timing, root execution, React act behavior, package
  compatibility, native behavior, postTask behavior, and mock behavior remain
  blocked by currentness gate claims and negative tests.

## Commands Run

- `node --check` for all `packages/scheduler/*.js`,
  `packages/scheduler/cjs/*.js`,
  `tests/conformance/src/scheduler-variant-oracle.mjs`, and
  `tests/conformance/test/scheduler-variant-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-variant-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `node --test tests/conformance/test/scheduler-post-task-root-continuation.test.mjs`
- `node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Check Results

All commands passed. The npm commands emitted the existing npm config warning
for `minimum-release-age`; it did not fail the checks.

## Risks Or Blockers

- No implementation blocker remains.
- The new gate intentionally depends on Worker 886/909 Scheduler
  source-currentness seals. Concurrent Scheduler source edits that change those
  seals must refresh that ledger and rerun this variant currentness gate.
- Overlap risk is limited to scheduler conformance source/tests. This worker
  did not edit Scheduler runtime files, React/React DOM/Rust, package
  manifests, smoke inventories, or public exports.

## Recommended Next Tasks

- After merging any Scheduler source-boundary edits, rerun the variant oracle
  test with the private admission 886 ledger test to confirm the source-owned
  currentness report still matches live files.
- Keep public Scheduler timing/root/act/package/native/postTask/mock
  compatibility claims blocked until main accepts those surfaces separately.
