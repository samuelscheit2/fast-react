You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private react-test-renderer act scheduler gate that recognizes accepted Scheduler mock flush-helper metadata and root/sync-flush act records, without executing public `act` behavior.

Write scope:
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-308-test-renderer-act-scheduler-private-gate.md`

Context to inspect:
Workers 268, 280, 285, 290, and Scheduler mock oracle tests.

Constraints:
- Development public `act` remains blocked; production absence remains unchanged.
- No queued work execution and no renderer roots compatibility claim.
- Keep package surface guard passing.

Verification:
- `node --check` for touched JS files
- Focused react-test-renderer act/create tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
