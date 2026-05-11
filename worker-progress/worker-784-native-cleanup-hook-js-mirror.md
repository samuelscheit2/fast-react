# Worker 784: Native Cleanup-Hook JS Mirror

Goal status: complete; `update_goal(status: "complete")` was attempted after
the commit, but the tool reported that no goal exists for this thread.
Goal objective: add an inert JS/native-loader mirror for Worker 771's
cleanup-hook preflight without loading real native artifacts, changing package
exports, or claiming public native compatibility.

Started: 2026-05-11

## Summary

Added a frozen `workerThreadCleanupHookPreflight` object under
`nativeRootBridgeRequestShape` in `@fast-react/native`. The mirror captures
Worker 771's cleanup-hook order preflight metadata, Worker 764 canonical
executable preflight source status, reverse registration/execution order
identity rows, and stale/forged rejection rows.

The mirror stays inert: no `.node` load path, Node worker-thread execution,
N-API cleanup-hook execution, renderer/reconciler execution, React behavior
claim, package export change, or public native compatibility was added.

## Changed Files

- `bindings/node/index.cjs`
  - Added cleanup-hook preflight constants, frozen row-field metadata, four
    canonical rows, and all false native/public execution flags under
    `nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight`.
- `bindings/node/test/native-loader.test.cjs`
  - Added exact CJS snapshot coverage, freeze checks, reverse-order identity
    checks, stale/forged rejection checks, and false execution/compatibility
    guards.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM visibility and row/status/flag assertions for the nested mirror.
- `bindings/node/test/native-no-load-guard.test.cjs`
  - Confirmed the mirror is visible while native artifact/platform package,
    child-process, and network loads remain blocked.
- `tests/smoke/package-surface-guard.mjs`
  - Extended native package diagnostics without changing top-level runtime keys
    or package exports.
- `tests/smoke/import-entrypoints.mjs`
  - Extended installed-package import smoke coverage for the cleanup-hook mirror.
- `worker-progress/worker-784-native-cleanup-hook-js-mirror.md`
  - Recorded implementation and verification evidence.

## Commands Run

- `sed -n ... ORCHESTRATOR.md`
- `sed -n ... WORKER_BRIEF.md`
- `rg -n ... bindings tests package.json worker-progress -S`
- `sed -n ... bindings/node/index.cjs`
- `sed -n ... bindings/node/test/native-loader.test.cjs`
- `sed -n ... bindings/node/test/native-no-load-guard.test.cjs`
- `sed -n ... bindings/node/test/native-loader-esm.test.mjs`
- `sed -n ... tests/smoke/package-surface-guard.mjs`
- `sed -n ... tests/smoke/import-entrypoints.mjs`
- `sed -n ... worker-progress/worker-771-native-cleanup-hook-preflight.md`
- `sed -n ... worker-progress/worker-764-native-worker-thread-teardown-executable-preflight.md`
- `sed -n ... worker-progress/worker-774-native-teardown-preflight-mirror.md`
- `rg -n ... crates/fast-react-napi/src/lib.rs crates/fast-react-napi/src -S`
- `sed -n ... crates/fast-react-napi/src/lib.rs`
- `node --check bindings/node/index.cjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node --check tests/smoke/package-surface-guard.mjs`
- `node --check tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace @fast-react/native`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git diff --cached --check`
- `git commit -m "Add native cleanup hook preflight mirror"`
- `git commit --amend --no-edit`

## Evidence Gathered

- Worker 771 report and `crates/fast-react-napi/src/lib.rs`: confirmed the
  cleanup-hook preflight status, model, execution scope, canonical executable
  evidence requirement, reverse registration/execution order, identity tokens,
  stale Worker 524 evidence rejection, forged peer-active evidence rejection,
  and all no-execution/no-compatibility flags.
- Worker 764 report and current loader mirror: confirmed the canonical
  executable preflight source rows and status that Worker 771 requires.
- Worker 774 report and current native loader tests: confirmed the accepted
  JS mirror placement pattern and package-surface constraints.
- Package smoke guards: confirmed top-level native runtime keys and package
  exports remain unchanged.

## Verification

Passed:

- `node --check bindings/node/index.cjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node --check tests/smoke/package-surface-guard.mjs`
- `node --check tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace @fast-react/native`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git diff --cached --check`

`npm` printed the existing `minimum-release-age` warning; it did not affect
the results.

The final `update_goal(status: "complete")` call failed because this thread has
no goal object.

## Risks Or Blockers

- This is still an inert JS/package mirror of Rust cleanup-hook preflight
  evidence. It does not execute real `napi_add_env_cleanup_hook`,
  `worker_threads`, JS value rooting, `.node` addon loading, scheduling,
  renderer/reconciler work, commits, or host output.
- The nested diagnostic object is publicly readable through the existing
  `nativeRootBridgeRequestShape` export, but no top-level export key or package
  subpath was added.

## Recommended Next Tasks

- Keep public native/root compatibility blocked until real addon loading,
  cleanup-hook ordering, scheduling, commit, renderer output, and worker-thread
  teardown semantics are proven together.
- When real native artifacts are introduced, replace this JS mirror with
  addon-backed evidence while keeping the no-load and package-surface guards
  failing closed against premature compatibility claims.
