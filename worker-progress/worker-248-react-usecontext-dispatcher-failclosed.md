# Worker 248: React useContext Dispatcher Fail-Closed Surface

## Goal Setup

- `create_goal` was called as the first action for this worker objective.
- `get_goal` was called immediately after setup and again before this report.
- Active goal status recorded by the tool: `active`.
- Active goal objective recorded by the tool:
  `Add a public React useContext dispatcher fail-closed surface that forwards only to a marked private context dispatcher and otherwise preserves invalid-hook-call behavior, without wiring reconciler context reads, React DOM, native, or compatibility claims.`

## Summary

Added a package-private context-hook dispatcher marker for public
`React.useContext`. `useContext` now forwards only when the installed shared
dispatcher has been marked with `markPrivateContextHookDispatcher`; absent,
unmarked, or malformed dispatchers keep the existing invalid-hook-call error
boundary.

The existing `useState`/`useReducer` private state dispatcher marker and
placeholder failure behavior were left unchanged. No reconciler context reads,
React DOM, native bridge, react-server hook exports, or compatibility claims
were added.

No nested agents were used.

## Changed Files

- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `tests/conformance/src/context-object-local-gate.mjs`
- `worker-progress/worker-248-react-usecontext-dispatcher-failclosed.md`

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`; did not read `ORCHESTRATOR.md`.
- Read referenced worker reports 028, 180, 182, 220, 221, and 222.
- Worker 247 did not have a checked-in markdown progress report in this
  worktree; the sibling worker directory only exposed a Codex log for the
  private function-component context read canary assignment, so no conclusions
  depended on substantive worker-247 findings.
- Inspected `packages/react/hook-dispatcher.js`, default and react-server React
  entrypoints, placeholder error helpers, focused hook dispatcher tests, and the
  context-object local gate.
- The accepted context-object gate still records runtime context propagation,
  Provider begin-work integration, and function-component `useContext` render
  reads as blocked.

## Implemented Behavior

- Added a separate `WeakSet` for marked private context dispatchers.
- Added package-private helpers:
  - `markPrivateContextHookDispatcher`
  - `isPrivateContextHookDispatcher`
  - `callPrivateContextDispatcherHook`
- Routed public `useContext` through the private context dispatcher gate.
- Kept unmarked dispatcher calls on `FAST_REACT_INVALID_HOOK_CALL`, not the
  state-hook placeholder error.
- Updated focused tests to prove:
  - `useContext` still throws invalid-hook-call without a dispatcher;
  - a generic dispatcher with `useContext` is not called;
  - a marked private context dispatcher forwards with the dispatcher as `this`;
  - generic non-state, non-context hooks still forward as before;
  - `useState`/`useReducer` private state dispatcher behavior remains covered.
- Updated the context-object local gate source check so it still recognizes
  `useContext` as dispatcher-only and runtime-blocked after the private marker
  tightening.

## Commands Run

```sh
create_goal
get_goal
sed -n ... WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
sed -n ... worker-progress/worker-028-create-context-behavior.md
sed -n ... worker-progress/worker-180-core-context-stack-foundation.md
sed -n ... worker-progress/worker-182-react-hook-dispatcher-guard.md
sed -n ... worker-progress/worker-220-react-hook-dispatcher-usestate-failclosed.md
sed -n ... worker-progress/worker-221-react-context-provider-object-coverage.md
sed -n ... worker-progress/worker-222-core-context-stack-reconciler-canary.md
rg --files worker-progress | rg 'worker-(028|180|182|220|221|222|247)'
tail -n ... sibling worker-247 Codex log
rg -n ... sibling worker-247 Codex log
git status --short
rg --files packages/react
sed -n ... packages/react/hook-dispatcher.js
sed -n ... packages/react/index.js
sed -n ... packages/react/react.react-server.js
sed -n ... tests/conformance/test/react-hook-dispatcher-guard.test.mjs
sed -n ... tests/conformance/src/context-object-local-gate.mjs
node --check packages/react/hook-dispatcher.js
node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --check tests/conformance/src/context-object-local-gate.mjs
node --check tests/conformance/test/context-object-oracle.test.mjs
node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs
node --test tests/conformance/test/context-object-oracle.test.mjs
npm run check:js
git diff -- packages/react/hook-dispatcher.js tests/conformance/test/react-hook-dispatcher-guard.test.mjs tests/conformance/src/context-object-local-gate.mjs
git diff --check
```

## Verification

- `node --check packages/react/hook-dispatcher.js`: passed.
- `node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs`:
  passed.
- `node --check tests/conformance/src/context-object-local-gate.mjs`: passed.
- `node --check tests/conformance/test/context-object-oracle.test.mjs`:
  passed.
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`:
  passed, 8 tests.
- `node --test tests/conformance/test/context-object-oracle.test.mjs`: passed,
  13 tests.
- `npm run check:js`: passed, including workspace smoke checks, benchmark gate,
  and 507 conformance tests. npm printed existing `minimum-release-age` config
  warnings.
- `git diff --check`: passed.

## Risks Or Blockers

- No blockers.
- This is only package-private JS dispatcher capability plumbing. It does not
  read JS context object values, connect to the core `ContextStack`, integrate
  function-component render, wire Provider propagation, or update DOM/native
  surfaces.
- Future private render dispatchers that need `useContext` must mark their
  dispatcher through `markPrivateContextHookDispatcher` before public
  `React.useContext` can execute.
- The source-pattern context local gate remains intentionally conservative; it
  proves the runtime is still blocked, not that context propagation works.

## Recommended Next Tasks

1. Wire a future private function-component context dispatcher through
   `markPrivateContextHookDispatcher` only after reconciler-owned context reads
   are ready.
2. Add render-time dual-run context propagation scenarios after Provider
   begin-work and function-component render can exercise real roots.
3. Keep compatibility claims blocked until `useContext` reads provider values
   through renderer-backed runtime integration.
