# Worker 211: DOM Host Text-Content Local Gate

Objective: connect the private React DOM text-content helper and tests to the
accepted React DOM 19.2.6 text-content oracle/local gate, proving current Fast
React behavior stays fail-closed where unsupported without changing public
roots, package exports, or DOM mutation commits.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 110, 152, 154, 185, and 201.
- Inspect `packages/react-dom/src/dom-host/text-content.js`,
  `tests/conformance/src/dom-text-content-local-gate.mjs`, and the worker 201
  oracle/generator/test files.

## Write Scope

- Primary: `packages/react-dom/src/dom-host/text-content.js`.
- Secondary: DOM text-content conformance local-gate tests/scripts only.
- Report: `worker-progress/worker-211-dom-host-text-content-local-gate.md`.
- Do not edit public React DOM entrypoints, root bridge, mutation adapter, Rust
  crates, or master docs.

## Verification

- `node --check` for touched JS files.
- `node --test tests/conformance/test/dom-text-content-oracle.test.mjs`
- Focused DOM text-content local-gate command if present or added.
- `npm run check:js`
- `git diff --check`
