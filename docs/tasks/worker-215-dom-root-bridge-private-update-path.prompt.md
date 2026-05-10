# Worker 215: DOM Root Bridge Private Update Path

Objective: advance the private React DOM root bridge with deterministic
create/render/unmount request records that align with accepted root oracles and
root marker/listener guards, without native/Rust execution, DOM mutation,
hydration, event dispatch, controlled forms, or compatibility claims.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 046, 054, 088, 089, 121, 122, 135, 167, and 171.
- Inspect `packages/react-dom/src/client/root-bridge.js`,
  `dom-container.js`, `root-markers.js`, and public client entrypoints.

## Write Scope

- Primary: `packages/react-dom/src/client/root-bridge.js`.
- Secondary: `packages/react-dom/src/client/dom-container.js` and focused root
  bridge tests if needed.
- Report: `worker-progress/worker-215-dom-root-bridge-private-update-path.md`.
- Do not edit DOM mutation, events beyond listener guards, Rust crates, or
  master docs.

## Verification

- `node --check` for touched JS files.
- Focused root bridge/root marker tests.
- `npm run check:js`
- `git diff --check`
