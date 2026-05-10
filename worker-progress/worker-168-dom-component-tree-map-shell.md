# Worker 168: DOM Component Tree Map Shell

## Goal
- Status: active
- Objective: add a private DOM component-tree/latest-props map shell with tests, without wiring events, public instance lookup, refs, hydration, portals, or DOM mutation commit

## Progress
- 2026-05-10 04:18:12 CEST: Goal created and confirmed via get_goal.
- 2026-05-10 04:24:51 CEST: Implemented and verified the private React DOM component tree map shell.

## Summary

Added a private React DOM component-tree shell under
`packages/react-dom/src/client/component-tree.js`.

The shell provides:

- Opaque module-local host instance tokens backed by `WeakMap` metadata.
- Private element/text host-node attachment and detachment helpers.
- Separate latest-props storage, replacement, lookup, and deterministic cleanup.
- Host-owner and root-owner lookup through private tokens, without storing raw
  fibers on DOM-like nodes.
- Wrong-node rejection by requiring the node expando and token reverse map to
  agree before returning tokens, owners, or latest props.

No public React DOM entrypoint, event extraction path, root listener wiring,
public instance/ref lookup, hydration, portals, Rust code, or DOM mutation
commit path was modified.

## Changed Files

- `packages/react-dom/src/client/component-tree.js`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `worker-progress/worker-168-dom-component-tree-map-shell.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`.
- Read required dependency reports:
  `worker-progress/worker-141-event-node-map-refresh.md`,
  `worker-progress/worker-090-dom-node-map-public-instance-plan.md`, and
  `worker-progress/worker-122-dom-container-listener-shell.md`.
- Inspected current private React DOM source under `packages/react-dom/src`,
  especially `dom-container.js`, `root-markers.js`, `listener-registry.js`,
  and `root-listeners.js`.
- Inspected public React DOM placeholders:
  `packages/react-dom/index.js`, `packages/react-dom/client.js`, and
  `packages/react-dom/package.json`.
- Inspected the React 19.2.6 reference source at
  `/Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js`.

## Delegated Checks

- Spawned explorer `react_dom_component_tree_patterns` for a read-only pattern
  check against local React DOM source and the React reference clone.
- The explorer did not return usable findings before timeout. It was closed;
  the implementation and verification above are based on direct source reads.

## Verification

- `node --check packages/react-dom/src/client/component-tree.js`
- `node --check tests/smoke/react-dom-component-tree-map-shell.mjs`
- `node tests/smoke/react-dom-component-tree-map-shell.mjs`
  - Passed: `React DOM private component tree map shell smoke checks passed.`
- `npm run check:js`
  - Passed. This ran the workspace JS checks and the conformance package's
    `node --test test/*.test.mjs` suite: 415 passed, 0 failed.
  - NPM printed the existing `minimum-release-age` config warning.
- `git add --intent-to-add packages/react-dom/src/client/component-tree.js tests/smoke/react-dom-component-tree-map-shell.mjs worker-progress/worker-168-dom-component-tree-map-shell.md && git diff --check && git reset -- packages/react-dom/src/client/component-tree.js tests/smoke/react-dom-component-tree-map-shell.mjs worker-progress/worker-168-dom-component-tree-map-shell.md`
  - Passed with no whitespace errors.

## Risks Or Blockers

- This is intentionally a private shell. It is not wired to DOM mutation
  commit, event dispatch, refs, hydration, portals, or public React DOM APIs.
- Owner handles remain opaque JS values in this shell. Future reconciler-host
  integration still needs real mounted-current host token validation and
  generation retirement.
- Latest props can retain callbacks and user objects while attached; deletion
  cleanup must call the detach helper when the future DOM commit layer lands.

## Recommended Next Tasks

1. Wire future DOM host creation/update/deletion code to call attach,
   update-latest-props, and detach only after successful mutation work.
2. Add reconciler mounted-current token resolver APIs before event dispatch or
   public instance lookup consumes these maps.
3. Keep hydration boundary maps, portal bubbling, controlled restore, and refs
   as separate layers with their own oracles.
