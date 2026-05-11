# Worker 801 - Native No-Load Transitive Matrix

## Scope

- Owns `bindings/node/test/native-no-load-guard.test.cjs`.
- Owns this progress report.
- No loader source, native fixture package, package export, renderer,
  reconciler, worker-thread execution, native addon loading, or public native
  compatibility changes.

## Progress

- Read `WORKER_BRIEF.md` and Worker 788's no-load guard report.
- Added a temp-fixture matrix to the native no-load guard test for intentional
  forbidden loads:
  - transitive CJS `worker_threads`
  - transitive CJS `node:worker_threads`
  - transitive CJS bare specifier resolving to a `.node` addon file
  - transitive ESM static `worker_threads`
  - dynamic ESM `node:worker_threads`
  - dynamic ESM `.node`
- Kept intentional fixture attempts isolated by consuming their expected
  `forbiddenLoads` records before the real placeholder native import and
  `loadNativeBinding()` assertions.
- Added teardown assertions that `Module._load`, the `.node` extension loader,
  and `Module.registerHooks()` state are restored after the guard runs.

## Verification

Passed:

- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `npm run check --workspace @fast-react/native`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

`npm` printed the existing `minimum-release-age` warning during npm checks; it
did not affect results.

## Evidence Gathered

- The focused no-load guard prints
  `Fast React native no-load guard checks passed.`
- The native workspace check prints all three native placeholder checks passed:
  CJS loader, no-load guard, and ESM loader.
- Package surface guard prints `package surface snapshot guard passed`.
- Import smoke prints that Fast React entrypoints match the accepted inventory
  and smoke checks.
- The fixture matrix proves the active guard catches CJS `_load`, ESM resolve
  hooks, and `.node` extension resolution without allowing worker-thread module
  loading or native addon loading.
- Existing placeholder assertions still prove native diagnostic rows keep
  `nodeWorkerThreadsExecution`, `nativeAddonLoaded`, `nativeExecution`,
  `rendererExecution`, `reconcilerExecution`, `publicNativeCompatibility`, and
  `reactBehaviorError` false where applicable.

## Overlap Risks

- Low but real. Native no-load guard tests overlap with Worker 788 and any
  active native-loader workers. This change is test-only and does not alter
  loader behavior, package exports, or public native compatibility claims.

## Blockers

- None.

## Recommended Next Tasks

- Keep public native execution blocked until real addon loading, worker-thread
  teardown, N-API cleanup hooks, renderer/reconciler work, and package
  compatibility are proven together.
- When native artifacts are introduced, keep this no-load matrix as a
  fail-closed regression guard for placeholder entrypoints.
