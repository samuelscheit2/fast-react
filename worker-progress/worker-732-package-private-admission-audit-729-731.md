# Worker 732: Package Private Admission Audit 729-731

## Status

- Complete.
- Read `WORKER_BRIEF.md` and worked only in the assigned worker worktree.

## Summary

- Added the static private-admission ledger/audit for Workers 729-731.
- Classified Worker 729 as `skipped-meta` ledger work with no runtime
  capability and no public/package compatibility promotion.
- Recorded Worker 730 as accepted private Rust unmount native cleanup evidence
  with ref cleanup, passive destroy, host cleanup, and cleanup-order proof.
  Native execution, public unmount, and unmount identity admission stay blocked.
- Recorded Worker 731 as accepted private Rust nested `toJSON` update native
  identity evidence. JS/CJS/public admission, sibling snapshot admission,
  unmount identity, and `toTree` promotion stay blocked.
- Scope stayed limited to conformance metadata/tests and this progress report.
  No runtime/product code, package manifests, JS/CJS facades, Rust crates,
  benchmark manifests, `MASTER_*`, or public compatibility surfaces were edited.
- Audit follow-up tightened the aggregate `privateDiagnosticsRecognized` flag
  so row compatibility leaks, public compatibility claim leaks, blocked
  admission-claim leaks, and public promotion leaks fail the summary flag as
  well as producing violations.
- Audit follow-up pinned Worker 730's Rust host cleanup count and explicit
  ref-cleanup -> passive-destroy -> host-cleanup ordering assertions in the
  evidence tokens.

## Changed Files

- `tests/conformance/src/private-admission-729-731-gate.mjs`
- `tests/conformance/test/private-admission-729-731-gate.test.mjs`
- `worker-progress/worker-732-package-private-admission-audit-729-731.md`

## Evidence Gathered

- Inspected prior private-admission ledgers/tests for Workers 724-726 and
  727-728 and reused their fail-closed evaluator shape.
- Inspected Worker 729, 730, and 731 reports, plus dependency/blocker reports
  for Workers 575, 577, 612, 638, 720, 725, 726, and 728.
- Added evidence-token checks against Worker 730's report and Rust test source
  for nonzero `ref_cleanup_return_count`, `passive_destroy_count`,
  `host_node_cleanup_count`, `cleanup_order_record_count`, cleanup ordering,
  and native-execution/public-unmount blockers.
- Added evidence-token checks against Worker 731's report and Rust test source
  for nested `toJSON` update identity validation, missing/stale/lane mismatch
  rejection, multichild row consumption, and public/native compatibility
  blockers.
- The evaluator fails closed for missing or unknown accepted diagnostics,
  stale/meta accepted worker ids, dependency worker/diagnostic drift,
  blocker-context worker/diagnostic drift, blocked public surface drift,
  blocked public claim/key drift, skipped/meta runtime claims, blocked
  admission-claim leaks, row compatibility claims, and public promotion leaks.
- Audit follow-up assertions now prove row compatibility claims, public
  compatibility claims, blocked admission claims, and promotion leaks set
  `privateDiagnosticsRecognized === false`.
- Audit follow-up added stable Rust source tokens for
  `assert_eq!(cleanup_handoff.host_node_cleanup_count(), 2);`,
  `assert!(passive_ref_order.ref_cleanup_return_precedes_passive_destroy());`,
  `assert!(passive_ref_order.host_cleanup_follows_ref_cleanup_return());`, and
  `assert!(passive_ref_order.host_cleanup_follows_passive_destroy());`.
- All public/package compatibility claims remain false. The blocked surfaces
  carry forward test-renderer serialization/root/update/TestInstance/native
  bridge/addon/act, React DOM/root surfaces, Scheduler, hydration, events, refs,
  resources, forms, controlled inputs, broad multichild/sibling identity, and
  full unmount identity blockers.

## Commands Run

- `pwd && git status --short --branch` - passed; confirmed assigned worker
  branch/worktree.
- `sed -n '1,240p' WORKER_BRIEF.md` - read.
- `node --check tests/conformance/src/private-admission-729-731-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 18 tests.
- `npm --workspace @fast-react/conformance exec -- node --test test/private-admission-724-726-gate.test.mjs test/private-admission-727-728-gate.test.mjs test/private-admission-729-731-gate.test.mjs src/react-test-renderer-serialization-local-gate.test.mjs test/react-test-renderer-serialization-oracle.test.mjs`
  - passed, 62 tests. NPM emitted the existing `minimum-release-age` warning.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git add --intent-to-add tests/conformance/src/private-admission-729-731-gate.mjs tests/conformance/test/private-admission-729-731-gate.test.mjs worker-progress/worker-732-package-private-admission-audit-729-731.md`
  - ran so `git diff --check` includes new files.
- `git diff --check` - passed.
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" tests/conformance/src/private-admission-729-731-gate.mjs tests/conformance/test/private-admission-729-731-gate.test.mjs worker-progress/worker-732-package-private-admission-audit-729-731.md`
  - passed with no matches (`rg` exit 1).
- `git status --short` in the worker worktree - shows only the three scoped
  added files.
- `git status --short` in the root checkout - clean after correcting an initial
  patch path mistake.
- Audit follow-up: `node --check tests/conformance/src/private-admission-729-731-gate.mjs`
  - passed.
- Audit follow-up:
  `node --check tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed.
- Audit follow-up:
  `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 18 tests.
- Audit follow-up:
  `npm --workspace @fast-react/conformance exec -- node --test test/private-admission-724-726-gate.test.mjs test/private-admission-727-728-gate.test.mjs test/private-admission-729-731-gate.test.mjs src/react-test-renderer-serialization-local-gate.test.mjs test/react-test-renderer-serialization-oracle.test.mjs`
  - passed, 62 tests. NPM emitted the existing `minimum-release-age` warning.
- Audit follow-up: `npm run check:package-surface` - passed. NPM emitted the
  existing `minimum-release-age` warning.
- Audit follow-up: `node tests/smoke/import-entrypoints.mjs` - passed.
- Audit follow-up: `git diff --check` - passed.
- Audit follow-up:
  `rg -n "^(<<<<<<<|=======|>>>>>>>)" tests/conformance/src/private-admission-729-731-gate.mjs tests/conformance/test/private-admission-729-731-gate.test.mjs worker-progress/worker-732-package-private-admission-audit-729-731.md`
  - passed with no matches (`rg` exit 1).

## Risks Or Blockers

- No blockers remain for this static ledger task.
- This is static conformance evidence only. It verifies worker reports, Rust
  source tokens, manifest shape, dependencies, blocker context, and fail-closed
  public blockers; it does not execute or promote the private runtime paths.
- Worker 730 is not native execution/public unmount/full identity admission.
- Worker 731 is not JS/CJS/public admission, sibling snapshot admission,
  unmount admission, or `toTree` promotion.

## Recommended Next Tasks

- Keep public/package compatibility blocked until separate public parity
  evidence exists.
- Keep full unmount identity admission blocked until a dedicated unmount
  identity proof is scoped and accepted.
- Keep sibling snapshot/native identity and `toTree` promotion separate from
  Worker 731's nested `toJSON` private Rust evidence.
