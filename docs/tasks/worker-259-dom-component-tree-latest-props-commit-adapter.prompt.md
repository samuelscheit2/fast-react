You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private DOM component-tree latest-props commit adapter that consumes safe mutation/payload records to update hidden latest-props maps for fake host nodes, without public roots, event dispatch, hydration replay, ref behavior, real DOM mutation claims, or compatibility claims.

Write scope:
- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/dom-host/mutation.js`
- Focused smoke tests for component-tree/latest-props behavior
- `worker-progress/worker-259-dom-component-tree-latest-props-commit-adapter.md`

Context to inspect:
Workers 065, 168, 212, 214, 216, 238, 244.

Constraints:
- You are not alone in the codebase. Workers 238/242 may edit mutation helpers and worker 244 may consume component-tree maps.
- Keep all helpers private and fake-DOM/test scoped.
- Do not invoke event dispatch or public root behavior.

Verification:
- `node --check` for touched JS files
- `node tests/smoke/react-dom-component-tree-map-shell.mjs`
- Relevant focused smoke test if added
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
