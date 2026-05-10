You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Refresh the `react-dom/test-utils.act` private routing gate after accepted React act, scheduler act, sync flush, and root bridge metadata. Keep public test-utils act fail-closed while recording exactly which private prerequisites are now present.

Write scope:
- `packages/react-dom/test-utils.js`
- `packages/react-dom/src/test-utils-act-gate.js`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `worker-progress/worker-322-react-dom-test-utils-act-private-routing-gate.md`

Context to inspect:
Workers 253, 254, 277, 285, 290, 303 if present, and React DOM test-utils act oracle tests.

Constraints:
- Public `react-dom/test-utils.act` remains blocked/deprecated as currently accepted.
- No queued work, passive effects, or renderer roots execution.
- Preserve package surface and deprecation-warning behavior.

Verification:
- `node --check` for touched JS files
- Focused React act and React DOM test-utils act tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
