# Worker 833 Native Cleanup Hook Callable Preflight

## Status

- Added a Rust cleanup-hook preflight entry point that recomputes a preflight from supplied cleanup rows/evidence instead of only returning static manifest rows.
- Added a private, non-enumerable Node callable on `workerThreadCleanupHookPreflight` named `validateCleanupHookEvidenceRows`.
- Kept top-level CJS/ESM exports unchanged and preserved no-load behavior.

## Evidence

- The callable path accepts the canonical cleanup rows and mirrors the static cleanup preflight.
- The callable path rejects stale source rows, forged executable rows, wrong cleanup order, identity tampering, and public/native/package compatibility claims.
- All rejection rows continue to report no worker-thread execution, no N-API cleanup hook execution, no native addon loading, no renderer/reconciler execution, and no public native compatibility.

## Verification Run

- `cargo fmt -p fast-react-napi`
- `node --check bindings/node/index.cjs && node --check bindings/node/index.mjs && node --check bindings/node/test/native-no-load-guard.test.cjs`
- `cargo test -p fast-react-napi --all-features cleanup_hook_preflight`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:package-surface`
- `node bindings/node/test/native-loader.test.cjs`
- `node bindings/node/test/native-loader-esm.test.mjs`
- `git diff --check`
- `git diff --cached --check`

## Notes

- `bindings/node/index.mjs` did not need a source edit because the callable is intentionally private and reachable through the existing `nativeRootBridgeRequestShape` named export/default object.
- No blockers.
