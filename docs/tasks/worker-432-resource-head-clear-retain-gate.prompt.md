# Worker 432: Resource Head Clear/Retain Gate

Objective: add private resource head clear/retain diagnostics for singleton and
resource hint rows, including deterministic blocked capabilities for stylesheet
precedence.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 219, 343, 374, 400, and 412 if present.

Write scope: `packages/react-dom/src`,
focused resource/form tests, focused conformance resource gates if needed, and
`worker-progress/worker-432-resource-head-clear-retain-gate.md`.

Do not dispatch public resource hints, mutate real document head, or claim
public resource/singleton compatibility.

Verification: run JS syntax checks for touched files, focused resource/form
tests, `npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
