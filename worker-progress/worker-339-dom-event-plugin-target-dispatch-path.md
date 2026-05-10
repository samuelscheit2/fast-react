# Worker 339: DOM Event Plugin Target Dispatch Path

## Goal

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: "advance the private event plugin
  skeleton so admitted fake DOM events can resolve component-tree targets and
  record listener dispatch metadata without public event compatibility or
  browser DOM claims".

## Summary

Advanced the private React DOM event plugin skeleton from single target lookup
metadata to a component-tree dispatch path for admitted fake DOM events.

The component-tree module now builds frozen target-to-root dispatch path
records from mounted fake DOM host nodes. The plugin skeleton resolves
`targetInst` to the private host instance token for mounted targets, records
SimpleEventPlugin listener metadata entries in target-to-root accumulation
order, records root-to-target processing order for capture, and keeps hidden
WeakMap payloads for latest props/listeners without exposing them on public
record fields.

Installed private root listener shells still return `undefined`, but now retain
their last private dispatch record for diagnostics. Listener callbacks,
synthetic event construction, dispatch queue processing, hydration replay,
controlled restore, public root behavior, browser DOM behavior, and
compatibility claims all remain blocked.

No nested agents were spawned.

## Changed Files

- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/events/root-listeners.js`
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `worker-progress/worker-339-dom-event-plugin-target-dispatch-path.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker
  reports 065, 170, 171, 274, and 312. Worker 338's markdown report was not
  present in this worktree; only this worker's `.codex.log` existed.
- Inspected current private component-tree, root listener, event listener,
  plugin event system, dispatch alias, event target, and event-system flag
  modules.
- Checked React 19.2.6 reference sources for `ReactDOMComponentTree`,
  `DOMPluginEventSystem`, `SimpleEventPlugin`, and `getListener`.
- Confirmed public React DOM package exports remain unchanged and private
  source subpaths stay unexported.

## Commands Run

- `create_goal`
- `get_goal`
- `git status --short`
- `rg --files`
- `sed -n` reads for required docs, prior worker reports, source, tests, and
  React reference files.
- `rg -n` searches for existing dispatch, target lookup, worker 338, and
  package-surface references.
- `node --check packages/react-dom/src/client/component-tree.js`
- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/src/events/root-listeners.js`
- `node --check packages/react-dom/src/events/dispatch.js`
- `node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --check tests/smoke/react-dom-component-tree-map-shell.mjs`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node tests/smoke/react-dom-component-tree-map-shell.mjs`
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `node tests/smoke/react-dom-container-listener-shell.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Verification

- JS syntax checks passed for all touched JS/MJS files and the existing
  `dispatch.js` alias.
- Focused dispatch/plugin test passed with 10 tests.
- Component-tree smoke passed.
- Event-priority shell test passed with 7 tests.
- Root listener installation oracle test passed with 15 tests.
- Container listener shell smoke passed.
- Import entrypoint smoke passed.
- `npm run check --workspace @fast-react/react-dom` passed with 21 package
  tests plus import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check` passed.

## Risks Or Blockers

- This remains a private fake-DOM diagnostic path. It records listener metadata
  but does not create synthetic events, invoke callbacks, process queues,
  replay hydration, restore controlled state, retarget portals, or change
  public roots.
- The dispatch path uses fake DOM `parentNode` plus private host-token maps.
  Real mounted-current fiber validation, portal boundary retargeting, root
  matching, and deletion generation checks still need separate gates before any
  public event behavior can be admitted.
- Hidden payloads retain latest props and listener references when callers keep
  private records alive. That is acceptable for current private diagnostics but
  must not become a public or serializable surface.

## Recommended Next Tasks

1. Add a private synthetic-event construction gate that records event shape
   without invoking dispatch queue listeners.
2. Add portal/root-boundary retargeting metadata before dispatch path records
   are used across nested roots or portal containers.
3. Keep hydration replay, controlled restore, polyfill plugins, and public
   root/event compatibility behind separate explicit gates.
