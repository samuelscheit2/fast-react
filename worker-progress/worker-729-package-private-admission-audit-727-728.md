# Worker 729: Package Private Admission Audit 727-728

## Summary

- Added the static private-admission ledger for queue 727-728.
- Audit follow-up tightened the ledger evaluator so accepted rows fail closed
  on missing accepted diagnostic IDs, dependency diagnostic ID drift, blocker
  diagnostic ID drift, blocked public surface drift, and blocked public claim
  drift.
- Classified Worker 727 as `skipped-meta` ledger work with no runtime
  capability and no compatibility promotion.
- Recorded Worker 728 as an `accepted-private-diagnostic` for the private
  react-test-renderer unmount native identity argument guard.
- Kept Worker 728 scoped to rejecting identity evidence on unmount native
  serialization. The row depends on existing unmount route, cleanup handoff,
  and private toJSON/toTree native execution evidence; Worker 725/726 update
  identity work is recorded only as blocker context, not as a full unmount
  finished-work identity adapter.
- Scope stayed limited to conformance source/tests and this progress report.
  No runtime/product code, package exports, package manifests, public
  entrypoints, benchmarks, timing manifests, `MASTER_*`, or orchestrator files
  were edited.

## Changed Files

- `tests/conformance/src/private-admission-727-728-gate.mjs`
- `tests/conformance/test/private-admission-727-728-gate.test.mjs`
- `worker-progress/worker-729-package-private-admission-audit-727-728.md`

## Evidence Gathered

- Inspected `WORKER_BRIEF.md`, the existing 724-726 private-admission
  gate/test, Worker 727 and Worker 728 reports, and the relevant unmount native
  dependency reports for Workers 612, 638, 639, and 667.
- Verified Worker 727 was static ledger/audit work only and did not add runtime
  capability or public/package compatibility.
- Verified Worker 728 is a private guard that rejects non-`undefined`
  finished-work identity evidence for unmount native `toJSON` and `toTree`
  diagnostics while preserving private empty-host unmount results with
  `finishedWorkIdentity: null` and
  `consumesAcceptedFinishedWorkIdentityGate: false`.
- Recorded Workers 725 and 726 only as blocker context for update identity
  evidence, and added fail-closed coverage so removing that context is a ledger
  violation while it is not listed as an unmount dependency.
- Added fail-closed tests for missing accepted diagnostic IDs, unrecognized
  accepted diagnostics, stale/meta accepted worker ids, skip/meta rows claiming
  runtime capability, missing dependency worker metadata, missing dependency
  diagnostic metadata, missing blocker context workers, missing blocker context
  diagnostics, blocked public surface drift, blocked public claim drift,
  row-level compatibility claims, and public promotion leaks across every
  blocked surface.

## Commands Run

- `node --check tests/conformance/src/private-admission-727-728-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-727-728-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-727-728-gate.test.mjs`
  - passed, 10 tests.
- `npm --workspace @fast-react/conformance test -- src/react-test-renderer-serialization-local-gate.test.mjs test/react-test-renderer-create-routing-gate.test.mjs test/private-admission-727-728-gate.test.mjs`
  - passed, 838 tests. NPM emitted the existing `minimum-release-age` warning.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git add --intent-to-add tests/conformance/src/private-admission-727-728-gate.mjs tests/conformance/test/private-admission-727-728-gate.test.mjs worker-progress/worker-729-package-private-admission-audit-727-728.md`
  - ran so `git diff --check` includes new files.
- `git diff --check` - passed.
- `git status --short` - shows only the three scoped added files.
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" tests/conformance/src/private-admission-727-728-gate.mjs tests/conformance/test/private-admission-727-728-gate.test.mjs worker-progress/worker-729-package-private-admission-audit-727-728.md`
  - passed with no conflict markers.
- Audit follow-up rerun:
  `node --check tests/conformance/src/private-admission-727-728-gate.mjs` -
  passed.
- Audit follow-up rerun:
  `node --check tests/conformance/test/private-admission-727-728-gate.test.mjs`
  - passed.
- Audit follow-up rerun:
  `node --test tests/conformance/test/private-admission-727-728-gate.test.mjs`
  - passed, 15 tests.
- Audit follow-up rerun:
  `npm --workspace @fast-react/conformance test -- src/react-test-renderer-serialization-local-gate.test.mjs test/react-test-renderer-create-routing-gate.test.mjs test/private-admission-727-728-gate.test.mjs`
  - passed, 843 tests. NPM emitted the existing `minimum-release-age` warning.
- Audit follow-up rerun: `git diff --check` - passed.
- Audit follow-up rerun: `git status --short` - shows only the three scoped
  added files.
- Audit follow-up rerun:
  `rg -n "^(<<<<<<<|=======|>>>>>>>)" tests/conformance/src/private-admission-727-728-gate.mjs tests/conformance/test/private-admission-727-728-gate.test.mjs worker-progress/worker-729-package-private-admission-audit-727-728.md`
  - passed with no conflict markers.

## Public Blockers

- Public test-renderer compatibility and public serialization stay blocked,
  including public `toJSON` and `toTree`.
- Public `.root`, `update`, and `TestInstance` behavior stays blocked.
- Native addon loading/execution and native bridge loading/execution stay
  blocked.
- `act`, root routing, update native serialization, unmount native
  serialization, full unmount identity admission, multichild/multichild-sibling
  serialization, and multichild/multichild-sibling identity admission stay
  blocked.
- React DOM/root surfaces, Scheduler, hydration, events, refs, resources,
  forms, and controlled inputs stay blocked.
- The ledger keeps every public compatibility claim false and rejects any
  promotion leak.

## Risks Or Blockers

- No blockers remain for this ledger-only task.
- This is static/read-only conformance evidence. It verifies report/source
  tokens, manifest shape, dependency metadata, blocker context, skip/meta
  classification, and fail-closed public blockers; it does not execute the
  underlying private runtime paths.
- Worker 728 is not a full unmount finished-work identity admission. It is only
  a private argument guard around existing unmount native diagnostic evidence.

## Recommended Next Tasks

- Keep full unmount identity admission blocked until a dedicated unmount
  identity proof is scoped and accepted.
- Keep public test-renderer serialization, root, update, TestInstance, native
  bridge/addon, and act compatibility blocked until separate public parity
  evidence exists.
