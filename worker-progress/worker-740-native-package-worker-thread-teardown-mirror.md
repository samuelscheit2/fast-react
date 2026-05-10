# Worker 740: Native Package Worker-Thread Teardown Mirror

Goal status: complete
Goal objective: Add an inert JS/package-surface mirror gate for the accepted
Rust native worker-thread teardown diagnostics without opening native addon
loading, native execution, or public compatibility.

Started: 2026-05-10

## Summary

Added a frozen `transportWorkerThreadTeardownGate` under
`nativeRootBridgeRequestShape` in the `@fast-react/native` placeholder loader.
The gate mirrors the accepted Rust status
`diagnosed-native-root-bridge-transport-worker-thread-teardown`, deterministic
worker/peer environment ids, matched/mismatched teardown summaries, and four
diagnostic rows:

- `worker-root-stale-after-thread-teardown`
- `worker-create-value-stale-after-thread-teardown`
- `worker-render-value-stale-after-thread-teardown`
- `peer-root-active-after-worker-thread-teardown`

All new gate and row evidence remains inert:
`nativeAddonLoaded`, `nativeExecution`, `rendererExecution`,
`reconcilerExecution`, and `reactBehaviorError` are false, and
`publicNativeCompatibility` remains false at the gate level. No public export
keys, package exports, native addon loading paths, renderer/reconciler
execution, or React behavior were added.

## Changed Files

- `bindings/node/index.cjs`
  - Added the nested worker-thread teardown mirror gate and row-field metadata.
  - Preserved top-level package exports and `loadNativeBinding()` placeholder
    failure behavior.
- `bindings/node/test/native-loader.test.cjs`
  - Added CJS snapshot/freeze/no-execution coverage for the worker-thread
    teardown mirror.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM visibility and inert row coverage for the same nested gate.
- `bindings/node/test/native-no-load-guard.test.cjs`
  - Asserted the worker-thread mirror is present without native/platform loads.
- `tests/smoke/package-surface-guard.mjs`
  - Added package-surface checks for the worker-thread rows and blocked
    compatibility.
- `tests/smoke/import-entrypoints.mjs`
  - Added temporary package-resolution probe checks for the same diagnostics.
- `worker-progress/worker-740-native-package-worker-thread-teardown-mirror.md`
  - Recorded this handoff.

## Commands Run

- `get_goal`
- `sed -n '<ranges>' WORKER_BRIEF.md worker-progress/worker-524-native-transport-worker-thread-teardown.md worker-progress/worker-532-native-package-surface-guard-refresh.md`
- `sed -n '<ranges>' bindings/node/index.cjs bindings/node/index.mjs bindings/node/test/native-loader.test.cjs bindings/node/test/native-loader-esm.test.mjs bindings/node/test/native-no-load-guard.test.cjs`
- `sed -n '<ranges>' tests/smoke/package-surface-guard.mjs tests/smoke/import-entrypoints.mjs crates/fast-react-napi/src/lib.rs`
- `rg -n '<native worker-thread/package-surface patterns>' ...`
- `node --check bindings/node/index.cjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node --check tests/smoke/package-surface-guard.mjs`
- `node --check tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace @fast-react/native`
- `node tests/smoke/import-entrypoints.mjs`
- `node tests/smoke/package-surface-guard.mjs`
- `npm run check:js`
- `cargo test -p fast-react-napi --all-features worker_thread_teardown`
- `git diff --check`
- Supporting inspection commands: `git status --short`, `git diff --stat`,
  and `wc -l`.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed worker scoping, handoff requirements, and that
  only the assigned worktree should be edited.
- Worker 524 report and `crates/fast-react-napi/src/lib.rs`: confirmed the
  accepted Rust status, worker id `524`, worker environment `524`, peer
  environment `1524`, stale root/create/render value rows, peer-root active
  row, stale boundary code, and no-execution flags.
- Worker 532 report and current native loader tests: confirmed the accepted JS
  placement pattern under `nativeRootBridgeRequestShape` and that the native
  package must remain a placeholder with no platform/native addon load path.
- Current package-surface and import-entrypoint smoke tests: confirmed top-level
  native runtime keys are guarded and private/native diagnostic subpaths remain
  blocked.

## Verification

Passed:

- `node --check bindings/node/index.cjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node --check tests/smoke/package-surface-guard.mjs`
- `node --check tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace @fast-react/native`
- `node tests/smoke/import-entrypoints.mjs`
- `node tests/smoke/package-surface-guard.mjs`
- `npm run check:js`
- `cargo test -p fast-react-napi --all-features worker_thread_teardown`
- `git diff --check`

`npm` printed the existing `minimum-release-age` warning during npm commands;
it did not affect results.

## Risks Or Blockers

- This is an inert JS/package-surface mirror only. It does not prove real
  Node-API cleanup hooks, `worker_threads` execution, JS value rooting, native
  addon loading, renderer execution, reconciler execution, commits, or host
  output.
- The new nested diagnostic object is publicly readable through the existing
  placeholder package metadata, but it does not add top-level exports or package
  subpaths.

## Recommended Next Tasks

- Keep public native/root compatibility blocked until native loading, cleanup
  hooks, scheduling, commit, renderer output, and worker-thread semantics are
  admitted together.
- When real worker-thread teardown support is introduced, replace this mirror
  with executable native evidence and keep the package-surface/no-load guards
  failing closed against premature compatibility claims.
