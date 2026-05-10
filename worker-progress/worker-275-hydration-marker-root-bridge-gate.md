# Worker 275: Hydration Marker Root Bridge Gate

## Goal Tool State

- `create_goal` succeeded as the first action before research, file reads,
  implementation, or verification.
- `get_goal` succeeded immediately after setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Integrate the private
  hydration container marker parser with the React DOM root marker/listener
  guard diagnostics so hydrateRoot remains unsupported but container marker
  evidence is deterministic and fail-closed.

## Summary

- Integrated the private hydration container marker parser into unsupported
  `hydrateRoot` records alongside root marker and root listener guard
  diagnostics.
- Added a read-only root listener guard helper in the private root listener
  module, and kept it diagnostic-only: it reads marker/listener state but does
  not call `addEventListener`.
- Added unsupported hydration root marker guard snapshots that scrub randomized
  `__reactContainer$` suffixes through existing marker inspection helpers.
- Kept public `hydrateRoot` unsupported, with no DOM mutation, no event replay,
  no root scheduling, no listener installation, and no compatibility claim.

## Path Mapping

- The assigned `packages/react-dom/src/client/root-listener.js` path is named
  `packages/react-dom/src/events/root-listeners.js` in this worktree.
- The assigned `packages/react-dom/src/client/hydration-boundary.js` path is
  named `packages/react-dom/src/client/hydration-boundary-gate.js` here.

## Changed Files

- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `packages/react-dom/package.json`
- `tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`
- `worker-progress/worker-275-hydration-marker-root-bridge-gate.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`; did not
  read `ORCHESTRATOR.md`.
- Inspected worker reports 122, 169, 218, and 246.
- Inspected current private React DOM modules:
  `hydration-boundary-gate.js`, `hydration-marker-parser.js`,
  `root-markers.js`, `root-listeners.js`, `listener-registry.js`, and
  `root-bridge.js`.
- Checked the local React 19.2.6 source reference for `createRoot`,
  `hydrateRoot`, `warnIfReactDOMContainerInDEV`, `markContainerAsRoot`, and
  `listenToAllSupportedEvents`.
- Verified the new unsupported hydration records include deterministic:
  hydration marker parser diagnostics, root marker snapshots, duplicate-root
  guard warning metadata, and listener guard metadata.
- Verified the public `react-dom/client` and `react-dom/profiling`
  `hydrateRoot` exports still throw unsupported placeholder errors and do not
  create roots or side effects.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files worker-progress | rg 'worker-(122|169|218|246)'
sed -n '1,260p' worker-progress/worker-122-dom-container-listener-shell.md
sed -n '1,280p' worker-progress/worker-169-hydration-boundary-skeleton.md
sed -n '1,280p' worker-progress/worker-218-hydration-boundary-failclosed.md
sed -n '1,320p' worker-progress/worker-246-hydration-container-marker-parser.md
rg --files | rg '(root-listener|hydration-boundary|hydration.*test|container-root-markers)'
sed -n '1,360p' packages/react-dom/src/client/hydration-boundary-gate.js
sed -n '1,360p' packages/react-dom/src/client/hydration-marker-parser.js
sed -n '1,360p' packages/react-dom/src/events/root-listeners.js
sed -n '1,320p' packages/react-dom/src/client/root-markers.js
sed -n '1,760p' packages/react-dom/src/client/root-bridge.js
sed -n '1,260p' packages/react-dom/src/events/listener-registry.js
sed -n '274,420p' /Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMRoot.js
node --check packages/react-dom/src/events/root-listeners.js
node --check packages/react-dom/src/client/hydration-boundary-gate.js
node --check packages/react-dom/test/hydration-boundary.test.js
node --check tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs
node --test packages/react-dom/test/hydration-boundary.test.js
node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs
node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs
node --test packages/react-dom/test/*.test.js
node tests/smoke/import-entrypoints.mjs
npm run check:js
git diff --check
```

## Verification

- `node --check packages/react-dom/src/events/root-listeners.js`: passed.
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`:
  passed.
- `node --check packages/react-dom/test/hydration-boundary.test.js`: passed.
- `node --check tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`:
  passed.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed, 2
  tests.
- `node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`:
  passed, 10 tests.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed, 6 tests.
- `node --test packages/react-dom/test/*.test.js`: passed, 9 tests.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:js`: passed, including package surface, smoke entrypoints,
  benchmark gate, workspace checks, native loader checks, and 540 conformance
  tests. npm printed the existing `minimum-release-age` warning.
- `git diff --check`: passed.

## Risks Or Blockers

- This is diagnostic-only. Real hydration still needs a hydration root
  constructor, initial hydration scheduling, hydratable cursor state,
  boundary claiming, event replay, and form marker claiming.
- `root-bridge.js` still owns its existing createRoot listener guard helper.
  The new exported listener guard helper is used by the hydration boundary
  gate and can be adopted by the root bridge later if centralization becomes
  worthwhile.
- Public `hydrateRoot` remains intentionally unsupported and compatibility
  claims remain false.

## Recommended Next Tasks

- Keep `hydrateRoot` blocked until reconciler hydration root construction and
  hydratable boundary state exist.
- Consider moving the private createRoot marker guard shape into a shared root
  guard helper when the root bridge is next touched.
- Add event replay diagnostics only after dehydrated root or boundary ownership
  is available without DOM mutation.

## Nested Agents

- None spawned.
