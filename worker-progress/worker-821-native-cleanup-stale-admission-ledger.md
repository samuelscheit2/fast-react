# Worker 821: Native Cleanup Stale Admission Ledger

Goal status: active before final `update_goal`
Started: 2026-05-11

## Summary

Added a static/read-only private admission ledger for accepted Worker 815 native
cleanup stale matrix evidence. The ledger checks source text only and recognizes
durable IDs, statuses, function names, field names, and source-owned constants
from the native cleanup-hook stale evidence matrix.

No native package import, `.node` loading, Rust execution, worker-thread
execution, N-API cleanup-hook execution, renderer/reconciler execution, package
export change, public compatibility admission, JS/CJS bridge admission, broad
root admission, act admission, or Scheduler admission was added.

## Changed Files

- `tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs`
  - Added the Worker 815 private admission ledger and evaluator.
  - Pins the prior 807 native no-load ledger context.
  - Checks cleanup stale evidence IDs, cleanup blocker IDs, statuses, function
    names, field names, and source constants.
  - Fails closed for native/public execution, stale cleanup acceptance, package
    compatibility/export, JS/CJS bridge, root/act/Scheduler, and static ledger
    drift claims.
- `tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs`
  - Added accepted-path assertions and focused negative cases for missing stale
    evidence, missing cleanup blockers, public compatibility claims, and static
    ledger drift.
- `worker-progress/worker-821-native-cleanup-stale-admission-ledger.md`
  - Recorded implementation, verification, evidence, risks, and handoff.

## Commands Run

- `get_goal`
- `pwd`
- `git status --short --branch`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `rg --files worker-progress tests/conformance bindings/node crates packages`
- `rg -n "ledger|private-admission|native.*cleanup|stale|no-load|admission|conformance" tests/conformance bindings/node crates packages worker-progress`
- `sed -n '1,240p' worker-progress/worker-815-native-worker-thread-cleanup-stale-matrix.md`
- `sed -n ... tests/conformance/src/private-admission-807-native-no-load-ledger.mjs`
- `sed -n ... tests/conformance/test/private-admission-807-native-no-load-ledger.test.mjs`
- `sed -n ... bindings/node/test/native-no-load-guard.test.cjs`
- `sed -n ... bindings/node/index.cjs`
- `sed -n ... crates/fast-react-napi/src/lib.rs`
- `rg -n "worker-815|815-native|native-cleanup-stale|cleanup.*stale.*matrix|stale.*cleanup.*matrix" .`
- `rg -n "cleanup_hook|CleanupHook|NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP|workerThreadCleanupHookPreflight|stale|forged|tamper|source.*mismatch|boundary|root.*value|publicNativeCompatibility|nativeAddonLoaded|rendererExecution|packageCompatibility|assertBlockedNativeRootBridge" crates/fast-react-napi/src/lib.rs bindings/node/index.cjs bindings/node/test/native-no-load-guard.test.cjs`
- `node --check tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs`
- `node --check tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `cargo test -p fast-react-napi --all-features cleanup_hook_preflight`
- `git diff --check`
- `git add tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs worker-progress/worker-821-native-cleanup-stale-admission-ledger.md`
- `git diff --cached --check`
- `git diff --cached --stat`
- `git status --short`

## Evidence Gathered

- Worker 815 records accepted private cleanup stale matrix evidence while
  explicitly keeping native execution, public compatibility, package exports,
  worker threads, N-API cleanup-hook execution, renderer, and reconciler claims
  blocked.
- `crates/fast-react-napi/src/lib.rs` contains the source-owned cleanup-hook
  constants and focused private cleanup-hook preflight tests for stale source
  mismatches, stale value evidence, order identity swaps, and identity tamper
  rejection.
- `bindings/node/index.cjs` exposes the placeholder cleanup-hook preflight
  mirror and rejects direct, wrapper, and nested handoff claim flags through the
  request-shape guard.
- `bindings/node/test/native-no-load-guard.test.cjs` proves the placeholder
  no-load guard still blocks native addon loading and rejects native/public
  compatibility claims without native execution.
- Prior 807 native no-load private admission context remains recognized by the
  new 821 ledger.

## Verification

Passed:

- `node --check tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs`
- `node --check tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `cargo test -p fast-react-napi --all-features cleanup_hook_preflight`
- `git diff --check`
- `git diff --cached --check`

## Risks Or Blockers

- The new ledger is static source-token and manifest evidence only. It does not
  prove real native addon-backed cleanup execution.
- The ledger imports and evaluates the existing 807 conformance ledger, so a
  future intentional 807 context change will require updating the 821 prior
  context expectation.
- No blockers remain for this worker.

## Recommended Next Tasks

- Keep the static cleanup stale matrix ledger until real N-API cleanup-hook
  execution exists, then add separate runtime coverage around actual addon
  teardown behavior.
- If the native package export surface changes, update the native no-load and
  private admission ledgers together so public compatibility remains explicit.
