You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private portal event error-routing diagnostics that connect accepted portal
owner-root event path metadata with the worker 488 root option error-routing
records, without enabling public portal event compatibility.

Write scope:
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/events/*`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `worker-progress/worker-514-dom-event-portal-error-routing-refresh.md`

Constraints:
- No real portal DOM bubbling, browser dispatch, global error reporting, or
  public root callback invocation.
- Keep diagnostics private and explicit about blocked behavior.

Verification:
- Run syntax checks.
- Run private root bridge package tests.
- Run event dispatch conformance.
- Run React DOM workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
