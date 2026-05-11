# Worker 938: React Hook CJS/Server Blocker Currentness

## Summary

- Extended the package-private unsupported placeholder hook currentness report
  with source-owned surface rows for `packages/react/index.js`,
  `packages/react/cjs/react.development.js`,
  `packages/react/cjs/react.production.js`, and
  `packages/react/react.react-server.js`.
- Kept the public package surface unchanged: CJS development/production remain
  aliases of the default root export, and the react-server entrypoint only
  exposes the locally supported `useId` and `useDebugValue` placeholders from
  this unsupported hook set.
- Added regressions for root/CJS/react-server row drift, cloned or replayed
  surface rows, forged compatibility flags, prerequisite smuggling, non-boolean
  execution claims, callback/external-store/id claims, and placeholder callback
  side effects.

## Changed Files

- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `worker-progress/worker-938-react-hook-cjs-server-blocker-currentness.md`

## Exact CJS/Server Currentness Path

- Report factory:
  `hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport()`
- Surface capture:
  `createUnsupportedPlaceholderHookSurfaceCurrentnessRows()` in
  `packages/react/hook-dispatcher.js`
- Captured local surfaces:
  `./index.js`, `./cjs/react.development.js`,
  `./cjs/react.production.js`, and `./react.react-server.js`
- Report fields:
  `surfaceCurrentnessFieldNames`, `surfaceCurrentnessRows`,
  `cjsSurfaceCurrentnessBlocked`, and
  `reactServerSurfaceCurrentnessBlocked`
- Consumer:
  `hookDispatcher.consumeUnsupportedPlaceholderHookCurrentnessReport(report)`

## Evidence Gathered

- Read `WORKER_BRIEF.md` and Worker 929's accepted currentness handoff.
- Inspected `packages/react/hook-dispatcher.js`, `packages/react/index.js`,
  both React CJS aliases, `packages/react/react.react-server.js`, and the
  focused hook dispatcher conformance tests.
- Confirmed the local CJS files are physical aliases of `index.js`; the
  react-server file is a separate narrower surface that lacks
  `useActionState`, `useOptimistic`, `useSyncExternalStore`, and
  `useEffectEvent`, while preserving blocked placeholders for `useId` and
  `useDebugValue`.

## Commands Run

```sh
node --check packages/react/hook-dispatcher.js
node --check packages/react/cjs/react.development.js
node --check packages/react/cjs/react.production.js
node --check packages/react/react.react-server.js
node --check tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --check tests/conformance/test/react-transition-facade.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --test tests/conformance/test/react-transition-facade.test.mjs
npm run check --workspace @fast-react/react
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
```

## Verification Results

- Focused hook dispatcher oracle passed: 12 tests.
- Focused hook dispatcher guard passed: 27 tests.
- Transition facade passed: 8 tests.
- React workspace check passed.
- Package surface guard passed with the existing npm `minimum-release-age`
  warning.
- Import entrypoint smoke passed.
- `git diff --check` passed.

## Blockers Preserved

- No dispatcher routing was added for `useActionState`, `useOptimistic`,
  `useSyncExternalStore`, `useEffectEvent`, `useId`, or `useDebugValue`.
- No callback invocation, external store subscription/snapshot read, id
  generation, scheduler/root lane integration, root scheduling, renderer
  compatibility, or public compatibility claim was added.
- Public default-root and CJS hooks remain unsupported placeholders with
  `name === hookName` and `length === 0`; react-server keeps unsupported hooks
  either absent by policy or placeholder-blocked where the local surface exports
  them.

## Risks Or Blockers

- No blockers.
- Overlap risk: package-surface or hook-admission workers must update the new
  surface currentness rows if they intentionally change any of these public
  hook exports or react-server absences.

## Recommended Next Tasks

- Keep these rows fail-closed until a future hook-specific worker admits real
  dispatcher, scheduler/root, renderer, and public behavior evidence.
- If a single hook is admitted before the rest, split that hook out of the
  unsupported placeholder surface rows instead of flipping shared false flags.
