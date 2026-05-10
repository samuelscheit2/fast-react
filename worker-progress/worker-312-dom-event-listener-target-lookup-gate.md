# Worker 312: DOM Event Listener Target Lookup Gate

## Goal

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: "Add a private DOM event listener
  target lookup gate that combines component-tree host instance lookup, latest
  props, and event dispatch skeleton records without installing public
  listeners or dispatching real synthetic events."

## Progress

- 2026-05-10 08:57:01 CEST: Implemented and verified the private DOM event
  listener target lookup gate.

## Summary

Added a private React DOM event listener target lookup gate that sits behind the
existing component-tree and event dispatch skeleton boundaries.

The gate now:

- Creates frozen listener-target lookup records from private event target
  normalization records and React-style registration names.
- Validates mounted host token/node consistency before latest-props reads.
- Reads hidden latest props and resolves the candidate listener into a hidden
  WeakMap payload without exposing or invoking callbacks.
- Mirrors the React `getListener` disabled-interactive mouse-event guard for
  this private lookup record.
- Fails closed for invalid latest-props listener values and mismatched target
  node expandos before native event side effects.
- Attaches the lookup record to blocked dispatch and plugin-extraction records
  while keeping target instances unresolved, dispatch queues empty, synthetic
  event counts zero, listener invocation counts zero, hydration replay blocked,
  controlled restore blocked, and public root behavior unchanged.

No public React DOM entrypoint, root listener installation behavior, synthetic
event construction, plugin queue execution, hydration replay, controlled state
restore, or real listener invocation was enabled.

## Changed Files

- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/events/plugin-event-system.js`
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `worker-progress/worker-312-dom-event-listener-target-lookup-gate.md`

`packages/react-dom/src/events/dispatch.js` was inspected and checked; it
remains the existing private alias to `plugin-event-system.js`, so the new
exports flow through without a separate edit.

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`. Did not read `ORCHESTRATOR.md`.
- Read assigned worker context for workers 168, 244, 259, and 274. Worker 311
  was not present in this worktree.
- Inspected current private React DOM component-tree, dispatch/plugin-event,
  listener wrapper, root listener, event priority, event target, and smoke test
  files.
- Inspected React 19.2.6 reference sources:
  `ReactDOMComponentTree.js`, `getListener.js`, `DOMEventProperties.js`,
  `SimpleEventPlugin.js`, `DOMPluginEventSystem.js`, and
  `ReactDOMEventListener.js`.
- Confirmed the private dispatch skeleton still derives priority metadata from
  wrapper records and leaves plugin records deterministic for flag variants.
- No nested agents were spawned.

## Commands Run

- `create_goal`
- `get_goal`
- `sed -n` reads for the worker brief, master plan/progress, assigned worker
  progress files, target source/tests, and React reference files.
- `rg --files worker-progress | rg 'worker-(168|244|259|274|311)(-|\\.md)'`
- `rg -n` searches for listener lookup, target lookup, latest props, plugin
  extraction, and test references.
- `node --check packages/react-dom/src/client/component-tree.js`
- `node --check packages/react-dom/src/events/dispatch.js`
- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --check tests/smoke/react-dom-component-tree-map-shell.mjs`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node tests/smoke/react-dom-component-tree-map-shell.mjs`
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `node tests/smoke/react-dom-container-listener-shell.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`
- `git add --intent-to-add worker-progress/worker-312-dom-event-listener-target-lookup-gate.md && git diff --check && git reset -- worker-progress/worker-312-dom-event-listener-target-lookup-gate.md`
- `git status --short --untracked-files=all`
- `date '+%Y-%m-%d %H:%M:%S %Z'`

## Verification

- `node --check` passed for touched JS/MJS files and the existing
  `dispatch.js` alias.
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  passed 9 tests.
- `node tests/smoke/react-dom-component-tree-map-shell.mjs` passed:
  `React DOM private component tree map shell smoke checks passed.`
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
  passed 7 tests.
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
  passed 15 tests.
- `node tests/smoke/react-dom-container-listener-shell.mjs` passed.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `npm run check:js` passed, including package-surface, import smoke,
  benchmark checks, workspace package checks, native loader checks, and 562
  conformance tests. npm printed the existing `minimum-release-age` warnings.
- `git diff --check` passed, including this new progress report through
  `git add --intent-to-add`.

## Risks Or Blockers

- This remains a private diagnostic gate. It does not resolve real fibers,
  traverse ancestors, construct synthetic events, process dispatch queues,
  invoke listeners, replay hydration, restore controlled state, retarget
  portals, or change public root behavior.
- The listener lookup currently covers simple-event React registration names
  and records `null` for polyfill-only plugin names such as `change`; future
  plugin-specific extraction gates should own those mappings deliberately.
- Lookup records retain hidden latest-props/listener references if callers keep
  the private record alive. This matches the private test boundary but should
  not become a public or serializable diagnostic surface.

## Recommended Next Tasks

1. Add a later simple-event extraction gate that builds blocked dispatch queue
   entry records from these lookup records without processing them.
2. Keep two-phase polyfill plugins (`change`, `select`, `beforeInput`, form
   action, scroll end) as separate gated slices with explicit listener-name
   metadata.
3. Add real mounted-current host-fiber generation validation before this lookup
   feeds any public event dispatch or compatibility claim.
