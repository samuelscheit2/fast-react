# Worker 1245 Progress

## Summary

- Reproduced the audit false green: enumerable `Object.prototype.actualEntrypoint`
  and `Object.prototype.actualSourcePath` could leave the scheduler-root
  currentness gate passing with no violations.
- Hardened scheduler-root row/evidence validation so plain-object rows are only
  accepted when `Object.prototype` still exposes the known clean built-in
  surface.
- Added hostile tests for `Object.prototype` non-claim variant metadata on local
  observation rows and on `behaviorEvidence`.

## Changed Files

- `tests/conformance/src/scheduler-root-currentness-gate.mjs`
- `tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `worker-progress/worker-1245-repair-scheduler-root-object-prototype-variant-fields.md`

## Commands Run

- `node --input-type=module ...` audit reproducer before the fix: reproduced
  passing status with `violationIds: []`.
- `node --check tests/conformance/src/scheduler-root-currentness-gate.mjs`:
  passed.
- `node --check tests/conformance/test/scheduler-root-currentness-gate.test.mjs`:
  passed.
- `node --test tests/conformance/test/scheduler-root-currentness-gate.test.mjs`:
  passed, 31/31 tests.
- `node --test tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs`:
  passed, 111/111 tests.
- `npm run check --workspace scheduler`: passed; npm emitted the existing
  `minimum-release-age` config warning, then the scheduler smoke check passed.
- `npm run check:package-surface`: passed, package surface snapshot guard passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `git diff --check`: passed.
- `node --input-type=module ...` audit reproducer after the fix: returned
  `blocked-public-scheduler-compatibility-with-currentness-violations` with
  `scheduler-root-currentness-local-observation-row-identity-mismatch`,
  `scheduler-root-currentness-source-row-identity-mismatch`, and
  `scheduler-root-currentness-variant-or-deep-cjs-evidence-used`.

## Evidence

- The gate now reports violations when non-claim variant metadata is inherited
  through `Object.prototype` by local rows or behavior evidence.

## Risks / Blockers

- No blockers.
- The gate now treats any extra own key on `Object.prototype` as a fail-closed
  condition for plain scheduler-root row/evidence records. This is intentionally
  stricter than the previous compatibility-claim-only inherited scan.
