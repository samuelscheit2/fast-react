You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add a private controlled restore queue write preflight that builds on worker
509 restore ordering metadata. The preflight should validate queueable
text/select/textarea/checkbox/radio restore records and produce deterministic
write-intent rows without flushing, invoking wrappers, querying radio groups,
or mutating live DOM controls.

Write scope:
- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-533-controlled-restore-queue-write-preflight.md`

Constraints:
- Do not execute a real restore queue flush.
- Do not call wrapper restore functions or write `_valueTracker`.
- Preserve accepted workers 490 and 509 metadata.
- Other workers may touch adjacent controlled-input files; do not revert their
  changes when merging later.

Verification:
- Run syntax checks.
- Run package resource/form/controlled tests.
- Run controlled input conformance.
- Run React DOM workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
