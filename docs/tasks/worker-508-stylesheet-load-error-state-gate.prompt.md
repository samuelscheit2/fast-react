You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private stylesheet load/error state diagnostics that model the metadata
shape React tracks around stylesheet resources, without installing real
listeners, fetching stylesheets, suspending commits, or exposing public resource
compatibility.

Write scope:
- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `worker-progress/worker-508-stylesheet-load-error-state-gate.md`

Constraints:
- Use deterministic fake records only.
- Do not use real timers, network, DOM events, `load`, or `error` listeners.
- Keep data redacted and compatibility false.

Verification:
- Run syntax checks.
- Run package resource/form tests.
- Run resource hints conformance.
- Run React DOM workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
