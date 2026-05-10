# Worker 431: Controlled Input Post-Event Restore Queue

Objective: add a private post-event controlled restore queue gate that consumes
event/latest-props evidence and records deterministic restore intent without
installing live descriptors.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 317, 344, 375, 399, 397, and 428 if
present.

Write scope: `packages/react-dom/src/client`,
`packages/react-dom/src/dom-host`, focused controlled-input/resource-form tests,
focused conformance gates if needed, and
`worker-progress/worker-431-controlled-input-post-event-restore-queue.md`.

Do not write live `_valueTracker`, mutate browser inputs, or claim public
controlled input compatibility.

Verification: run JS syntax checks for touched files, focused controlled input
tests, `npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
