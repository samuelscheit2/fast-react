You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add private portal root boundary records that connect accepted `createPortal` object shape to the root bridge fail-closed portal diagnostics, without rendering portal children or installing listeners on portal containers.

Write scope:
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/events/root-listeners.js`
- `tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `worker-progress/worker-315-dom-portal-private-root-boundary-records.md`

Context to inspect:
Workers 181, 243, 270, 288, and 310 if present.

Constraints:
- Public root render portal scenarios remain blocked.
- No portal child reconciliation, DOM mutation, or event listener installation.
- Preserve `createPortal` public object behavior.

Verification:
- `node --check` for touched JS files
- Focused portal/root render gate tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
