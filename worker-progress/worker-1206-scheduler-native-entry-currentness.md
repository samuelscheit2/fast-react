# Worker 1206 - Scheduler Native Entry Currentness

## Status

Complete.

## Summary

- Added an independent conformance-only Scheduler native-entry currentness gate
  in `tests/conformance/src/scheduler-native-entry-oracle.mjs`.
- The gate reruns current local `packages/scheduler` native-entry observations
  through the existing native-entry probe runner in a temporary
  `node_modules/scheduler` project, then compares them to the checked
  native-entry oracle rows.
- The gate binds native source rows for `scheduler-native-wrapper`,
  `scheduler-cjs-native-development`, and
  `scheduler-cjs-native-production` to the accepted Worker 937 Scheduler
  variant currentness gate as private context only.
- Compatibility remains blocked: `compatibilityClaimed` is false on the
  accepted path, public/native/package claims are false, native runtime
  execution is not admitted, and broad Scheduler/package compatibility is not
  claimed.
- Added focused negative tests for stale source currentness and public claim
  smuggling, plus a compact failure case for stale schema, missing local rows,
  mode mismatch, and native/default aliasing.

## Changed Files

- `tests/conformance/src/scheduler-native-entry-oracle.mjs`
- `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `worker-progress/worker-1206-scheduler-native-entry-currentness.md`

## Evidence Gathered

- Rebased cleanly onto current `main` at
  `e561dd91a489ba96a16283d695db99ef90212aaa`; after the rebase,
  `git merge-base HEAD main` returned
  `e561dd91a489ba96a16283d695db99ef90212aaa`.
- Before this currentness report update, branch history after the rebase
  contained the rebased implementation commit
  `7e2e349a0a10d71275fab509768ae2ea84f177de`, followed by report-only commits
  `4143674c2af720f319a784781a175b713d8e6a3f` and
  `0bec7a7131e59b4685b147c8e65fb7bdb35dacc9`.
- Current local native-entry rows are collected from the local scheduler package
  copied into a temporary `node_modules/scheduler`, preserving the checked
  oracle path shape without mutating manifests or running lifecycle scripts.
- Source-currentness context is consumed from a fresh module-owned Worker 937
  `evaluateSchedulerVariantCurrentnessGate()` result and accepted only when it
  retains its Worker 937 gate id/status, private Worker 886 context, and false
  compatibility claim.
- Native wrapper and direct native CJS source rows are compared against the
  current accepted variant-currentness rows, including package path, physical
  entrypoint, source file, mode, source SHA, wrapper targets, and public
  blocker claims.
- The evaluator rejects stale oracle schema, missing local rows, mode mismatch,
  native/default/deep-CJS aliasing, stale source rows, public Scheduler timing
  claims, native runtime execution claims, root/act/mock/postTask/package
  claims, and generic package compatibility claim smuggling.

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
- `git diff --stat`
- `git rebase main`
- `git rev-parse HEAD`
- `git rev-parse main`
- `git merge-base HEAD main`

## Verification Results

Passing:

- `node --check tests/conformance/src/scheduler-native-entry-oracle.mjs`
- `node --check tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
  - 20 tests passed.
- `node --test tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs`
  - 46 tests passed.
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

Notes:

- The npm commands emitted the existing `minimum-release-age` npm config
  warning only.
- The post-rebase diff stayed limited to the assigned files, and the
  report-only follow-up stayed limited to this worker report.

## Risks Or Blockers

- No blocker remains.
- The gate intentionally depends on Worker 937 Scheduler variant currentness
  rows. Future Scheduler native source edits that change source digests or
  entrypoint boundaries must refresh the accepted variant currentness context
  before this native-entry gate can pass.
- This worker did not edit Scheduler runtime source, package manifests, public
  React DOM facade files, or React Children files.

## Recommended Next Tasks

- When Scheduler native wrapper or native CJS source changes, rerun this gate
  together with the Worker 937/886 variant currentness tests before admitting
  any native-entry evidence.
- Keep public Scheduler timing/root/act/native/mock/postTask/package
  compatibility blocked until separate public behavior gates are accepted.

## Commit Hash

- Current main/base: `e561dd91a489ba96a16283d695db99ef90212aaa`
- Rebased implementation commit:
  `7e2e349a0a10d71275fab509768ae2ea84f177de` (`Add scheduler native entry
  currentness gate`)
- Report repair commit:
  `4143674c2af720f319a784781a175b713d8e6a3f` (`Record worker 1206 report
  hash`)
- Final-report hash repair commit:
  `0bec7a7131e59b4685b147c8e65fb7bdb35dacc9` (`Record worker 1206 final
  report hash`)
