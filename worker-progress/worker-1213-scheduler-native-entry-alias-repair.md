# Worker 1213 - Scheduler Native Entry Alias Repair

## Status

Complete - committed and ready for verification.

## Summary

- Repaired the Scheduler native-entry currentness gate so behavior evidence is
  accepted only when it names the expected native entrypoint for the scenario.
- Closed the audit blocker where otherwise-current rows could smuggle default
  Scheduler behavior evidence with `behaviorEvidence.entrypoint = "scheduler"`.
- Closed the related false-green path where
  `defaultEntrypointRelationshipObserved = true` could be treated as native
  behavior evidence.
- Kept default-entrypoint relationship probing as oracle observation data, but
  stopped recording it as admitted native behavior evidence in currentness rows.

## Changed Files

- `tests/conformance/src/scheduler-native-entry-oracle.mjs`
- `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `worker-progress/worker-1213-scheduler-native-entry-alias-repair.md`

## Evidence Gathered

- Audit blocker confirmed the previous `isNativeEntryBehaviorEvidence` helper
  checked evidence kind/scenario/package/direct-CJS flags/public claims, but did
  not check `behaviorEvidence.entrypoint` or
  `defaultEntrypointRelationshipObserved`.
- The repaired helper now derives the expected behavior-evidence entrypoint
  from the scenario:
  `scheduler/index.native.js` for wrapper/native-entry observations and
  `scheduler/cjs/scheduler.native.*.js` for direct native CJS loading.
- Hostile local rows that otherwise match the checked oracle now fail the
  currentness gate with
  `scheduler-native-entry-currentness-native-default-deep-cjs-evidence-used`
  and row status `native-entry-alias-or-public-behavior-evidence-used`.
- Existing stale schema, stale source, missing row, mode mismatch, source alias,
  and public-claim smuggling blockers remain covered by the native-entry oracle
  test file.
- Follow-up source and verification audits were clean: no source or test files
  were edited for this report-hash follow-up, and the verification evidence
  remains tied to the repair commit below.

## Commands Run

- `node --check tests/conformance/src/scheduler-native-entry-oracle.mjs`
- `node --check tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs`
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git status --short --branch`
- `git log --oneline --decorate -5`
- `git status --short`

## Verification Results

Passing:

- `node --check tests/conformance/src/scheduler-native-entry-oracle.mjs`
- `node --check tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
  - 22 tests passed, including hostile entrypoint alias and
    default-entrypoint relationship evidence canaries.
- `node --test tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs`
  - 46 tests passed.
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

Notes:

- The npm commands emitted the existing `minimum-release-age` npm config
  warning only.

## Audit, Review, Or Nested-Agent Findings

- Repair was driven by the Worker 1206 audit blocker: aliased native/default
  behavior evidence could pass the currentness gate when the local row was
  otherwise current.
- Follow-up audit found the worktree clean before the report-only update and
  confirmed this follow-up did not edit source or test files.
- No nested agents were used.

## Risks Or Blockers

- No blocker remains.
- This repair intentionally does not claim native runtime or public Scheduler
  compatibility; it only tightens the native-entry currentness evidence gate.

## Recommended Next Tasks

- Keep running these hostile evidence canaries whenever Scheduler native-entry
  currentness rows or source-boundary gates are refreshed.

## Commit Hashes

- Implementation repair commit: 94025d2acf85d84d6cd2830cf3bc35bc2d9c8878
- Report/final branch tip commit: 0356767aeac2513f922e0168e28d8d2d4aaadecc
- Follow-up report metadata commit before this audit repair: 807aafab6bdc079cb401b2cc60e9962ad497588c
