# Worker 815: Native Worker-Thread Cleanup Stale Matrix

Goal status: active before final `update_goal`
Started: 2026-05-11

## Summary

Hardened stale-evidence coverage without admitting native execution. The Rust
private cleanup-hook preflight now has focused negative tests for stale
canonical-looking evidence with the wrong worker/environment, root/value handle
kind mismatches, tampered source/boundary error codes, stale create-value
evidence after teardown, and valid-looking root/value cleanup-hook order
identity swaps.

Extended the JS native no-load guard with a dynamic CommonJS explicit `.node`
load fixture and fail-closed checks that native/reconciler/package
compatibility claims are rejected before request validation.

No production loader, package export, native addon loading, renderer,
reconciler, worker-thread, or public native compatibility behavior was added.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added private test helper coverage for cleanup-hook evidence rejection
    rows.
  - Added stale source mismatch cases for wrong worker id, wrong environment,
    wrong root/value handle kind, wrong source error code, and wrong boundary
    code.
  - Added stale cleanup-hook value and root/value order identity swap cases.
- `bindings/node/test/native-no-load-guard.test.cjs`
  - Added an explicit dynamic CommonJS `.node` fixture caught by `Module._load`.
  - Added no-load guard assertions that native execution, reconciler execution,
    and package compatibility claims fail before native request validation.
- `worker-progress/worker-815-native-worker-thread-cleanup-stale-matrix.md`
  - Recorded implementation, verification, evidence, risks, and handoff.

## Commands Run

- `get_goal`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `rg --files worker-progress`
- `sed -n ... worker-progress/worker-764-native-worker-thread-teardown-executable-preflight.md`
- `sed -n ... worker-progress/worker-774-native-teardown-preflight-mirror.md`
- `sed -n ... worker-progress/worker-784-native-cleanup-hook-js-mirror.md`
- `sed -n ... worker-progress/worker-790-native-cleanup-hook-identity-tamper-gate.md`
- `sed -n ... worker-progress/worker-801-native-no-load-transitive-matrix.md`
- `sed -n ... crates/fast-react-napi/src/lib.rs`
- `sed -n ... bindings/node/test/native-no-load-guard.test.cjs`
- `sed -n ... bindings/node/index.cjs`
- `rg -n ...`
- `cargo fmt --all --check` (failed before formatting new Rust tests)
- `cargo fmt --all`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features cleanup_hook_preflight`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `cargo test -p fast-react-napi`
- `npm run check --workspace @fast-react/native`
- `git diff --check`
- `git diff --stat`
- `git status --short --branch`

## Evidence Gathered

- Worker 764 and current Rust preflight code prove worker teardown invalidates
  worker root/value handles while preserving peer handles and all
  no-execution/no-compatibility flags.
- Worker 790 and current validator code prove accepted cleanup-hook evidence is
  limited to canonical root/value teardown preflight rows and exact private
  identity tokens.
- New focused Rust tests prove rejected cleanup-hook evidence remains inert for:
  wrong source worker id, wrong source environment, root/value source kind
  swaps, source error/boundary error tampering, stale create-value evidence
  after teardown, and root/value cleanup-hook order identity swaps.
- New JS no-load fixture proves an explicit dynamic CommonJS `.node` path is
  caught before native addon execution. Existing plus new no-load fixtures cover
  transitive CJS/ESM `worker_threads` and `node:worker_threads`, ESM dynamic
  `.node`, CJS extension `.node`, and explicit CJS `.node`.
- Native no-load guard assertions still prove native addon loading, native
  execution, renderer/reconciler execution, public native compatibility, and
  package compatibility claims remain false or fail closed.

## Verification

Passed:

- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features cleanup_hook_preflight`: 6
  focused tests passed.
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `cargo test -p fast-react-napi`: 57 unit tests and 0 doctests passed.
- `npm run check --workspace @fast-react/native`
- `git diff --check`

`npm` printed the existing `minimum-release-age` warning; it did not affect the
result.

## Risks Or Blockers

- This remains Rust private record and JS placeholder guard coverage. It does
  not execute real `worker_threads`, N-API cleanup hooks, `.node` addons, raw JS
  value roots, renderer/reconciler work, commits, host output, or public native
  compatibility.
- Overlap risk: `crates/fast-react-napi/src/lib.rs` is shared by active native
  workers. This change is test-only inside the cleanup-hook preflight area and
  does not revert or alter production logic.
- The JS no-load guard change is also test-only and does not alter package
  exports, platform package resolution, or loader implementation.

## Recommended Next Tasks

- Keep these stale-evidence and no-load tests when real native artifacts are
  introduced; they should become fail-closed regression coverage around actual
  addon-backed cleanup execution.
- Add real worker-thread and N-API cleanup-hook execution tests only after the
  native addon boundary exists and can prove root/value invalidation, cleanup
  order, and peer isolation under actual Node environment teardown.
