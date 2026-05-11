# Worker 924 - NAPI Worker-Thread Cleanup Currentness

## Summary

Extended the private Rust cleanup-generation currentness canary in
`fast-react-napi` so accepted cleanup handoff rows carry cleanup-hook source
worker-thread and environment identity. The test-only currentness validator now
rejects cleanup handoff reuse when that worker-thread/environment pair no longer
matches the canonical cleanup-hook preflight.

This remains inert private evidence. It does not execute Node worker-thread
teardown, run N-API cleanup hooks, load native addons, change package exports,
invoke renderer or reconciler output, or claim public native compatibility.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added cleanup-hook source worker-thread/environment fields to private
    cleanup-generation handoff rows.
  - Mirrored that identity into the `#[cfg(test)]` currentness canary rows.
  - Added currentness validation for cleanup handoff worker-thread/environment
    identity against the canonical cleanup-hook preflight row.
  - Added negative coverage for cross-worker-thread and cross-worker-environment
    cleanup handoff reuse.
- `worker-progress/worker-924-napi-worker-thread-cleanup-currentness.md`
  - Worker handoff report.

## Currentness And Thread Identity Path

- Cleanup-hook preflight source:
  `NativeRootBridgeWorkerThreadCleanupHookPreflight::worker_thread_id()`,
  `worker_environment_id()`, and accepted root/value
  `NativeRootBridgeWorkerThreadCleanupHookPreflightRow::source_worker_thread_id()`
  / `source_environment_id()`.
- Cleanup-generation handoff source:
  `NativeRootBridgeCleanupGenerationConsumerRow::cleanup_hook_source_worker_thread_id()`
  and `cleanup_hook_source_environment_id()`, copied from the accepted
  cleanup-hook evidence row.
- Test-only canary evidence:
  `NativeRootBridgeCleanupGenerationCurrentnessCanaryRow::cleanup_hook_source_worker_thread_id()`
  and `cleanup_hook_source_environment_id()`.
- Rejection path:
  `validate_native_root_bridge_cleanup_generation_currentness_rows` delegates to
  `native_root_bridge_cleanup_generation_currentness_row_for_handoff`, which
  rejects rows with
  `FAST_REACT_NAPI_CLEANUP_GENERATION_CURRENTNESS_CROSS_WORKER_THREAD_HANDOFF`
  when the handoff row's worker-thread/environment identity differs from the
  canonical cleanup-hook preflight or accepted cleanup-hook row.

## Evidence

- Positive currentness still accepts only the current render handoff for worker
  thread `764`, worker environment `764`, executor generation match, root/value
  handle-table current generation `1`, and cleanup current generation `2`.
- Negative currentness coverage now includes:
  - cross-worker-thread cleanup handoff reuse;
  - cross-worker-environment cleanup handoff reuse;
  - stale generation after a newer accepted native step;
  - replayed cleanup generation and retired lifecycle;
  - cloned/forged cleanup rows;
  - cross-environment and cross-table cleanup evidence;
  - caller-shaped cleanup rows;
  - missing cleanup-hook identity;
  - public native execution claims.

## Commands Run

- `cargo fmt --all` - passed.
- `cargo test -p fast-react-napi --all-features native_root_bridge_cleanup_generation_currentness -- --nocapture` - passed, 7 tests.
- `cargo test -p fast-react-napi --all-features native_root_bridge_cleanup_generation_currentness` - passed, 7 tests.
- `cargo test -p fast-react-napi --all-features cleanup_hook` - passed, 13 tests.
- `cargo test -p fast-react-napi --all-features` - passed, 74 unit tests and 0 doctests.
- `cargo check -p fast-react-napi --all-features` - passed.
- `cargo fmt --all --check` - passed.
- `git diff --check` - passed.

## Risks Or Blockers

- This remains Rust-private/test-only currentness evidence. It does not prove
  real `napi_add_env_cleanup_hook` execution, native addon loading, or Node
  `worker_threads` teardown behavior.
- Cleanup hook function/argument identity still uses private diagnostic tokens,
  not real native function pointers or N-API hook arguments.
- `crates/fast-react-napi/src/lib.rs` is a high-churn native lifecycle file.
  Merge conflicts are possible with other accepted native lifecycle workers.

## Recommended Next Tasks

- When real N-API cleanup-hook registration lands, replace the private
  diagnostic worker/thread tokens with addon-owned hook function, hook argument,
  environment, and worker-thread identity evidence.
- Keep package no-load and package-surface smoke checks in the merge queue,
  because this worker deliberately did not touch JS exports or native loader
  behavior.
