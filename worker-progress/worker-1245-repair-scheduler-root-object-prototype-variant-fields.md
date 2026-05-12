# Worker 1245 Progress

## Summary

- Reproduced the audit false green: enumerable `Object.prototype.actualEntrypoint`
  and `Object.prototype.actualSourcePath` could leave the scheduler-root
  currentness gate passing with no violations.
- Hardened scheduler-root source metadata validation with a targeted inherited
  metadata scanner for source rows, local observation rows, and nested
  `behaviorEvidence`.
- Preserved exact own enumerable data-property requirements for expected
  manifest fields while rejecting inherited source/variant metadata such as
  `actualEntrypoint`, `actualSourcePath`, `sourcePath`, `entrypoint`,
  `packageName`, and `packageSourcePath`.
- Added hostile Object.prototype tests covering native, mock, postTask,
  deep-CJS, sourcePath, entrypoint, packageName, and packageSourcePath smuggling
  through local rows and through `behaviorEvidence`.

## Changed Files

- `tests/conformance/src/scheduler-root-currentness-gate.mjs`
- `tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `worker-progress/worker-1245-repair-scheduler-root-object-prototype-variant-fields.md`

## Commands Run

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

## Evidence

- The gate now reports local row identity violations when non-claim
  source/variant metadata is inherited through `Object.prototype` by local
  rows.
- The gate now reports behavior evidence violations when the same inherited
  metadata is visible through `localRow.behaviorEvidence`.
- Existing Object.prototype public-claim rejection remains covered by the
  focused gate test and still passes.
- Source rows also fail closed when inherited source metadata is present on the
  prototype chain.

## Audit, Review, Or Nested-Agent Findings

- No nested agents were used.
- Reviewed Worker 1243 and Worker 1243 repair reports before editing. The final
  repair keeps their exact row/source manifest and public claim alias rejection
  intact.
- Replaced the first-pass broad clean-`Object.prototype` requirement with a
  targeted inherited source metadata scan so unrelated prototype keys are not
  treated as Scheduler root compatibility evidence.

## Risks / Blockers

- No blockers.
- Residual maintenance risk: future scheduler-root source metadata fields should
  be added to `SCHEDULER_ROOT_CURRENTNESS_SOURCE_METADATA_KEYS` when introduced.
- No public Scheduler timing, root, native, mock, postTask, deep-CJS, or package
  compatibility claim is opened.

## Recommended Next Tasks

- Run the usual independent source audit before merge, focused on additional
  Object.prototype source metadata aliases and preserving the existing public
  claim rejection matrix.
