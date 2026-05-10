# Worker 492: Form Submit Action Metadata Gate

Objective: add private form diagnostics for submit/requestSubmit action metadata
and reset-dispatcher ordering without inspecting real form elements.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 461 and resource/form oracle reports
if present.

Write scope: `packages/react-dom/src/resource-form-gates.js`,
`packages/react-dom/src/resource-form-internals-gate.js`, focused form tests,
conformance form gates if needed, and
`worker-progress/worker-492-form-submit-action-metadata-gate.md`.

Do not implement public form actions, inspect live forms, or dispatch real
resets.

Verification: run focused React DOM resource/form tests,
`npm run check --workspace @fast-react/react-dom`, focused form conformance
tests if touched, and `git diff --check`.
