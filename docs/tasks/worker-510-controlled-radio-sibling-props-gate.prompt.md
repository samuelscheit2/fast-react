You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private controlled radio sibling-props lookup diagnostics that prove the
intended same-name/same-form sibling metadata shape without DOM queries,
wrapper execution, or public controlled radio compatibility.

Write scope:
- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/src/dom-host/property-payload.js` only if needed for
  existing blocked radio payload metadata
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-510-controlled-radio-sibling-props-gate.md`

Constraints:
- No `querySelectorAll`, form traversal, live props lookup, or tracker refresh.
- Keep records primitive/frozen/redacted.
- Preserve accepted checkbox/radio group intent rows.

Verification:
- Run syntax checks.
- Run package resource/form/controlled tests.
- Run controlled input conformance and DOM property payload tests if touched.
- Run React DOM workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
