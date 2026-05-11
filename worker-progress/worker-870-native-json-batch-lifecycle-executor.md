# Worker 870 - Native JSON Batch Lifecycle Executor

## Status

Completed.

## Summary

- Added a private Rust `NativeRootBridgeJsonBatchLifecycleExecutor` that
  executes decoded JSON create/render/unmount rows through the in-process
  handle-table lifecycle state machine.
- Parser gates now carry executor-owned transition evidence, and the batch
  lifecycle consumer reads admission records from the executor path.
- Added source-owned row validation for executor rows, including handle
  environment, generation, root identity, value handle identity, lifecycle
  transitions, handle-table generations, and inert execution flags.
- Added focused coverage that accepts canonical source rows and rejects stale
  JSON, foreign handles, stale/foreign row identity, caller-built rows, and
  public native execution claims.

## Verification

- `cargo test -p fast-react-napi --all-features native_root_bridge_batch_lifecycle`
- `cargo test -p fast-react-napi --all-features cleanup_hook`
- `cargo check -p fast-react-napi --all-features`
- `cargo fmt --all --check`
- `node --check bindings/node/index.cjs`
- `node --check bindings/node/index.mjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node bindings/node/test/native-loader.test.cjs`
- `node bindings/node/test/native-loader-esm.test.mjs`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Blockers

- None.
