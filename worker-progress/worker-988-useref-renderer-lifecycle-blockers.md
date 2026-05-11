# Worker 988: useRef Renderer Lifecycle Blockers

## Summary

- Added a package-private `useRef` renderer/root lifecycle blocker report on
  top of the accepted private dispatcher currentness and private execution
  evidence.
- The new report explicitly keeps private currentness/execution evidence
  separate from public `React.useRef` compatibility. Public root rendering,
  renderer-owned dispatcher lifecycle, real mutable JS ref object identity under
  a renderer, Scheduler timing, `act`, callback/external-store/id behavior, and
  package compatibility all remain blocked.
- Added source-owned blocker rows for the missing renderer/root lifecycle
  prerequisites before private `useRef` evidence can become public
  compatibility.
- Added fail-closed validation for cloned reports, stale/caller-shaped rows,
  stale private currentness, caller-supplied ref objects, root/Scheduler/act
  prerequisite smuggling, public compatibility claims, accessor/symbol/
  non-enumerable/proxy-hidden caller claims, and mismatched dispatcher/source
  identity.

## Changed Files

- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `worker-progress/worker-988-useref-renderer-lifecycle-blockers.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PROGRESS.md`, and accepted reports from
  Workers 956, 974, and 977.
- Reused Worker 956's accepted private dispatcher/currentness gate and Worker
  974's accepted source-owned private execution evidence as prerequisites.
- Kept Worker 977's Rust `useRef` canary as accepted private Rust evidence only;
  no Rust files were changed.
- Added `createUseRefHookRendererLifecycleBlockerReport()`,
  `consumeUseRefHookRendererLifecycleBlockerReport()`,
  `validateUseRefHookRendererLifecycleBlockerReport()`, and
  `isUseRefHookRendererLifecycleBlockerReport()` in the private
  `hook-dispatcher.js` boundary.
- The new source-owned rows record blockers for private currentness not being
  public compatibility, private execution not proving renderer ref object
  compatibility, dispatcher lifecycle, root rendering/hook-list rebinding,
  Scheduler/`act` timing, and adjacent hook/package compatibility.

## Commands Run

```sh
node --check packages/react/hook-dispatcher.js
node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --check tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
npm run check --workspace @fast-react/react
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
```

## Verification Results

- Hook dispatcher guard suite passed: 32 tests.
- Hook dispatcher oracle suite passed: 22 tests.
- Combined hook dispatcher suite passed: 54 tests.
- React workspace check/import smoke passed, with the existing npm
  `minimum-release-age` warning.
- Package surface guard passed, with the existing npm `minimum-release-age`
  warning.
- Standalone import-entrypoint smoke passed.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers.
- This remains package-private blocker/currentness evidence. It does not claim
  public `React.useRef` compatibility, renderer root lifecycle compatibility,
  real renderer-backed mutable JS ref object compatibility, Scheduler timing,
  `act`, callback/external-store/id compatibility, or package compatibility.

## Recommended Next Tasks

1. Keep public `useRef` compatibility blocked until renderer/root-backed
   dispatcher lifecycle, hook-list rebinding, and root commit evidence are
   admitted together.
2. Replace the source-owned private ref object evidence with renderer/root-backed
   real JS ref object identity and mutability evidence before admitting public
   compatibility.
