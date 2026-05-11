# Worker 882 - Native JS Generation Admission Ledger

## Status

Completed.

## Summary

- Added a hidden, frozen JS/native package admission ledger for accepted Worker
  873 native JSON batch lifecycle generation/replay no-stale evidence.
- The ledger is non-enumerable on `nativeRootBridgeRequestShape`, so no package
  export or top-level runtime key was added.
- The ledger recognizes only source-owned Rust identifiers and roles from
  Worker 873 as blocked private evidence. It keeps native addon loading,
  native execution, package exports, worker threads, N-API cleanup hooks,
  renderer/reconciler output, public native compatibility, and compatibility
  aliases fail-closed.
- Added no-load/package-surface coverage that validates the source identifiers
  still exist in `crates/fast-react-napi/src/lib.rs`, rejects stale/caller/prose
  evidence shapes, and confirms root and package-json native package imports do
  not attempt native artifact loads.

## Changed Files

- `bindings/node/index.cjs`
  - Added the hidden generation admission ledger and validator.
  - Pinned Worker 873 evidence IDs, roles, source identifiers, rejection codes,
    and inert execution flags.
- `bindings/node/test/native-no-load-guard.test.cjs`
  - Added no-load assertions for the ledger, package.json require/import, source
    identifier drift, negative evidence rows, and ESM/CJS validator identity.
- `tests/smoke/package-surface-guard.mjs`
  - Added package-surface assertions that the ledger remains non-enumerable and
    private while its rows remain inert.
- `worker-progress/worker-882-native-js-generation-admission-ledger.md`
  - Worker handoff report.

## Commands Run

- `node --check bindings/node/index.cjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node --check tests/smoke/package-surface-guard.mjs`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `node bindings/node/test/native-loader.test.cjs`
- `node bindings/node/test/native-loader-esm.test.mjs`
- `npm --prefix bindings/node test`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- Worker 873 Rust source owns the canonical identifiers:
  `NativeRootBridgeJsonBatchLifecycleExecutorSourceGuard`,
  executor generation allocation, source-row validation, consumed-generation
  replay guard, source-owned executor rows, and public-native claim blockers.
- The new ledger accepts the canonical six Worker 873 source-owned evidence rows
  only as blocked private evidence.
- The validator rejects stale source identifiers, role drift, caller-shaped
  rows, prose/test-title/error-message rows, source-syntax-only rows, public
  native/package export claims, native addon load claims, worker-thread claims,
  cleanup-hook execution claims, renderer/reconciler output claims, compatibility
  aliases, duplicate rows, and missing rows.
- Native no-load guards still report no forbidden native artifacts, platform
  packages, worker threads, child processes, or network modules were loaded.
- Package exports remain unchanged: root import/require and package.json are the
  only native package public subpaths.

## Risks Or Blockers

- This is a static JS package ledger. It does not execute the Rust generation
  guard or prove public native addon compatibility.
- The ledger intentionally exposes a non-enumerable diagnostic property on an
  already public diagnostic object. It is private from package export and
  enumerable runtime surface checks, but reachable by direct object property
  access for tests.

## Recommended Next Tasks

- Keep the ledger in sync if Worker 873 Rust identifiers are renamed.
- When real public native loading is unblocked, carry the same generation and
  replay-consumption rule into the environment-owned native bridge rather than
  accepting caller-built lifecycle rows.
