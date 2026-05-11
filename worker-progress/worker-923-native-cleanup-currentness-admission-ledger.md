# Worker 923 - Native Cleanup Currentness Admission Ledger

## Summary

Added accepted Worker 908 cleanup-generation currentness evidence to the
private-admission 821 native cleanup stale ledger. The ledger now tracks the
Rust test-only canary source identity, current render/cleanup generation match,
root/value cleanup handoff rows, and stale/replay/forged/caller-built/public
claim rejection paths while keeping native execution and package compatibility
blocked.

The change is conformance-ledger-only. It does not change runtime package
exports, native loading, JS native shims, or Rust runtime behavior.

## Changed Files

- `tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs`
  - Added Worker 908 to the accepted queue.
  - Added required currentness evidence ids, cleanup blocker ids, statuses,
    function names, field names, source constants, prior ledger context, and
    source-token evidence rows.
  - Refreshed Worker 815's native no-load guard slice to the current cleanup
    mirror assertion region.
- `tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs`
  - Added Worker 908 manifest and accepted-row assertions.
  - Added rejection coverage for missing currentness source identity,
    test-title/prose-only evidence, and stale/replay shape-only cleanup rows.
  - Expanded public blocker assertions to cover Worker 908 native, cleanup,
    package, and public compatibility claims.
- `tests/conformance/src/private-admission-807-native-no-load-ledger.mjs`
  - Tiny adjacent refresh: updated Worker 790's JS cleanup-hook mirror slice
    after the current native index moved the mirror behind factory helpers.
    This was required because private-admission 821 evaluates 807 as prior
    ledger context and the requested 807 check was failing before the refresh.
- `worker-progress/worker-923-native-cleanup-currentness-admission-ledger.md`
  - Handoff report.

## Evidence Path

- Ledger source:
  `tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs`
- Currentness row:
  `worker-908-napi-cleanup-generation-currentness`
- Currentness source evidence:
  `crates/fast-react-napi/src/lib.rs`
- Accepted Worker 908 handoff:
  `worker-progress/worker-908-napi-cleanup-generation-currentness.md`

## Commands Run

- `node --check tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs` - passed.
- `node --check tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs` - passed.
- `node --check tests/conformance/src/private-admission-807-native-no-load-ledger.mjs` - passed.
- `node --test tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs` - passed, 10 tests.
- `node --test tests/conformance/test/private-admission-807-native-no-load-ledger.test.mjs` - passed, 5 tests.
- `cargo test -p fast-react-napi --all-features native_root_bridge_cleanup_generation_currentness` - passed, 6 tests.
- `git diff --check` - passed.

## Blockers Preserved

- Native addon loading remains blocked.
- `napi_add_env_cleanup_hook` execution remains blocked.
- Node worker-thread teardown execution remains blocked.
- Renderer and reconciler execution remain blocked.
- Package exports and public native compatibility remain blocked.
- Prose/test-title-only evidence and stale/shape-only cleanup rows are rejected
  by the 821 conformance tests.

## Risks Or Blockers

- Worker 908 evidence is Rust `#[cfg(test)]` currentness evidence only. It does
  not prove real native addon loading or real N-API cleanup hook execution.
- The adjacent 807 edit is intentionally narrow but outside the original
  primary write scope; it was needed to keep the 821 prior-ledger dependency and
  requested 807 check green on the current native index shape.
- `crates/fast-react-napi/src/lib.rs` remains a high-churn native lifecycle
  area. Future changes to canary helper names or row field names may require a
  ledger token refresh.

## Recommended Next Tasks

- When real N-API cleanup hooks are admitted, replace private test-only
  identity/currentness tokens with addon-owned cleanup hook evidence while
  preserving the generation replay/currentness gate.
- Keep the 807 no-load ledger in the merge queue with 821 because 821 still
  depends on 807 prior context.
