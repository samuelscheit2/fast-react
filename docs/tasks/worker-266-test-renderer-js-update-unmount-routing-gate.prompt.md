You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Extend the `react-test-renderer` JS create shell routing gate with explicit update and unmount private-routing metadata that points at accepted Rust canaries, while every public behaviorful surface still throws deterministic unimplemented errors and no native/Rust bridge is loaded.

Write scope:
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-266-test-renderer-js-update-unmount-routing-gate.md`

Context to inspect:
Workers 210, 234, 237, 255, 258.

Constraints:
- Preserve package export keys and mock Scheduler shell.
- Keep public update/unmount/serialization behavior fail-closed.
- Do not load native artifacts.

Verification:
- `node --check` for touched JS files
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:package-surface`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
