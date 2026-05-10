You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add public React `useEffect` and related basic effect hook dispatcher fail-closed surfaces that forward only to marked private effect dispatchers and otherwise preserve invalid-hook-call behavior, without executing effects, wiring reconciler hooks, React DOM, native, or compatibility claims.

Write scope:
- `packages/react/src/*`
- `packages/react/index.js`
- `packages/react/react-server.js` if shared hook shape requires it
- Focused React hook/effect tests
- `worker-progress/worker-251-react-useeffect-dispatcher-failclosed.md`

Context to inspect:
Workers 157, 182, 220, 224, 250, and React hook oracle tests.

Constraints:
- You are not alone in the codebase. Worker 248 may edit dispatcher files; keep changes small and composable.
- Do not execute effects or claim compatibility.
- Preserve existing state hook dispatcher behavior.

Verification:
- `node --check` for touched JS files
- Focused React hook dispatcher tests
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
