# Worker 873 - Native Lifecycle No-Stale Execution

## Status

Completed.

## Summary

- Added a private source-owned generation guard to the Rust
  `NativeRootBridgeJsonBatchLifecycleExecutor` and every accepted executor row.
- Bound row acceptance to the executor generation plus handle-table state,
  including source environment, root handle, root id, current root generation,
  value handle, and value current generation.
- Added a private lifecycle consumer replay guard so a parsed executor
  generation can be consumed once; stale replay of the same accepted rows is
  rejected before consumer rows are recorded.
- Rejected reused JSON value handles inside the executor before handoff
  admission can validate them as active handles.
- Kept native addon loading, worker threads, cleanup hook execution,
  renderer/reconciler execution, public native compatibility, and package
  exports closed.

## Evidence

- Positive create/render/unmount JSON still flows through the private executor
  and then into the lifecycle consumer.
- Negative coverage now includes stale root JSON, stale value JSON, reused value
  handles, foreign root/value handles, stale executor-generation row replay,
  stale guard identity, stale root generation rows, foreign/root identity rows,
  caller-built rows, public native execution claims, and replaying the same
  lifecycle executor into the consumer twice.
- Lifecycle consumer rows are only built after the executor source rows validate
  and the executor generation is marked consumed.

## Verification

- `cargo test -p fast-react-napi --all-features native_root_bridge_batch_lifecycle`
- `cargo test -p fast-react-napi --all-features cleanup_hook`
- `cargo test -p fast-react-napi --all-features`
- `cargo check -p fast-react-napi --all-features`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `cargo fmt --all --check`
- `git diff --check`

## Risks Or Blockers

- The replay guard is process-local Rust state, matching the current private
  no-load executor model. A future real N-API bridge should carry the same
  generation/consumption rule on the native environment-owned executor.
- Native loader/no-load files were not touched.

## Recommended Next Tasks

- When public native loading is explicitly unblocked, keep this private
  executor generation as the source of truth rather than accepting caller-built
  lifecycle rows from JS.
