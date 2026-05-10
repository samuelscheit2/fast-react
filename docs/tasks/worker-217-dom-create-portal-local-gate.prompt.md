# Worker 217: DOM CreatePortal Local Gate

Objective: tighten the private/public `createPortal` placeholder against the
accepted portal oracle and core portal record shape, preserving fail-closed
behavior for unsupported reconciliation/commit paths and avoiding DOM mutation,
root scheduling, event bubbling, or compatibility claims.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 057, 181, and 189.
- Inspect `packages/react-dom/src/shared/create-portal.js`,
  `packages/react-dom/index.js`, `crates/fast-react-core/src/element.rs`, and
  portal oracle files.

## Write Scope

- Primary: `packages/react-dom/src/shared/create-portal.js`.
- Secondary: focused portal smoke/conformance tests and package entrypoint
  re-export tests if needed.
- Report: `worker-progress/worker-217-dom-create-portal-local-gate.md`.
- Do not edit reconciler, DOM mutation, root bridge, events, or master docs.

## Verification

- `node --check` for touched JS files.
- Focused portal tests.
- `npm run check:js`
- `git diff --check`
