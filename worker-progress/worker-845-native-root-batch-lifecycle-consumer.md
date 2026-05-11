# Worker 845 - Native Root Batch Lifecycle Consumer

## Status

Completed implementation and focused verification for consuming native root bridge
create/render/unmount batch records with handle-table lifecycle rows and
cleanup-hook callable preflight evidence.

## Summary

- Added a native/bindings scoped batch lifecycle consumer under the existing
  `nativeRootBridgeRequestShape.batchLifecycleConsumer` metadata.
- Wired `createNativeRootBridgeRequestShapeGate()` to emit dynamic consumer rows
  from the batched JSON lifecycle gate and Rust handle-table admission smoke.
- Reused the private cleanup-hook preflight callable to bind render rows to the
  canonical value cleanup evidence and unmount rows to canonical root cleanup
  evidence, while create rows mark cleanup evidence as not required.
- Mirrored the consumer model in `fast-react-napi` Rust with inert getters and a
  JSON entry point that consumes parser-gate/admission smoke rows.
- Added CJS, ESM, no-load guard, and Rust unit coverage for the consumer shape,
  row mapping, cleanup evidence status, and false native/N-API/renderer flags.

## Verification

- `node --check bindings/node/index.cjs`
- `node --check bindings/node/index.mjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node bindings/node/test/native-loader.test.cjs`
- `node bindings/node/test/native-loader-esm.test.mjs`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `cargo fmt -p fast-react-napi`
- `cargo test -p fast-react-napi native_root_bridge_batch_lifecycle_consumer --all-features --lib`
- `cargo test -p fast-react-napi native_root_bridge --all-features --lib`
- `cargo test -p fast-react-napi cleanup_hook_preflight --all-features --lib`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence

- Dynamic JS rows are produced as `batch-lifecycle-consumer-0-create`,
  `batch-lifecycle-consumer-1-render`, and
  `batch-lifecycle-consumer-2-unmount`.
- Root handle actions map to `admit-root-handle`,
  `validate-active-root-handle`, and `retire-root-handle`.
- Cleanup evidence statuses map to `not-required`, `accepted`, and `accepted`.
- Render consumes `cleanup-hook-worker-value-after-root-release`; unmount
  consumes `cleanup-hook-worker-root-before-value-release`.
- All consumer and row execution flags remain false for native addon loading,
  native execution, renderer/reconciler execution, worker threads, N-API cleanup
  hooks, public native compatibility, and React behavior errors.

## Risks Or Blockers

- This remains an inert diagnostic/preflight bridge. It does not execute N-API,
  worker threads, renderer work, reconciler work, or native addon loading.
- The consumer is intentionally nested under existing native root bridge shape
  metadata; no new top-level package export was added.
- Public native compatibility and package exports remain blocked.

## Recommended Next Tasks

- Keep later native-root bridge work consuming this metadata through the nested
  request-shape gate until public native compatibility is explicitly unblocked.
- When real N-API lifecycle execution is introduced, add separate tests that
  prove the current no-load and inert preflight path still remains available.
