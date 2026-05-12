# Worker 1240: Conformance Private Admission Ledger Refresh

## Summary

- Refreshed private-admission ledger source authority after accepted module
  splits for 727/728, 739/745, and 804.
- Kept the change static/read-only in conformance source and tests. No runtime,
  package surface, JS/CJS, native, or public compatibility source was changed.
- Added fail-closed coverage for stale pre-split source paths/slices:
  Worker 733 `lib.rs` authority for current unmount identity, Worker 745
  pre-split `lib.rs` constants/tests authority, and Worker 785 reconciler
  wrapper-file paths plus stale cleanup ordering.

## Evidence

- 727/728 Worker 733 current unmount identity evidence now points at:
  `crates/fast-react-test-renderer/src/diagnostics/json.rs` for
  `TestRendererPrivateSerializationFinishedWorkIdentityGate`, and
  `crates/fast-react-test-renderer/src/root_impl/serialization_execution.rs`
  for the unmount native consumers and identity validator. The new regression
  patches those roles back to `crates/fast-react-test-renderer/src/lib.rs` and
  requires both source recognition and canonical evidence-contract failures.
- 739/745 Worker 745 constants/tests evidence now points at
  `diagnostics/constants.rs` and `tests/json_serialization.rs`; the stale
  pre-split `lib.rs` override fails closed.
- 804 Worker 785 evidence now points at split
  `complete_work/managed_child.rs`, `root_commit/managed_child.rs`,
  `host_work.rs`, and `host_work/deletions.rs`; stale wrapper paths/slices and
  cleanup ordering fail closed.
- Existing public/native/package/JS/CJS blockers remain in the ledgers and
  package/import smoke checks stayed green.

## Changed Files

- `tests/conformance/src/private-admission-727-728-gate.mjs`
- `tests/conformance/test/private-admission-727-728-gate.test.mjs`
- `tests/conformance/src/private-admission-739-745-gate.mjs`
- `tests/conformance/test/private-admission-739-745-gate.test.mjs`
- `tests/conformance/src/private-admission-804-managed-child-placement-delete-ledger.mjs`
- `tests/conformance/test/private-admission-804-managed-child-placement-delete-ledger.test.mjs`
- `worker-progress/worker-1240-conformance-private-admission-ledger-refresh.md`

## Verification

- `node --test tests/conformance/test/private-admission-727-728-gate.test.mjs`
  passed, 31 tests.
- `node --test tests/conformance/test/private-admission-739-745-gate.test.mjs`
  passed, 8 tests.
- `node --test tests/conformance/test/private-admission-804-managed-child-placement-delete-ledger.test.mjs`
  passed, 8 tests.
- `npm run check:package-surface` passed. npm printed the existing
  `minimum-release-age` config warning.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `git diff --check` passed.

## Risks

- These are static source-token conformance gates. Future source moves in the
  test renderer or reconciler split modules will require another ledger refresh.
- No public compatibility was admitted for React DOM, react-test-renderer,
  native/package surfaces, JS/CJS facades, Scheduler, hydration/events/refs,
  resources, forms, controlled inputs, or public compatibility generally.
