You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a fail-closed conformance gate for private DOM HostText commit behavior, comparing only implemented fake-DOM text create/update/delete/reset rows and explicitly skipping public roots, server rendering, unsupported text-content scenarios, hydration, and compatibility claims.

Write scope:
- `tests/conformance/src/dom-text-content-conformance-gate.mjs`
- New/focused DOM HostText commit gate script/test if needed
- `tests/conformance/package.json` if adding a script
- `packages/react-dom/src/dom-host/mutation.js` only for metadata needed by the gate
- `worker-progress/worker-261-dom-host-text-commit-conformance-gate.md`

Context to inspect:
Workers 110, 154, 201, 211, 212, 230, 241.

Constraints:
- You are not alone in the codebase. Worker 241 owns predicate gaps and worker 238/242 may touch mutation helpers.
- Gate only implemented private fake-DOM rows; keep compatibility false.
- Do not wire public roots.

Verification:
- `node --check` for touched JS files
- Focused HostText/text-content gate command
- `node --test tests/conformance/test/dom-text-content-oracle.test.mjs`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
