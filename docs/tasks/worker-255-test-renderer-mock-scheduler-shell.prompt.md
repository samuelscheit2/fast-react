You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Tighten the `react-test-renderer` placeholder `_Scheduler` shell so its public key/throwing behavior is deterministic against accepted act/export oracles, without implementing mock Scheduler flushing, `act`, root updates, Rust routing, or compatibility claims.

Write scope:
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- Focused react-test-renderer act/export tests or smoke tests
- `worker-progress/worker-255-test-renderer-mock-scheduler-shell.md`

Context to inspect:
Workers 083, 086, 202, 210, 237, and Scheduler mock oracle workers 052/120/164.

Constraints:
- You are not alone in the codebase. Workers 237 and 258 may touch package files/snapshots.
- Throwing shell only; no Scheduler behavior.
- Preserve production `act` shape and package surface.

Verification:
- `node --check` for touched JS files
- Focused react-test-renderer export/act tests
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
