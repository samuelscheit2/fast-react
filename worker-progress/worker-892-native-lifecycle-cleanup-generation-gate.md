# Worker 892 - Native Lifecycle Cleanup Generation Gate

## Summary

Added a private Rust-only cleanup-generation consumer in `fast-react-napi` that
binds accepted cleanup-hook preflight rows to source-owned JSON batch lifecycle
executor rows before consuming a cleanup-generation key once.

The consumer remains diagnostic-only: it does not load the native addon, execute
Node worker-thread teardown, invoke N-API cleanup hooks, call renderer or
reconciler paths, or open package exports.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
- `worker-progress/worker-892-native-lifecycle-cleanup-generation-gate.md`

## Evidence

- Validates executor generation/source guards through the existing source-owned
  JSON batch lifecycle executor row validator.
- Requires cleanup-hook canonical preflight acceptance and matches cleanup
  evidence to the same environment, root handle, root id, render value handle,
  source handle generation, and post-teardown current generation.
- Consumes cleanup generation evidence with a private key containing executor
  generation, root/value handles, and current cleanup generations.
- Rejects replayed cleanup evidence, stale/foreign executor rows, caller-built
  rows, cloned rows, public native execution claims, public cleanup package
  claims, foreign cleanup environments, stale root/value handles, and reused
  value handles.

## Commands Run

- `cargo test -p fast-react-napi --all-features native_root_bridge_batch_lifecycle_cleanup_hook_generation_consumer -- --nocapture` - passed
- `cargo test -p fast-react-napi --all-features native_root_bridge_batch_lifecycle` - passed
- `cargo test -p fast-react-napi --all-features cleanup_hook` - passed
- `cargo test -p fast-react-napi --all-features` - passed
- `cargo check -p fast-react-napi --all-features` - passed
- `cargo fmt --all --check` - passed
- `npm run check:package-surface` - passed
- `node tests/smoke/import-entrypoints.mjs` - passed
- `git diff --check` - passed

## Risks Or Blockers

- The implementation is intentionally private and Rust-only; it does not prove
  runtime N-API cleanup hook execution.
- Other active native workers may touch `crates/fast-react-napi/src/lib.rs`
  around lifecycle/no-load diagnostics, so merge conflict risk is possible.

## Recommended Next Tasks

- Reconcile with other native lifecycle workers before merge.
- Keep package/no-load JS smoke tests in the merge queue because this work
  deliberately avoids public native loader changes.
