# Worker 274: DOM Event Dispatch Component Tree Target Gate

## Goal

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: "Connect the private DOM event
  dispatch skeleton to component-tree target normalization records so dispatch
  can identify mounted host nodes in diagnostics while staying inert: no plugin
  event queue execution, no listener invocation, no hydration replay, no
  controlled restore, and no public root behavior."

## Summary

Connected the private React DOM dispatch diagnostics to the component-tree
mounted host-node map while keeping dispatch inert.

The component-tree module now creates frozen event-target normalization records
that identify the closest mounted host token/node, direct mounted target token,
host owner, root owner, node type, and latest-props presence without exposing a
public API. The private dispatch skeleton attaches that record to both the
blocked dispatch record and blocked plugin-extraction record, while preserving
`targetInst: null`, `targetResolutionStatus: "blocked"`, empty dispatch queues,
zero synthetic events, zero listener invocations, blocked hydration replay, and
blocked controlled restore.

Scope note: this worktree did not contain
`packages/react-dom/src/events/dispatch.js`; the accepted skeleton was in
`plugin-event-system.js`. I added a private `dispatch.js` alias and wired the
existing skeleton in `plugin-event-system.js`. The prompt's
`tests/conformance/test/react-dom-event-delegation-oracle.test.mjs` path was
also absent; the existing checked oracle file is
`tests/conformance/test/dom-event-delegation-oracle.test.mjs`, and the focused
dispatch assertions live in
`tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`.

## Changed Files

- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/events/dispatch.js`
- `packages/react-dom/src/events/plugin-event-system.js`
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `worker-progress/worker-274-dom-event-dispatch-component-tree-target-gate.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 168, 214, 216, 244, and 259 as assigned.
- Inspected current component-tree, root-listener, priority-wrapper, dispatch,
  delegation-oracle, and dispatch-skeleton test files.
- Checked React 19.2.6 reference sources for `ReactDOMComponentTree.js`,
  `ReactDOMEventListener.js`, `DOMPluginEventSystem.js`, and `getListener.js`.
- Confirmed `dispatch.js` and the prompt's `react-dom-event-delegation` test
  filename were absent in this worktree before adapting to the existing files.
- Spawned one read-only explorer for dispatch/component-tree context. It did
  not return usable findings before timeout and was closed; implementation
  conclusions are based on direct source inspection.

## Commands Run

- `create_goal`
- `get_goal`
- `cat WORKER_BRIEF.md`
- `cat MASTER_PLAN.md`
- `cat MASTER_PROGRESS.md`
- `cat worker-progress/worker-168-dom-component-tree-map-shell.md`
- `cat worker-progress/worker-214-dom-component-tree-mounted-map.md`
- `cat worker-progress/worker-216-dom-event-listener-priority-wrapper.md`
- `cat worker-progress/worker-244-dom-event-dispatch-plugin-skeleton.md`
- `cat worker-progress/worker-259-dom-component-tree-latest-props-commit-adapter.md`
- `find /Users/user/Developer/Developer -maxdepth 2 -path '*/packages/react-dom/src/events/dispatch.js' -print`
- `find /Users/user/Developer/Developer -maxdepth 3 -path '*/tests/conformance/test/react-dom-event-delegation-oracle.test.mjs' -print`
- `node --check packages/react-dom/src/client/component-tree.js`
- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/src/events/dispatch.js`
- `node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`
  - Failed once from the wrong working directory with a path lookup error.
- `node --test test/dom-event-delegation-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `node tests/smoke/react-dom-container-listener-shell.mjs`
- `node tests/smoke/react-dom-component-tree-map-shell.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git status --short --untracked-files=all`
- `git diff --stat`
- `git diff --check`

## Verification

- `node --check` passed for touched JS/MJS files.
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
  passed 6 tests.
- `node --test test/dom-event-delegation-oracle.test.mjs` passed 10 tests
  from the `tests/conformance` working directory.
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
  passed 7 tests.
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
  passed 15 tests.
- `node tests/smoke/react-dom-container-listener-shell.mjs` passed.
- `node tests/smoke/react-dom-component-tree-map-shell.mjs` passed.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `npm run check:js` passed, including package-surface, smoke entrypoints,
  benchmark gates, workspace package checks, native loader checks, and 539
  conformance tests. npm printed the existing `minimum-release-age` warnings.
- `git diff --check` passed with new files included via intent-to-add.

## Risks Or Blockers

- The skeleton remains private and diagnostic-only. It still does not resolve a
  real fiber target, execute plugin queues, construct synthetic events, invoke
  latest-props listeners, replay hydration events, schedule controlled restore,
  retarget portals, or change public root behavior.
- The component-tree record includes raw private fake host node/token
  references for diagnostics. This is acceptable for the current private test
  boundary but should be revisited before any public or serializable diagnostic
  surface exists.
- `latestPropsStatus` deliberately records only presence, not the props object,
  so dispatch records do not retain user callbacks beyond the existing
  component-tree map.
- File naming in the prompt was ahead of this worktree. Future workers should
  decide whether `dispatch.js` should become the canonical module and
  `plugin-event-system.js` should shrink to plugin extraction only.

## Recommended Next Tasks

1. Keep target resolution diagnostic-only until the reconciler has a mounted
   current host-fiber resolver, generation retirement, and wrong-root guards.
2. Add a later SimpleEventPlugin extraction slice that builds dispatch queue
   entries without processing them.
3. Keep listener invocation, hydration replay, controlled restore, portal
   retargeting, and public root behavior as separate gated tasks.
