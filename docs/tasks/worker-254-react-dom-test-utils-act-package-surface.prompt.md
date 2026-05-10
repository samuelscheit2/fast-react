You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Tighten `react-dom/test-utils.act` package-surface and fail-closed behavior against the accepted oracle, preserving deterministic placeholder metadata without implementing public `act`, DOM root flushing, effect execution, or compatibility claims.

Write scope:
- `packages/react-dom/test-utils.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/package-surface-snapshot.json`
- Focused react-dom/test-utils conformance test if needed
- `worker-progress/worker-254-react-dom-test-utils-act-package-surface.md`

Context to inspect:
Workers 054, 067, 097, 165, 231, 253.

Constraints:
- You are not alone in the codebase. Worker 253 may touch React `act` gates; do not implement flushing.
- Keep package surface snapshot updates intentional and minimal.
- Preserve public compatibility false.

Verification:
- `node --check` for touched JS files
- `npm run check:package-surface`
- Focused react-dom/test-utils act oracle tests if touched
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
