# Worker 851 - Native Root JSON Batch Lifecycle Link

## Status

Completed the private JS diagnostic link from the accepted native root batch
lifecycle consumer to the existing JSON batch response sequence and JSON stream
batch roundtrip diagnostics.

## Summary

- Added `jsonBatchRoundtripLink` under
  `nativeRootBridgeRequestShape.batchLifecycleConsumer`.
- The dynamic link rows are computed from the actual consumer rows, JSON
  lifecycle rows, JSON response rows, JSON stream metadata/payload rows, cleanup
  evidence statuses, and Rust handle-admission smoke rows.
- Added a non-enumerable private validator function,
  `validateJsonBatchRoundtripLinkRows`, for focused source-owned rejection
  checks without changing public package exports.
- Kept the path inert: native addon loading, native execution,
  renderer/reconciler execution, Node worker threads, N-API cleanup hooks,
  public native compatibility, and React behavior errors remain false.

## Evidence

- Linked row IDs:
  - `batch-lifecycle-consumer-json-roundtrip-link-0-create`
  - `batch-lifecycle-consumer-json-roundtrip-link-1-render`
  - `batch-lifecycle-consumer-json-roundtrip-link-2-unmount`
- Each linked row carries exact consumer, lifecycle, response, stream metadata,
  and stream payload row IDs.
- Linked order fields prove request/response orders `[0, 1, 2]` and stream
  payload batch sequences `[1, 3, 5]`.
- Linked root handle actions remain `admit-root-handle`,
  `validate-active-root-handle`, and `retire-root-handle`.
- Linked cleanup evidence statuses remain `not-required`, `accepted`, and
  `accepted`.
- Negative validator coverage rejects mismatched consumer row IDs, reordered
  rows, wrong kind/action/transition evidence, wrong cleanup status,
  stale/foreign JSON batch or stream rows, and public/native execution claims.

## Verification

- `node --check bindings/node/index.cjs`
- `node --check bindings/node/index.mjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node bindings/node/test/native-loader.test.cjs`
- `node bindings/node/test/native-loader-esm.test.mjs`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks Or Blockers

- Rust mirror code was not changed. This worker kept the link in the existing
  private Node binding diagnostics because no Rust API surface was required to
  prove the JS JSON response/stream roundtrip link.
- Likely merge overlap is limited to `bindings/node/index.cjs` and native loader
  tests if adjacent native-root diagnostic workers edit the same metadata.

## Recommended Next Tasks

- If a later worker promotes this diagnostic into Rust mirror metadata, keep the
  current JS validator as the no-load/private package-surface guard.
