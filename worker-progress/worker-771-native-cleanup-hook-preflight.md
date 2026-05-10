# Worker 771: Native Cleanup-Hook Preflight

Goal objective: add a private native cleanup-hook/order preflight on the
fast-react N-API side, building on accepted native teardown work without real
addon loading, public API expansion, or package-surface changes.

Started: 2026-05-11

## Summary

Added a Rust-only cleanup-hook order preflight under `fast-react-napi`. The
preflight consumes Worker 764's canonical executable worker-thread teardown
preflight, records two private cleanup-hook identity/order rows, and rejects
stale Worker 524 transport-only evidence plus forged peer-active evidence.

The gate remains inert: Node `worker_threads`, N-API cleanup hook execution,
native addon loading, renderer/reconciler execution, public native
compatibility, and React behavior all remain false.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added `NativeRootBridgeWorkerThreadCleanupHookPreflight`, cleanup-hook
    evidence rows, and a crate-private validator that requires Worker 764's
    canonical executable preflight evidence.
  - Added stale/forged cleanup evidence rejection codes and order mismatch
    validation for reverse cleanup-hook order.
  - Added focused Rust tests for private order/identity, required canonical
    executable evidence, false public/native blockers, and stale/forged
    rejection.
- `worker-progress/worker-771-native-cleanup-hook-preflight.md`
  - Recorded implementation notes, verification, risks, and handoff evidence.

## Commands Run

- `sed -n ... ORCHESTRATOR.md`
- `sed -n ... WORKER_BRIEF.md`
- `rg -n ... crates/fast-react-napi worker-progress`
- `sed -n ... crates/fast-react-napi/src/lib.rs`
- `sed -n ... worker-progress/worker-524-native-transport-worker-thread-teardown.md`
- `sed -n ... worker-progress/worker-740-native-package-worker-thread-teardown-mirror.md`
- `sed -n ... worker-progress/worker-764-native-worker-thread-teardown-executable-preflight.md`
- Official Node-API docs lookup for cleanup-hook reverse order and exact
  function/argument identity requirements:
  https://nodejs.org/api/n-api.html#napi_add_env_cleanup_hook
- `cargo fmt --all`
- `cargo test -p fast-react-napi --all-features cleanup_hook_preflight`
- `cargo test -p fast-react-napi --all-features worker_thread_teardown`
- `cargo test -p fast-react-napi --all-features`
- `npm run check --workspace @fast-react/native`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `cargo fmt --all --check`
- `cargo clippy -p fast-react-napi --all-targets --all-features --no-deps -- -D warnings`
- `git diff --check`

## Evidence Gathered

- Worker 524 established the private Rust worker-thread teardown gate and
  stale worker-handle rows while keeping native execution blocked.
- Worker 740 mirrored only the accepted teardown metadata in the JS placeholder
  loader and kept package/public native compatibility false.
- Worker 764 added the canonical executable Rust preflight for worker-thread
  teardown and explicitly left N-API cleanup hook execution false.
- Node-API docs state cleanup hooks run in reverse registration order and that
  hook removal requires exact function/argument identity. This preflight models
  those facts only as private Rust tokens, not as real function pointers or
  addon behavior.

## Verification

Passed:

- `cargo test -p fast-react-napi --all-features cleanup_hook_preflight`: 3
  focused tests passed.
- `cargo test -p fast-react-napi --all-features worker_thread_teardown`: 2
  focused tests passed.
- `cargo test -p fast-react-napi --all-features`: 54 unit tests and 0
  doctests passed.
- `npm run check --workspace @fast-react/native`: passed CJS loader,
  no-load guard, and ESM loader checks.
- `npm run check:package-surface`: passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `cargo fmt --all --check`: passed.
- `cargo clippy -p fast-react-napi --all-targets --all-features --no-deps -- -D warnings`:
  passed after replacing a push-after-init vector and allowing the diagnostic
  evidence constructor's intentional argument shape.
- `git diff --check`: passed.

`npm` printed the existing `minimum-release-age` warning; it did not affect the
results.

## Risks Or Blockers

- This is private Rust preflight evidence only. It does not execute real
  `napi_add_env_cleanup_hook`, `worker_threads`, JS value rooting, `.node`
  loading, scheduling, renderer/reconciler work, commits, or host output.
- Cleanup hook identities are opaque Rust diagnostic tokens only; no raw native
  function pointer or argument pointer exists yet.
- Public native/root compatibility remains blocked.

## Recommended Next Tasks

- When real N-API dependencies are introduced, replace the Rust-only tokens with
  addon-backed cleanup hook registration/removal evidence while keeping the
  canonical executable evidence requirement.
- Keep the JS package mirror inert until real addon loading and cleanup
  semantics are intentionally admitted with package-surface guards.
