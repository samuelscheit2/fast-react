You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Tighten the public React `useState`/`useReducer` private dispatcher gate with lane/update metadata names aligned to accepted reconciler hook queue records, without exposing a public hook implementation, DOM/test-renderer integration, or compatibility claims.

Write scope:
- `packages/react/hook-dispatcher.js`
- `packages/react/index.js`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `worker-progress/worker-278-react-state-hook-private-dispatcher-lane-gate.md`

Context to inspect:
Workers 158, 200, 220, 223, 248, 251.

Constraints:
- Invalid-hook-call boundaries must remain.
- Only marked private dispatchers may receive calls.
- Do not wire Rust hooks to JS.

Verification:
- `node --check` for touched JS files
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
