# Worker 430: React DOM Event Propagation/Error Diagnostics

Objective: add private diagnostics for propagation stop and listener error
routing in root-output event invocation canaries while keeping public event
dispatch blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 170, 339, 370, 397, 401, and 429 if
present.

Write scope: `packages/react-dom/src/events`,
`packages/react-dom/src/client/root-bridge.js`, focused event tests, focused
conformance tests if needed, and
`worker-progress/worker-430-react-dom-event-propagation-error-diagnostics.md`.

Do not change SyntheticEvent shape fields unless needed for this diagnostic,
hydration replay, portal retargeting, or public event compatibility.

Verification: run JS syntax checks for touched files, focused React DOM event
tests, `npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
