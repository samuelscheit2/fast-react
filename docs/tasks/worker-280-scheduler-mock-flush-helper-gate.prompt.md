You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add focused scheduler mock flush-helper gate coverage that proves the accepted mock Scheduler shell exposes deterministic helper metadata for react-test-renderer while keeping broad Scheduler compatibility and renderer work execution scoped to existing oracle rows.

Write scope:
- `packages/scheduler/src/unstable_mock.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.production.js`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `worker-progress/worker-280-scheduler-mock-flush-helper-gate.md`

Context to inspect:
Workers 120, 164, 255, 268.

Constraints:
- Do not change scheduler root/native/post-task behavior.
- No renderer execution.
- Keep compatibility claims scoped to checked oracle rows.

Verification:
- `node --check` for touched JS files
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
