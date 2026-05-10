# Worker 461: Form Action Reset Dispatcher Gate

Objective: add a private form action/reset dispatcher gate that records
submission and reset intent metadata without inspecting real forms or invoking
actions.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 172, 399, 431, 432, and 460 if
present.

Write scope: `packages/react-dom/src/resource-form-gates.js`,
`packages/react-dom/src/resource-form-internals-gate.js`,
`tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`, focused
tests, and
`worker-progress/worker-461-form-action-reset-dispatcher-gate.md`.

Do not invoke actions, reset real DOM forms, or claim form compatibility.

Verification: run focused resource/form tests, focused form conformance tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
