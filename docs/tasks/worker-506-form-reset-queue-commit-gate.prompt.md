You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private form reset queue and commit-order metadata diagnostics downstream of
worker 492, proving reset intent can be recorded through queue and commit
boundaries without calling `form.reset()` or enabling public form actions.

Write scope:
- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
- `worker-progress/worker-506-form-reset-queue-commit-gate.md`

Constraints:
- Do not inspect real forms or call previous dispatchers.
- Do not queue real React updates or commit real DOM resets.
- Keep all compatibility claims false.
- Preserve resource stylesheet and controlled-input diagnostics.

Verification:
- Run syntax checks for touched JS/MJS.
- Run package resource/form tests.
- Run form-actions conformance.
- Run React DOM workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
