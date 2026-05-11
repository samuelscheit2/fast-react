# Worker 964: Private Admission 727-728 Ledger Refresh

## Summary

- Repaired the 727-728 private-admission ledger after audit: Worker 728 is now
  represented by its actual historical argument-guard diagnostics and evidence,
  not by later strict unmount finished-work identity evidence.
- Added separate current/carry-forward unmount identity evidence for Workers
  730, 733, 754, and 757, and made final gate acceptance require that evidence
  to be recognized.
- Added parser-backed source assertions for CJS and package-root `toJSON` and
  `toTree` gate objects. The checks read top-level object properties instead of
  trusting raw substrings, so comment/string spoofing and public/native
  false-to-true drift fail closed.
- Repaired the source-currentness audit blocker by making JavaScript evidence
  slice anchors and `Object.freeze` lookup ignore comments and strings.
- Hardened row evaluation so a caller override cannot force `recognized: true`
  over missing evidence; `recognized: false` remains available for negative
  tests.

## Changed Files

- `tests/conformance/src/private-admission-727-728-gate.mjs`
- `tests/conformance/test/private-admission-727-728-gate.test.mjs`
- `worker-progress/worker-964-private-admission-727-728-ledger-refresh.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, Worker 727,
  Worker 728, Worker 729, Worker 733, Worker 754, and Worker 757 progress.
- Confirmed the previous 727-728 row expected
  `private-unmount-native-serialization-rejects-finished-work-identity-evidence`
  and `finishedWorkIdentity: null` evidence.
- Confirmed current accepted source/test evidence uses strict unmount
  finished-work identity admission with Worker 733 as the admission worker,
  `unmountNativeExecutionRequiresFinishedWorkIdentity: true`, stale identity
  rejection, deletion/cleanup handoff evidence, and false public/native
  compatibility flags.
- Added regressions for row override spoofing, comment/string source spoofing,
  public/native false-to-true drift, `toTree`-only drift, and missing Worker 728
  historical evidence.
- Added hostile package-root coverage that breaks the real `toJSON` gate anchor
  and inserts a forged canonical gate in a block comment; the gate now fails
  closed. Added equivalent CJS development and production false-to-true drift
  coverage.

## Commands Run

- `node --check tests/conformance/src/private-admission-727-728-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-727-728-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-727-728-gate.test.mjs`
  - passed, 23 tests.
- `npm --workspace @fast-react/conformance exec -- node --test test/private-admission-727-728-gate.test.mjs test/private-admission-732-733-gate.test.mjs test/private-admission-754-766-gate.test.mjs`
  - passed, 54 tests. NPM emitted the existing `minimum-release-age` warning.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Risks Or Blockers

- This change is ledger/test hardening only. It does not claim public
  `react-test-renderer` serialization/root/native compatibility or native
  execution.

## Recommended Next Tasks

- Keep public serialization/root/native compatibility blocked until the
  runtime serialization-local failures are repaired and oracle-backed.
