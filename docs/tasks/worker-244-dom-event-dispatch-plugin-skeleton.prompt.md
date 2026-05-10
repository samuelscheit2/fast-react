You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private React DOM event dispatch/plugin extraction skeleton that accepts existing listener wrapper metadata and produces deterministic fail-closed dispatch records, without invoking user listeners, bubbling through component trees, hydration replay, controlled restore, public root behavior, or compatibility claims.

Write scope:
- `packages/react-dom/src/events/*`
- Focused event smoke/conformance tests
- `worker-progress/worker-244-dom-event-dispatch-plugin-skeleton.md`

Context to inspect:
Workers 048, 065, 170, 171, 216, and React DOM event delegation oracle files.

Constraints:
- You are not alone in the codebase. Worker 259 may touch component-tree maps; consume only stable private APIs.
- Do not dispatch real events to user callbacks.
- Keep public roots and listener installation placeholders unchanged.

Verification:
- `node --check` for touched JS files
- Focused event/root listener tests
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
