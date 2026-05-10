You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a fail-closed JS gate around `@fast-react/react-test-renderer` `create()` routing prerequisites, proving the placeholder shell detects missing Rust/native bridge and serialization support deterministically without enabling real rendering, update, unmount, `act`, Scheduler, or compatibility claims.

Write scope:
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- Focused smoke/conformance tests for react-test-renderer placeholder routing
- `worker-progress/worker-237-react-test-renderer-js-create-routing-gate.md`

Context to inspect:
Workers 083, 084, 085, 087, 178, 202, 210, 236.

Constraints:
- You are not alone in the codebase. Worker 258 may touch package-surface snapshots; coordinate by keeping behavior changes explicit.
- Do not load native/Rust code or implement real create/update/unmount behavior.
- Preserve accepted package shape and fail-closed error metadata.

Verification:
- `node --check` for touched JS files
- Focused react-test-renderer smoke/conformance tests
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
