You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private controlled input value-tracker gate that records deterministic tracker metadata for input/select/textarea scenarios while public controlled form behavior and post-event restore remain blocked.

Write scope:
- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `worker-progress/worker-317-controlled-input-value-tracker-private-gate.md`

Context to inspect:
Workers 172, 213, 260, 271, and 276.

Constraints:
- No live value tracking, event restore, or public controlled behavior.
- Ordinary property payload helper must still reject controlled props.
- Keep compatibility claims false.

Verification:
- `node --check` for touched JS files
- Focused resource/form and DOM property payload tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
