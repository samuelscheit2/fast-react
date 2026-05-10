# Worker 490: Controlled Checkbox/Radio Restore Gate

Objective: add private controlled-input diagnostics for checkbox and radio
restore metadata, including group intent records, without live DOM control
compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 431, 462, and DOM controlled-input
oracle reports if present.

Write scope: `packages/react-dom/src/client/controlled-restore-queue.js`,
`packages/react-dom/src/dom-host/property-payload.js`, focused controlled-input
tests, conformance controlled gates if needed, and
`worker-progress/worker-490-controlled-checkbox-radio-restore-gate.md`.

Do not mutate live form controls or claim public controlled-input
compatibility.

Verification: run focused React DOM controlled-input tests,
`npm run check --workspace @fast-react/react-dom`, focused controlled
conformance tests if touched, and `git diff --check`.
