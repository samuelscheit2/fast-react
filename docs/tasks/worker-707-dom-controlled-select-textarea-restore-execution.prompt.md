# Worker 707: DOM Controlled Select/Textarea Restore Execution

Objective: add private React DOM controlled-restore execution evidence for admitted select and textarea fake-DOM targets, preserving blocked live DOM/value-tracker compatibility.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `packages/react-dom/src/client/controlled-restore-queue.js`, `packages/react-dom/src/client/root-bridge.js` only for admitted private metadata, `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`, controlled-input conformance files, and `worker-progress/worker-707-dom-controlled-select-textarea-restore-execution.md`.

Constraints: do not edit event dispatch, hydration, resource/form, or test-renderer files. Keep all mutations fake-DOM-only and fail-closed for live browser claims.

Verification: focused controlled-restore tests, focused controlled-input conformance, `npm run check --workspace @fast-react/react-dom`, conflict-marker scan, and `git diff --check`.
