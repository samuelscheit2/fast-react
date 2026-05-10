# Worker 214: DOM Component Tree Mounted Map

Objective: extend the private React DOM component-tree shell with mounted node
map helpers, latest-props storage, and cleanup tests needed by future commit
and event work, without event plugin dispatch, public instance lookup,
hydration replay, root facade behavior, or DOM mutation integration.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 090, 141, 168, 170, and 171.
- Inspect `packages/react-dom/src/client/component-tree.js`,
  event listener shells, and root marker/listener guard files.

## Write Scope

- Primary: `packages/react-dom/src/client/component-tree.js`.
- Secondary: focused component-tree tests only.
- Report: `worker-progress/worker-214-dom-component-tree-mounted-map.md`.
- Do not edit root bridge, mutation adapter, event dispatchers, Rust crates, or
  master docs.

## Verification

- `node --check` for touched JS files.
- Focused component-tree tests.
- `npm run check:js`
- `git diff --check`
