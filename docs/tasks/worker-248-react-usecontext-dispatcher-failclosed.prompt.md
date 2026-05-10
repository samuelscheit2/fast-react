You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a public React `useContext` dispatcher fail-closed surface that forwards only to a marked private context dispatcher and otherwise preserves invalid-hook-call behavior, without wiring reconciler context reads, React DOM, native, or compatibility claims.

Write scope:
- `packages/react/src/*`
- `packages/react/react-server.js` if needed for shared hook export parity
- Focused React hook/context tests
- `worker-progress/worker-248-react-usecontext-dispatcher-failclosed.md`

Context to inspect:
Workers 028, 180, 182, 220, 221, 222, 247.

Constraints:
- You are not alone in the codebase. Worker 251 may edit hook dispatcher code; keep changes surgical and tests explicit.
- Do not wire real reconciler context propagation.
- Preserve existing `useState`/`useReducer` private dispatcher behavior.

Verification:
- `node --check` for touched JS files
- Focused React hook dispatcher/context tests
- `node --test tests/conformance/test/context-object-oracle.test.mjs`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
