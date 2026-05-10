You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private fake-DOM applier gate for the accepted style and `dangerouslySetInnerHTML` payload records, proving deterministic set/remove style and innerHTML application without public roots, browser DOM, hydration, events, text-content scenario admission, or compatibility claims.

Write scope:
- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/src/dom-host/mutation.js`
- Focused DOM property/style/dangerous HTML tests
- `worker-progress/worker-242-dom-style-dangerous-html-applier-gate.md`

Context to inspect:
Workers 062, 154, 186, 201, 212, 213, 238.

Constraints:
- You are not alone in the codebase. Worker 238 owns ordinary attribute payload application; avoid broad rewrites.
- Keep the applier private and fake-DOM focused.
- Preserve fail-closed handling for unsupported style/dangerous HTML shapes.

Verification:
- `node --check` for touched JS files
- Focused property payload tests
- Focused DOM mutation smoke if changed
- `node --test tests/conformance/test/dom-text-content-oracle.test.mjs`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
