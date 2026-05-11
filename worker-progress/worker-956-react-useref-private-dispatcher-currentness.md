# Worker 956: React useRef Private Dispatcher Currentness

## Summary

- Moved `React.useRef` off the generic dispatcher pass-through path and behind
  a source-owned private ref-hook dispatcher marker.
- Added package-private `useRef` source/currentness reports that bind the root,
  CJS development, CJS production, and react-server surfaces to the current
  blocked state.
- Preserved public export shape for default/CJS `useRef` and preserved
  react-server absence. No public compatibility, renderer behavior, root
  scheduling, `act`, ref identity, package compatibility, callback,
  external-store, or id-generation claim was opened.
- Audit repair: `privateRefHookDispatcherMetadata` is now accepted only by
  canonical module-owned object identity, and `useRef` surface currentness rows
  derive source-function identity plus rootless/generic-dispatcher probes
  instead of hardcoded blocker booleans.

## Changed Files

- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `worker-progress/worker-956-react-useref-private-dispatcher-currentness.md`

## Currentness Path

- Private dispatcher marker:
  `hookDispatcher.markPrivateRefHookDispatcher(dispatcher, metadata)`.
- Private metadata:
  `hookDispatcher.privateRefHookDispatcherMetadata`.
- Source/currentness report factory:
  `hookDispatcher.createUseRefHookCurrentnessReport()`.
- Source/currentness report consumer:
  `hookDispatcher.consumeUseRefHookCurrentnessReport(report)`.
- Report validation:
  `hookDispatcher.validateUseRefHookCurrentnessReport(report)`.

The gate requires the report object to come from the package-private factory,
keeps generated no-override surface rows identity-bound through a `WeakMap`, and
rejects cloned rows, row-overridden reports, root/CJS/server drift, stale source
rows, same-shaped fake `useRef` exports, generic dispatcher forwarding, public
compatibility flags, Scheduler/root prerequisite smuggling,
callback/external-store/id claims, and ref identity compatibility claims.

`isPrivateRefHookDispatcherMetadata(metadata)` now rejects same-shaped clones by
requiring `metadata === privateRefHookDispatcherMetadata`.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and the
  required Worker 358, 916, 918, 926, 929, 938, and 943 reports.
- Inspected `packages/react/hook-dispatcher.js`, default/CJS/server React
  surfaces, and the focused hook-dispatcher guard/oracle tests.
- Checked React 19.2.6 source anchors:
  - `packages/react/src/ReactHooks.js` `useRef`
  - `packages/react-reconciler/src/ReactFiberHooks.js` `mountRef` and
    `updateRef`
  - `packages/react/src/ReactClient.js` root export wiring
  - `packages/react/src/ReactServer.js` server absence
- Checked existing private Rust useRef metadata names from Worker 358 in
  `crates/fast-react-reconciler/src/function_component.rs`.
- Added audit negative coverage for shallow-cloned ref dispatcher metadata,
  same-shaped fake `React.useRef` returning a ref object, row-overridden
  currentness reports, and cloned surface/currentness report rows.

## Commands Run

```sh
node --check packages/react/hook-dispatcher.js
node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --check tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs tests/conformance/test/react-hook-dispatcher-oracle.test.mjs
npm run check --workspace @fast-react/react
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
```

## Verification Results

- Hook dispatcher guard passed: 32 tests.
- Hook dispatcher oracle passed: 15 tests.
- Combined hook dispatcher suite passed: 47 tests.
- React workspace import smoke passed, with the existing npm
  `minimum-release-age` warning.
- Package surface guard passed, with the existing npm `minimum-release-age`
  warning.
- Import entrypoint smoke passed.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers.
- This remains a private package boundary. Marking a private `useRef`
  dispatcher only proves source-owned routing and blocker/currentness; it does
  not prove full hook execution, ref object identity compatibility, root
  rendering, renderer behavior, Scheduler timing, `act`, or package
  compatibility.
- Future hook admission work should replace the blocker/currentness report with
  source-owned execution evidence instead of flipping compatibility flags.

## Recommended Next Tasks

1. Keep default/CJS `useRef` behind the private marker until root
   `renderWithHooks`, hook-list rebinding, and renderer-owned dispatcher
   lifecycle are admitted together.
2. When public useRef behavior is admitted, add oracle-backed ref identity and
   update-render evidence before claiming compatibility.
