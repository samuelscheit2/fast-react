# Worker 399: Controlled Input Private Restore Queue Gate

Objective: add a private controlled-input restore queue diagnostic that records
post-event restore intent from fake-DOM tracker observations without writing
real DOM descriptors or enabling public controlled behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 260, 317, 344, 375, 396, and 397 if
present.

Write scope: `packages/react-dom/src/resource-form-internals-gate.js`,
`packages/react-dom/src/dom-host/property-payload.js`,
`packages/react-dom/test/resource-form-unsupported-gates.test.js`,
`tests/conformance/test/dom-controlled-input-oracle.test.mjs`, and
`worker-progress/worker-399-controlled-input-private-restore-queue-gate.md`.

Do not install real descriptors, mutate `_valueTracker`, dispatch change
events, or claim controlled-input compatibility.

Verification: run JS syntax checks, focused resource/form and controlled-input
tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
