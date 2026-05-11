# Worker 788 - Native Worker Threads No-Load Guard

## Scope

- Owns `bindings/node/test/native-no-load-guard.test.cjs`.
- Owns this progress report.
- No native fixture, package export, renderer, reconciler, worker creation, or public native compatibility changes.

## Progress

- Read `WORKER_BRIEF.md`.
- Confirmed the native placeholder records accepted worker-thread teardown and cleanup-hook preflight evidence with `nodeWorkerThreadsExecution: false`.
- Hardened the no-load guard so placeholder imports and `loadNativeBinding()` fail if they try to load either `worker_threads` or `node:worker_threads`.
- Follow-up audit found the CJS-only guard did not observe ESM imports. Added a
  `Module.registerHooks()` resolve guard so placeholder ESM static and dynamic
  imports are checked for the same forbidden specifiers.

## Verification

- `node --check bindings/node/test/native-no-load-guard.test.cjs` - passed.
- `node bindings/node/test/native-no-load-guard.test.cjs` - passed.
- `npm run check:package-surface` - passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `npm run check --workspace @fast-react/native` - passed.
- `git diff --check` - passed.
- Follow-up `node --check bindings/node/test/native-no-load-guard.test.cjs` -
  passed.
- Follow-up `node bindings/node/test/native-no-load-guard.test.cjs` - passed.
- Follow-up `npm run check --workspace @fast-react/native` - passed.
- Follow-up `npm run check:package-surface` - passed.
- Follow-up `node tests/smoke/import-entrypoints.mjs` - passed.
- Follow-up `git diff --check` - passed.

## Evidence

- Focused no-load guard printed `Fast React native no-load guard checks passed.`
- Native workspace check printed all three native placeholder checks passed:
  CJS loader, no-load guard, and ESM loader.
- Package surface guard printed `package surface snapshot guard passed`.
- Import smoke printed that Fast React entrypoints match the accepted inventory
  and smoke checks.
- Local Node hook probes confirmed `Module.registerHooks().resolve` catches
  dynamic and static ESM imports of `node:worker_threads`.
- Follow-up focused no-load guard printed
  `Fast React native no-load guard checks passed.`

## Overlap Risks

- Low. This change is isolated to the assigned no-load guard test and worker progress report.

## Blockers

- None.
