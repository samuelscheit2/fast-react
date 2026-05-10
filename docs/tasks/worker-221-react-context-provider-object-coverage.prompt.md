# Worker 221: React Context Provider Object Coverage

Objective: expand focused coverage around the JS React context object/provider
placeholder shape against the accepted React 19.2.6 context oracle, keeping
runtime propagation, reconciler begin-work integration, and compatibility
claims blocked.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 028, 180, and context-object oracle reports.
- Inspect `packages/react/context-object.js`, `packages/react/index.js`, and
  context conformance oracle/generator files.

## Write Scope

- Primary: `packages/react/context-object.js`.
- Secondary: focused React context tests/oracle local gates only.
- Report: `worker-progress/worker-221-react-context-provider-object-coverage.md`.
- Do not edit reconciler context stack, React DOM, test-renderer, or master docs.

## Verification

- `node --check` for touched JS files.
- Focused context object tests.
- `npm run check:js`
- `git diff --check`
