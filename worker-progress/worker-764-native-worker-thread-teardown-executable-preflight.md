# Worker 764: Native Worker-Thread Teardown Executable Preflight

Goal status: active before final `update_goal`
Goal objective: add a private executable/preflight diagnostic for native
worker-thread teardown semantics without enabling public native addon loading,
renderer/reconciler execution, scheduling, root compatibility, or package
compatibility.

Started: 2026-05-11

## Summary

Added a Rust-only private worker-thread teardown executable preflight under
`fast-react-napi`. The preflight replays deterministic JSON transport records
for a synthetic worker environment, tears down that environment, then proves:

- a post-teardown render request is rejected as a stale worker root through the
  native root bridge validation boundary without mutating validator state;
- worker value handles from create/render are stale after teardown;
- peer root and value handles remain active and isolated from worker teardown;
- accepted batched JSON and cross-environment teardown gate statuses remain
  preserved;
- Node `worker_threads`, N-API cleanup hooks, native addon loading,
  renderer/reconciler execution, public native compatibility, and React
  behavior are all still false/unclaimed.

No JS loader/package surface changes were made.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added `NativeRootBridgeWorkerThreadTeardownExecutablePreflight` and
    per-row preflight diagnostics.
  - Added deterministic worker `764` / peer `1764` preflight payload and
    executor.
  - Added unit coverage for stale root/value rejection, peer root/value
    isolation, validator-state preservation, preserved gate statuses, and
    no-execution/no-compatibility flags.
- `worker-progress/worker-764-native-worker-thread-teardown-executable-preflight.md`
  - Recorded implementation notes, evidence, verification, risks, and handoff.

## Commands Run

- `get_goal`
- `sed -n ... WORKER_BRIEF.md`
- `sed -n ... worker-progress/worker-524-native-transport-worker-thread-teardown.md`
- `sed -n ... worker-progress/worker-532-native-package-surface-guard-refresh.md`
- `sed -n ... worker-progress/worker-740-native-package-worker-thread-teardown-mirror.md`
- `sed -n ... bindings/node/index.cjs bindings/node/test/*.cjs bindings/node/test/*.mjs`
- `sed -n ... tests/smoke/package-surface-guard.mjs tests/smoke/import-entrypoints.mjs`
- `sed -n ... crates/fast-react-napi/src/lib.rs crates/fast-react-napi/src/handle_table.rs`
- `rg -n ...`
- `cargo fmt --all`
- `cargo test -p fast-react-napi --all-features worker_thread_teardown`
- `cargo test -p fast-react-napi --all-features`
- `node --check bindings/node/index.cjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node --check tests/smoke/package-surface-guard.mjs`
- `node --check tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace @fast-react/native`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `cargo fmt --all --check`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git diff --check`
- Supporting inspection: `git status --short`, `git diff --stat`,
  `git diff`.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed assigned worktree, write scope, verification,
  and handoff requirements.
- Worker 524 report and current `crates/fast-react-napi/src/lib.rs`: confirmed
  the accepted private Rust worker-thread teardown gate, worker/peer ids,
  stale rows, peer active row, and no-execution flags.
- Worker 532 and Worker 740 reports plus current `bindings/node` tests:
  confirmed the JS loader is only an inert placeholder mirror and must not gain
  public exports, package subpaths, `.node` loading, platform packages, child
  process, or network behavior.
- `MASTER_PLAN.md`: confirmed public native/root compatibility remains blocked
  until real addon loading, cleanup hooks, scheduling, renderer/reconciler
  output, and no-stale-value behavior are proven together.
- Node official docs: `worker.terminate()` stops worker JS and resolves after
  `exit`, and Node-API environment finalization may happen with JS execution
  disallowed; cleanup-hook ordering matters. This is why this worker keeps the
  evidence as a Rust-only preflight instead of pretending to execute real
  Node `worker_threads` or N-API cleanup hooks.
  - https://nodejs.org/api/worker_threads.html#workerterminate
  - https://nodejs.org/api/n-api.html#finalization-on-the-exit-of-the-nodejs-environment

## Verification

Passed:

- `cargo test -p fast-react-napi --all-features worker_thread_teardown`: 2
  focused tests passed.
- `cargo test -p fast-react-napi --all-features`: 51 unit tests and 0 doctests
  passed.
- `node --check bindings/node/index.cjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node --check tests/smoke/package-surface-guard.mjs`
- `node --check tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace @fast-react/native`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `cargo fmt --all --check`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git diff --check`

`npm` printed the existing `minimum-release-age` warning; it did not affect the
results.

## Risks Or Blockers

- This is executable Rust preflight evidence, not real Node worker-thread or
  N-API cleanup-hook execution.
- No raw JS value rooting, `napi_ref`, `.node` addon load path, scheduler,
  renderer/reconciler execution, commit, host output, or package compatibility
  was added.
- The stale value checks are handle-table boundary checks after environment
  teardown; a post-teardown render request rejects at the stale root before a
  value handle can be reached by the sequence validator.

## Recommended Next Tasks

- When real N-API dependencies are introduced, wire cleanup hooks to this
  preflight shape and replace the Rust-only no-worker execution scope with real
  addon-backed evidence.
- Keep the JS placeholder mirror inert until native addon loading and cleanup
  semantics are intentionally admitted with package-surface guards.
- Add a future real worker-thread test only when it can execute a built addon
  and prove cleanup-hook order, JS value rooting invalidation, and peer
  isolation under actual `worker.terminate()` behavior.
