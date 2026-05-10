# Worker 177 - React DOM FlushSync Private Guard

## Goal

- Status: active
- Objective: add private React DOM flushSync guard scaffolding and tests while the public `flushSync` export remains placeholder-compatible.

## Progress

- Recorded active goal state after `create_goal` and `get_goal`.
- Read the assigned brief, prior flushSync/root-unmount/root-bridge worker
  notes, current React DOM placeholder entrypoints, and the checked
  flushSync/batching oracle tests.
- Added private flushSync guard scaffolding in
  `packages/react-dom/src/shared/flush-sync-guard.js`.
- Added focused JS tests for the private guard and for unchanged public
  `flushSync` placeholder behavior in root and profiling entrypoints.
- Did not wire the helper into public `flushSync`, root unmount, native bridge
  calls, or Rust sync flush.

## Verification

- Passed: `node --test tests/conformance/test/react-dom-flush-sync-private-guard.test.mjs tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`
- Passed: `npm run check:js`
- Passed: `git diff --check`

## Changed Files

- `packages/react-dom/src/shared/flush-sync-guard.js`
- `tests/conformance/test/react-dom-flush-sync-private-guard.test.mjs`
- `worker-progress/worker-177-react-dom-flush-sync-private-guard.md`

## Evidence Gathered

- Upstream React DOM 19.2.6 `ReactDOMFlushSync.js` restores transition and DOM
  update priority, then calls the private dispatcher `f()` flush hook and emits
  the lifecycle reentry warning when that hook reports render/commit reentry.
- Current Fast React `packages/react-dom/index.js` and
  `packages/react-dom/profiling.js` still export `flushSync` through
  `createUnsupportedFunction(entrypoint, 'flushSync', 1)`.
- Existing worker 058 oracle intentionally covers public React DOM behavior
  without claiming Fast React compatibility; this slice keeps oracle fixtures
  unchanged.

## Risks Or Blockers

- The guard is private scaffolding only. Real `flushSync` still needs DOM
  update-priority save/restore, transition clearing, native/reconciler
  dispatcher installation, and cross-root sync work before public behavior can
  be enabled.
- Public root unmount remains untouched and still depends on real root
  scheduler and commit work.

## Recommended Next Tasks

- Wire this helper only after the private React DOM dispatcher and real
  cross-root `flushSyncWork` bridge exist.
- Add behavior tests for priority save/restore and cross-root sync flushing
  when public `flushSync` is intentionally enabled.
