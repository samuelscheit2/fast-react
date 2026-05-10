# Worker 774: Native Teardown Executable Preflight Mirror

Goal status: complete before final `update_goal`
Goal objective: add an inert JS/native-loader mirror for Worker 764's
worker-thread teardown executable preflight without loading real native
artifacts or changing the package surface.

Started: 2026-05-11

## Summary

Added a frozen `workerThreadTeardownExecutablePreflight` object under
`nativeRootBridgeRequestShape` in `@fast-react/native`. The mirror captures the
Worker 764 executable preflight status, model, rust-only execution scope,
worker/peer environment ids, preserved upstream gate statuses, matched and
mismatched teardown summaries, and five canonical rows:

- `worker-render-root-stale-executable-preflight`
- `worker-create-value-stale-executable-preflight`
- `worker-render-value-stale-executable-preflight`
- `peer-root-active-executable-preflight`
- `peer-value-active-executable-preflight`

The mirror stays inert: no native addon loading, Node worker-thread execution,
N-API cleanup-hook execution, renderer execution, reconciler execution, React
behavior, or public native compatibility is claimed. Top-level native runtime
keys, package exports, dependencies, and native artifact loading behavior remain
unchanged.

## Changed Files

- `bindings/node/index.cjs`
  - Added Worker 764 executable preflight constants, row-field metadata, frozen
    rows, teardown summaries, stale-boundary evidence, peer-invariant evidence,
    and no-execution flags under `nativeRootBridgeRequestShape`.
- `bindings/node/test/native-loader.test.cjs`
  - Added exact CJS snapshot/freeze checks, stale-boundary and peer-invariant
    assertions, public compatibility guards, and forged evidence rejection
    checks.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM visibility and inert row coverage for the nested preflight mirror.
- `bindings/node/test/native-no-load-guard.test.cjs`
  - Confirmed the mirror is visible while `.node`, platform-package,
    child-process, and network loads remain blocked.
- `tests/smoke/package-surface-guard.mjs`
  - Extended package-surface diagnostics to verify the mirror while keeping
    top-level native runtime keys unchanged.
- `tests/smoke/import-entrypoints.mjs`
  - Extended the temporary installed-package probe with the same preflight
    assertions.
- `worker-progress/worker-774-native-teardown-preflight-mirror.md`
  - Recorded this handoff.

## Commands Run

- `sed -n ... ORCHESTRATOR.md`
- `sed -n ... WORKER_BRIEF.md`
- `git status --short --branch`
- `rg -n ... bindings tests package.json worker-progress -S`
- `rg --files bindings tests worker-progress`
- `sed -n ... bindings/node/index.cjs`
- `sed -n ... bindings/node/test/native-loader.test.cjs`
- `sed -n ... bindings/node/test/native-no-load-guard.test.cjs`
- `sed -n ... bindings/node/test/native-loader-esm.test.mjs`
- `sed -n ... tests/smoke/package-surface-guard.mjs`
- `sed -n ... tests/smoke/import-entrypoints.mjs`
- `sed -n ... worker-progress/worker-764-native-worker-thread-teardown-executable-preflight.md`
- `sed -n ... worker-progress/worker-740-native-package-worker-thread-teardown-mirror.md`
- `rg -n ... crates/fast-react-napi/src -S`
- `sed -n ... crates/fast-react-napi/src/lib.rs`
- `git show --stat --oneline 8dded3c`
- `git show --stat --oneline a5fb309`
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
- `git add ...`
- `git commit -m "Add native teardown executable preflight mirror"`

## Evidence Gathered

- Worker 764 report and `crates/fast-react-napi/src/lib.rs`: confirmed the
  canonical executable preflight status, model, execution scope, worker id
  `764`, peer environment `1764`, accepted batch count `2`, teardown row count
  `12`, stale root/value boundary rows, peer root/value rows, and all
  no-execution/no-compatibility flags.
- Worker 740 report and current native loader tests: confirmed the accepted
  placement pattern for inert nested native diagnostics under
  `nativeRootBridgeRequestShape` without adding public exports or platform
  package loading.
- Package smoke guards: confirmed top-level native runtime keys stay unchanged
  and private/native diagnostic subpaths remain blocked.

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

`npm` printed the existing `minimum-release-age` warning; it did not affect the
results.

## Risks Or Blockers

- This is still an inert JS/package mirror of Rust preflight evidence. It does
  not execute real Node `worker_threads`, N-API cleanup hooks, raw JS value
  rooting, `.node` addon loading, scheduling, renderer/reconciler work, commits,
  or host output.
- The new nested diagnostic object is publicly readable through the existing
  `nativeRootBridgeRequestShape` export, but no top-level export key or package
  subpath was added.

## Recommended Next Tasks

- Keep public native/root compatibility blocked until real addon loading,
  cleanup-hook ordering, scheduling, commit, renderer output, and worker-thread
  teardown semantics are proven together.
- When real native artifacts are introduced, replace this mirror with
  addon-backed evidence while keeping the no-load and package-surface guards
  failing closed against premature compatibility claims.
