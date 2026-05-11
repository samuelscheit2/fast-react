# Worker 909 - Scheduler Variant Private Currentness Ledger

## Summary

Strengthened Worker 886's accepted Scheduler variant boundary ledger with a
source-currentness seal for every accepted row. Each row now records package
manifest identity, source file and physical entrypoint identity, canonical
entrypoint, variant family, runtime mode, source kind, wrapper targets, private
diagnostic source ids/statuses where present, and a SHA-256 digest of the
current Scheduler source file.

The gate now re-derives that currentness data from the live local
`packages/scheduler` files and rejects rows whose declared seal or live source
seal no longer matches the accepted baseline.

## Changed Files

- `tests/conformance/src/private-admission-886-scheduler-variant-boundary-ledger.mjs`
- `tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs`
- `worker-progress/worker-909-scheduler-variant-private-currentness-ledger.md`

## Source/Currentness Validation Path

- `evaluatePrivateAdmission886Gate()` still starts from the accepted Worker 886
  rows and applies test-only row overrides.
- Each evaluated row now includes `actualSourceCurrentness`, derived by reading:
  - `packages/scheduler/package.json`
  - the row's `sourceBoundary.sourceFile`
- The derived currentness includes:
  - package name/version
  - source path and `packages/scheduler` physical entrypoint
  - canonical package/deep entrypoint
  - variant family and runtime mode
  - source kind (`node-env-wrapper`, `package-root-private-mock-wrapper`,
    `cjs-development`, `cjs-development-guarded`, or `cjs-production`)
  - wrapper CJS targets for root/native/mock/postTask wrappers
  - private diagnostic source ids/status strings for mock and postTask variants
  - source SHA-256 digest
- The gate compares both `row.sourceCurrentness` and `actualSourceCurrentness`
  against `PRIVATE_ADMISSION_886_REQUIRED_SOURCE_CURRENTNESS`.
- Mismatches produce `scheduler-variant-source-currentness-mismatch`, set
  `sourceCurrentnessRecognized` to false, and keep the overall private
  admission gate blocked.

## Negative Canaries Added

- Stale source digest.
- Caller-cloned development currentness replayed on a production row.
- Cross-variant source replay.
- Root/native alias confusion.
- Mock/postTask alias confusion.
- Package-root/deep-CJS import mismatch.

## Checks Run

- `node --check tests/conformance/src/private-admission-886-scheduler-variant-boundary-ledger.mjs`
- `node --check tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs`
- `node --test tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-post-task-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-root-oracle.test.mjs`
- `npm run check --workspace scheduler`

## Risks Or Blockers

- No package files were changed and no Scheduler public API was broadened.
- The new source digests intentionally make this ledger fail if another worker
  changes the covered Scheduler source files without updating the private
  admission row. This is the intended currentness guard, but it is an overlap
  risk for concurrent Scheduler workers.
- Native runtime execution remains blocked; the ledger only reads source and
  package metadata.

## Recommended Next Tasks

- When package/scheduler workers land source edits, require them to rerun this
  ledger and update the source-currentness seals deliberately.
- Consider applying the same source-currentness pattern to older private
  admission ledgers that currently rely on static token lists only.
