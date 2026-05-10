You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a package-private React `act` dispatcher marker gate that can recognize accepted internal act queue metadata while public `React.act` remains blocked until renderer roots, passive effects, and continuation flushing are ready.

Write scope:
- `packages/react/index.js`
- `packages/react/cjs/react.development.js`
- `packages/react/cjs/react.production.js`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `worker-progress/worker-277-react-act-queue-private-dispatcher-gate.md`

Context to inspect:
Workers 176, 252, 253, 254.

Constraints:
- Public `act` compatibility remains false.
- Do not execute queued work or effects.
- Preserve hook dispatcher guard behavior.

Verification:
- `node --check` for touched JS files
- `node --test tests/conformance/test/react-act-oracle.test.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
