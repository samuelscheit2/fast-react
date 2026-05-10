# Worker 220: React Hook Dispatcher UseState Fail-Closed Surface

## Goal Setup

- `create_goal` was called as the first action for this worker objective.
- `get_goal` was available after setup and again before this report.
- Active goal status recorded by the tool: `active`.
- Active goal objective recorded by the tool:
  `Tighten the JS React hook dispatcher guard so useState and useReducer fail deterministically when no native/private dispatcher is installed, matching existing package placeholder style and preserving public compatibility claims as blocked.`

## Summary

Tightened the package-private React hook dispatcher so `useState` and
`useReducer` no longer forward through an arbitrary installed JS dispatcher.
They now require an explicitly marked private state-hook dispatcher before
they call through. Without that private dispatcher, they throw the existing
React package placeholder error shape: `FastReactUnimplementedError` with
`FAST_REACT_UNIMPLEMENTED`, `entrypoint: "react"`, and the hook export name.

Non-state selected hooks keep the worker 182 invalid-hook-call and forwarding
behavior. The react-server hook surface is unchanged. Public compatibility
claims remain blocked; this is only a fail-closed JS guard for future private
dispatcher integration.

No Rust crates, React DOM, react-test-renderer, or master docs were edited.
No nested agents were used.

## Changed Files

- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `worker-progress/worker-220-react-hook-dispatcher-usestate-failclosed.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read required reports: workers 097, 112, 136, 158, 182, 192, and 200.
- Inspected `packages/react/hook-dispatcher.js`, `packages/react/index.js`,
  `packages/react/react.react-server.js`, `packages/react/placeholder-utils.js`,
  `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`, and related
  smoke/package-surface checks.
- Checked the pinned React 19.2.6 reference clone at commit
  `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`, especially
  `packages/react/src/ReactHooks.js` and shared internals holder evidence.
- Existing package placeholder style comes from
  `packages/react/placeholder-utils.js`; the new state-hook absence path uses
  that same error constructor.

## Implemented Behavior

- Added a private `WeakSet` capability gate for state-hook dispatchers.
- Added `markPrivateStateHookDispatcher` and `isPrivateStateHookDispatcher`
  inside the package-private hook dispatcher module.
- Routed `useState`, `useReducer`, and private `callDispatcherHook` calls for
  those hook names through the private state dispatcher gate.
- Preserved React 19.2.6 function name and length shapes for the public hook
  exports.
- Updated focused tests to prove:
  - non-state selected hooks still throw invalid-hook-call without a dispatcher;
  - `useState` and `useReducer` throw `FAST_REACT_UNIMPLEMENTED` when no
    private state dispatcher is installed;
  - a generic dispatcher with `useState` and `useReducer` methods is not enough
    to make state hooks execute;
  - a marked private state-hook dispatcher can forward `useState` and
    `useReducer`;
  - react-server hooks still share the non-state dispatcher guard.

## Commands Run

- `create_goal`
- `get_goal`
- `rg --files` and `git status --short` for initial orientation.
- `sed` and `nl` reads for required docs, reports, package files, tests, and
  pinned React reference source.
- `node --check packages/react/hook-dispatcher.js`
- `node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:package-surface`
- `npm run check:js`
- `git diff --check`

## Verification

- `node --check packages/react/hook-dispatcher.js`: passed.
- `node --check tests/conformance/test/react-hook-dispatcher-guard.test.mjs`:
  passed.
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`:
  passed, 6 tests.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:package-surface`: passed.
- `npm run check:js`: passed, including 482 conformance tests.
- `git diff --check`: passed.

## Risks Or Blockers

- The private marker is only JS package-private plumbing. It is not a native
  dispatcher bridge, hook queue integration, function component render path, or
  compatibility claim.
- `useState` and `useReducer` now prefer the package placeholder failure over
  the invalid-hook-call failure when no private state dispatcher exists. This is
  intentional for the fail-closed surface, but future public hook conformance
  work must revisit the exact user-facing boundary once real rendering exists.
- Future private dispatcher work must install or mark the dispatcher through
  this module before state hooks can execute.

## Recommended Next Tasks

1. Wire the future private function-component `useState` dispatcher through the
   new marker once native/reconciler state dispatch exists.
2. Add React 19.2.6 black-box state hook oracles only after renderer-backed
   function component rendering and dispatch queues are available.
3. Consider equivalent fail-closed capability gates for other stateful hooks as
   their private implementations are planned.
