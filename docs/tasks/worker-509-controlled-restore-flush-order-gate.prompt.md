You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private controlled restore queue write/flush ordering diagnostics for
accepted text/select/textarea/checkbox/radio restore metadata while keeping
actual wrapper execution, value tracking writes, and live DOM control behavior
blocked.

Write scope:
- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-509-controlled-restore-flush-order-gate.md`

Constraints:
- Do not write `_valueTracker`, checked/value properties, or descriptors.
- Do not query radio groups or call wrapper restore functions.
- Preserve metadata from workers 431, 462, and 490.

Verification:
- Run syntax checks.
- Run package resource/form/controlled tests.
- Run controlled input conformance.
- Run React DOM workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
