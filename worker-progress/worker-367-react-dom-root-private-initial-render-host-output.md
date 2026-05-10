# Worker 367: React DOM Root Private Initial Render Host Output

Date: 2026-05-10

## Goal State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add a private React DOM root bridge
  handoff that applies initial fake-DOM HostComponent/HostText output after
  accepted create/render admission, with explicit cleanup and no public root
  behavior.
- Final goal status: `complete` (`update_goal` reported 587 seconds used).

## Summary

Added a private initial host-output handoff to the React DOM root bridge. The
new handoff accepts only an already-admitted private create/render record with
active createRoot marker/listener side effects, then applies one fake-DOM
HostComponent with one HostText child through private DOM host and component
tree helpers.

The handoff publishes latest props only through the accepted private mutation
handoff, attaches HostComponent and HostText nodes to private component-tree
tokens, appends the HostComponent to the fake container, and returns a frozen
record with hidden payload accessors. A matching cleanup API removes the root
child and detaches the host instance subtree. Public `react-dom/client`
entrypoints remain placeholders and were not modified.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `worker-progress/worker-367-react-dom-root-private-initial-render-host-output.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and present worker reports 167, 263, 337, 338, 342,
  and 352.
- Worker report 356 was not present in this checkout; its task prompt was
  present and read instead.
- Confirmed worker 337's create/render admission keeps DOM mutation blocked
  and stores raw container/element links in hidden payloads.
- Confirmed worker 338's latest-props mutation handoff is the accepted way to
  apply fake-DOM property updates and publish latest props.
- Confirmed component-tree tokens already support element/text host nodes, and
  added a narrow subtree detach helper for explicit cleanup.
- Confirmed public `react-dom/client` exports remain unchanged and still throw
  `FAST_REACT_UNIMPLEMENTED`.

## Commands Run

```sh
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/src/dom-host/mutation.js
node --check packages/react-dom/src/client/component-tree.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/smoke/react-dom-mutation-adapter-shell.mjs
node --check tests/smoke/react-dom-component-tree-map-shell.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node tests/smoke/react-dom-mutation-adapter-shell.mjs
node tests/smoke/react-dom-component-tree-map-shell.mjs
node --test packages/react-dom/test/*.test.js
npm run check --workspace @fast-react/react-dom
git diff --check
git add --intent-to-add worker-progress/worker-367-react-dom-root-private-initial-render-host-output.md
git diff --check
git reset worker-progress/worker-367-react-dom-root-private-initial-render-host-output.md
```

## Verification

- JS syntax checks passed for all touched JavaScript files.
- Focused private root bridge test passed: 10 tests.
- Mutation adapter smoke passed.
- Component-tree smoke passed.
- Full React DOM package tests passed: 28 tests.
- `npm run check --workspace @fast-react/react-dom` passed, including package
  tests and import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check` passed, including a rerun with this progress report added
  via intent-to-add.

## Nested Agents

- Spawned two read-only explorers: one for root bridge/mutation/component-tree
  context and one for prior worker reports.
- Neither returned usable findings before implementation and verification; both
  were closed. They did not affect the implementation conclusions.

## Risks Or Blockers

- This is private fake-DOM host output only. It does not run native/Rust root
  execution, reconciler render/commit traversal, public root scheduling,
  hydration, events, refs, effects, callbacks, portals, resources, controlled
  inputs, or browser compatibility paths.
- Initial host output is intentionally narrow: one string HostComponent element
  with one string/number HostText child. Other child shapes fail closed.
- Cleanup removes the fake-DOM root child and detaches component-tree metadata;
  createRoot marker/listener cleanup remains the explicit side-effect cleanup
  path.

## Recommended Next Tasks

1. Add the private root update host-output path on top of this initial handoff.
2. Add private unmount host-output cleanup that coordinates root unmount
   records, host-output cleanup, and createRoot side-effect cleanup.
3. Keep public root facade rows blocked until public create/render/unmount
   paths are wired through accepted runtime execution and match the React DOM
   19.2.6 oracle.
