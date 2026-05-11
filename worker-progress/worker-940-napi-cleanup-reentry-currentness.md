# Worker 940 - NAPI Cleanup Reentry Currentness

## Summary

Extended the private Rust cleanup-generation currentness canary with a
test-only re-entry/retirement guard. The guard consumes one source-owned
current cleanup handoff key and rejects duplicate cleanup evidence,
post-retirement re-entry, missing source identity, stale generation,
cross-environment/thread handoff, caller-built rows, and public native/package
claims.

This remains private evidence only. It does not load native addons, execute
Node worker threads, run `napi_add_env_cleanup_hook`, invoke renderer or
reconciler output, change package exports, or claim public native
compatibility.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added currentness duplicate/re-entry error codes and source evidence IDs.
  - Added `NativeRootBridgeCleanupGenerationCurrentnessReentryGuardKey` and a
    private consumed-key set for currentness re-entry protection.
  - Mirrored lifecycle phase, active state, re-entry guard status, and monotonic
    source currentness into the test-only canary rows.
  - Added/extended tests for current acceptance, duplicate cleanup, stale
    generation, cross-environment/thread evidence, post-retirement re-entry,
    caller-built rows, missing source identity, and public native/package
    claims.
- `tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs`
  - Added Worker 940 as source-token-only private admission evidence.
  - Ledger evidence points to Rust source constants, guard validation code, and
    source tests only; no progress/prose-only evidence is accepted.
- `tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs`
  - Added Worker 940 accepted-row assertions and drift/public-claim negatives.
- `worker-progress/worker-940-napi-cleanup-reentry-currentness.md`
  - Handoff report.

## Cleanup Currentness Path

`native_root_bridge_cleanup_generation_currentness_canary_for_private_sources`
calls `validate_native_root_bridge_cleanup_generation_currentness_rows`, which
validates canonical cleanup-hook identity and source rows, builds
`NativeRootBridgeCleanupGenerationCurrentnessCanaryRow` records, derives a
`NativeRootBridgeCleanupGenerationCurrentnessReentryGuardKey`, then consumes it
through `consume_native_root_bridge_cleanup_generation_currentness_reentry_guard`.

The guard key binds:

- current and cleanup executor generation;
- source environment, root handle, root id, and value handle;
- cleanup-hook source worker-thread id and worker environment id;
- lifecycle transition and active root state before/after;
- handle-table current generation and cleanup current generation for root/value.

## Commands Run

- `cargo test -p fast-react-napi --all-features native_root_bridge_cleanup_generation_currentness` - passed, 8 tests.
- `node --check tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs` - passed.
- `node --check tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs` - passed.
- `node --test tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs` - passed, 11 tests.
- `cargo fmt --all` - passed.
- `cargo test -p fast-react-napi --all-features cleanup` - passed, 21 tests.
- `cargo test -p fast-react-napi --all-features currentness` - passed, 8 tests.
- `cargo check -p fast-react-napi --all-features` - passed.
- `cargo fmt --all --check` - passed.
- `npm run check:package-surface` - passed; npm emitted the existing `minimum-release-age` config warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Evidence Gathered

- Positive canary accepts one current cleanup generation with active
  `active->active` lifecycle state, worker/environment id `764`, source
  environment `764`, and root/value cleanup generation `2` from handle-table
  generation `1`.
- Duplicate invocation of the same currentness rows now rejects with
  `FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_DUPLICATE_CLEANUP`.
- Retired lifecycle evidence now rejects with
  `FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_REENTRY_AFTER_RETIRE`.
- Missing source identity uses worker thread `0` as the local absent identity
  representation and rejects before cross-thread reuse.
- Public package claims are rejected through the cleanup-hook preflight public
  claim path.

## Risks Or Blockers

- No blockers.
- This is still Rust `#[cfg(test)]` private currentness evidence. It does not
  prove real N-API cleanup hook execution or native worker-thread teardown.
- `crates/fast-react-napi/src/lib.rs` remains a high-overlap native lifecycle
  file; reconcile carefully with adjacent cleanup/currentness workers.

## Recommended Next Tasks

- When real N-API cleanup hooks land, replace diagnostic identity tokens with
  addon-owned function/argument/environment evidence while preserving the
  re-entry/retirement guard semantics.
- Keep package no-load and package-surface checks in the merge queue because
  this change intentionally leaves native loading and public package exports
  untouched.
