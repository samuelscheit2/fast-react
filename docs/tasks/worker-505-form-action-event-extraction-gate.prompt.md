You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add a private React DOM form action event-extraction metadata gate that consumes
the accepted worker 492 submit/requestSubmit action metadata shape without
creating SyntheticEvents, FormData, actions, transitions, or public form
compatibility.

Write scope:
- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
- `tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `worker-progress/worker-505-form-action-event-extraction-gate.md`

Constraints:
- No real form element inspection.
- No SyntheticEvent or FormData construction.
- No action invocation, host transition, reset queueing, or public root work.
- Preserve resource and controlled diagnostics from workers 490-492.

Verification:
- Run syntax checks for touched JS/MJS.
- Run `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`.
- Run `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`.
- Run `npm run check --workspace @fast-react/react-dom`.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
