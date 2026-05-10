# Worker 212: DOM Mutation Text Node Operations

Objective: extend the private DOM mutation adapter with deterministic text node
update, clear, insert, and removal behavior over the existing fake-DOM tests,
without public `createRoot`, hydration, event dispatch, controlled form logic,
or React DOM compatibility claims.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 091, 105, 134, 154, 185, and 201.
- Inspect `packages/react-dom/src/dom-host/mutation.js` and related tests.

## Write Scope

- Primary: `packages/react-dom/src/dom-host/mutation.js`.
- Secondary: focused DOM host mutation tests only.
- Report: `worker-progress/worker-212-dom-mutation-text-node-ops.md`.
- Do not edit root bridge, event system, property payload, Rust crates, or
  master docs.

## Verification

- `node --check` for touched JS files.
- Focused DOM host mutation tests.
- `npm run check:js`
- `git diff --check`
