# Worker 929: React Unsupported Hook Blocker Currentness

## Summary

- Added package-private unsupported placeholder hook blocker metadata for
  `useActionState`, `useOptimistic`, `useSyncExternalStore`,
  `useEffectEvent`, `useId`, and `useDebugValue`.
- Added a source-owned currentness report factory/consumer that keeps public
  compatibility, dispatcher routing, scheduler/root prerequisites, external
  store invocation, callback invocation, and id generation claims false.
- Kept public React exports unchanged: all scoped hooks remain
  `createUnimplementedFunction` placeholders and do not route through an
  installed dispatcher.

## Changed Files

- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `worker-progress/worker-929-react-unsupported-hook-blocker-currentness.md`

## Exact Hook Blocker / Currentness Path

- Metadata: `hookDispatcher.privateUnsupportedPlaceholderHookBlockerMetadata`
- Source/currentness report factory:
  `hookDispatcher.createUnsupportedPlaceholderHookCurrentnessReport()`
- Source/currentness report consumer:
  `hookDispatcher.consumeUnsupportedPlaceholderHookCurrentnessReport(report)`
- Report validation:
  `hookDispatcher.validateUnsupportedPlaceholderHookCurrentnessReport(report)`

## Evidence Gathered

- Read `WORKER_BRIEF.md`.
- Inspected Worker 916's accepted transition hook blocker currentness report.
- Inspected `packages/react/hook-dispatcher.js`, `packages/react/index.js`,
  the focused hook dispatcher oracle/guard tests, and React 19.2.6 source in
  `/Users/user/Developer/Developer/react-reference/packages/react/src/ReactHooks.js`
  plus `packages/react-reconciler/src/ReactFiberHooks.js`.
- Confirmed current local public hook exports are placeholders with function
  names matching their export names and length `0`.

## Commands Run

```sh
node --check packages/react/hook-dispatcher.js
node --check packages/react/index.js
node --check tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-transition-facade.test.mjs
npm run check --workspace @fast-react/react
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
```

## Verification Results

- Focused hook dispatcher oracle passed: 12 tests.
- Focused hook dispatcher guard passed: 27 tests.
- Combined guard plus oracle passed: 39 tests.
- Transition facade passed: 8 tests.
- React workspace smoke passed.
- Package surface guard passed with the existing npm
  `minimum-release-age` config warning.
- Import entrypoint smoke passed.
- `git diff --check` passed.

## Blockers Preserved

- Public scoped hooks remain unsupported placeholders.
- No dispatcher routing was opened for the unsupported placeholder hooks.
- No scheduler/root-lane integration, root scheduling, renderer compatibility,
  public act integration, external store invocation, callback invocation, id
  generation, or public compatibility claim was added.
- Negative currentness canaries reject cloned source reports, forged public
  shape/currentness/source data, flipped compatibility flags, dispatcher/root
  scheduler prerequisite smuggling, callback invocation claims, external-store
  invocation claims, and id generation claims.

## Risks Or Blockers

- No blockers.
- Overlap risk: future workers admitting any of these hooks must replace the
  blocker/currentness report with source-owned execution evidence instead of
  flipping false flags individually.
- This worker intentionally does not consume unaccepted Worker 910 or any
  scheduler/root/renderer work beyond naming missing React 19.2.6 source
  prerequisites in blocker metadata.

## Recommended Next Tasks

- Keep these public hooks blocked until dispatcher implementations, scheduler
  and root-lane semantics, renderer behavior, and public compatibility can be
  admitted end to end.
- When a hook is admitted, split its blocker out of the unsupported placeholder
  report and add hook-specific source-owned execution evidence plus negative
  canaries for the remaining blocked hooks.
