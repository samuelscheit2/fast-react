# Worker 214: DOM Component Tree Mounted Map

## Goal

- Status: active
- Objective: extend the private React DOM component-tree shell with mounted
  node map helpers, latest-props storage, and cleanup tests needed by future
  commit and event work, without event plugin dispatch, public instance
  lookup, hydration replay, root facade behavior, or DOM mutation integration
- Goal tool: `create_goal` and `get_goal` were available. `get_goal`
  confirmed the active objective above for thread
  `019e1041-7622-78c1-968b-11b172972167`.

## Summary

Extended the private React DOM component-tree shell with mounted host-token and
node lookup helpers while keeping all behavior private and unwired.

The component-tree module now provides:

- Mounted token-to-node and node-to-token helpers with node/token agreement
  validation.
- A mounted-token assertion that distinguishes known-but-unmounted tokens from
  unknown or detached tokens.
- Closest mounted host-instance lookup by walking `parentNode` and stopping at
  private React DOM root markers.
- Token-based latest-props read/update helpers over the existing node storage.
- Token-driven detach cleanup that clears node expandos, reverse-map entries,
  latest props, and token metadata.

No event plugin dispatch, public instance lookup, hydration replay, public root
facade behavior, DOM mutation integration, Rust code, root bridge, or event
dispatcher files were changed.

## Changed Files

- `packages/react-dom/src/client/component-tree.js`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `worker-progress/worker-214-dom-component-tree-mounted-map.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 090, 141, 168, 170, and 171.
- Inspected `packages/react-dom/src/client/component-tree.js`.
- Inspected private root marker and listener guard files:
  `root-markers.js`, `root-listeners.js`, `listener-registry.js`, and
  `react-dom-event-listener.js`.
- Checked the React 19.2.6 reference
  `ReactDOMComponentTree.js`, including direct instance lookup, closest
  instance traversal, latest props, and deleted-instance cleanup behavior.
- Inspected existing component-tree and mutation smoke coverage to keep this
  slice scoped to map helpers and focused tests.

## Delegated Checks

- Spawned explorer `component_tree_api_research` for a read-only API-shape
  check against the local source and React reference clone.
- The explorer did not return usable findings before timeout and was closed.
  No conclusions or implementation choices depend on subagent output.

## Commands Run

```sh
create_goal
get_goal
pwd && rg --files | rg '(^WORKER_BRIEF.md$|^MASTER_PLAN.md$|^MASTER_PROGRESS.md$|worker-progress/worker-(090|141|168|170|171)-.*\.md$|packages/react-dom/src/client/component-tree\.js$)'
rg --files packages/react-dom/src | rg '(event|listener|root|component-tree)'
git status --short
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-090-dom-node-map-public-instance-plan.md
sed -n '1,260p' worker-progress/worker-141-event-node-map-refresh.md
sed -n '260,380p' worker-progress/worker-141-event-node-map-refresh.md
sed -n '1,260p' worker-progress/worker-168-dom-component-tree-map-shell.md
sed -n '1,260p' worker-progress/worker-170-dom-event-priority-shell.md
sed -n '1,260p' worker-progress/worker-171-dom-root-marker-listener-guard.md
sed -n '1,240p' packages/react-dom/src/client/component-tree.js
sed -n '1,260p' packages/react-dom/src/client/root-markers.js
sed -n '1,340p' packages/react-dom/src/events/root-listeners.js
sed -n '1,340p' packages/react-dom/src/events/listener-registry.js
sed -n '1,320p' packages/react-dom/src/events/react-dom-event-listener.js
sed -n '1,340p' tests/smoke/react-dom-component-tree-map-shell.mjs
sed -n '1,300p' packages/react-dom/src/client/dom-container.js
sed -n '1,300p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js
sed -n '240,340p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/ReactDOMEventListener.js
sed -n '640,700p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/DOMPluginEventSystem.js
sed -n '300,460p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js
rg -n "component-tree|HostInstanceToken|latestProps|LatestProps|Mounted|mount" packages/react-dom tests worker-progress
rg -n "ReactDOMComponentTree|precacheFiberNode|updateFiberProps|getClosestInstanceFromNode|getInstanceFromNode|getNodeFromInstance|detachDeletedInstance" /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events
rg --files tests | rg '(component-tree|root-listener|container-listener|event-priority)'
node --check packages/react-dom/src/client/component-tree.js
node --check tests/smoke/react-dom-component-tree-map-shell.mjs
node tests/smoke/react-dom-component-tree-map-shell.mjs
npm run check:js
git diff --check
git status --short
git diff --stat
```

## Verification

- `node --check packages/react-dom/src/client/component-tree.js` passed.
- `node --check tests/smoke/react-dom-component-tree-map-shell.mjs` passed.
- `node tests/smoke/react-dom-component-tree-map-shell.mjs` passed:
  `React DOM private component tree map shell smoke checks passed.`
- `npm run check:js` passed, including package-surface guard, import smoke,
  benchmark gate, workspace checks, and conformance with 480 passing tests.
  NPM printed the existing `minimum-release-age` config warning.
- `git diff --check` passed.

## Risks Or Blockers

- This remains a private shell. Mounted tokens are still JS-owned opaque test
  tokens until a future reconciler mounted-current resolver and generation
  retirement API exists.
- Closest mounted lookup intentionally returns only mounted host tokens/nodes
  and stops at private root markers; it does not return HostRoot, Suspense,
  Activity, hydration boundary, portal, or public instance data.
- Latest props can retain user callbacks while a node is mounted. Future DOM
  mutation deletion/unmount work must call the cleanup helper for every mapped
  host node.

## Recommended Next Tasks

1. Wire future DOM host creation/update/deletion code to these helpers only
   after successful host mutation work, keeping failed updates from publishing
   new latest props.
2. Add reconciler mounted-current token resolver APIs before event dispatch or
   public instance/ref lookup consumes these maps.
3. Keep hydration boundary maps, portal bubbling, controlled restore, and
   public instance lookup as separate follow-up slices with their own tests.
