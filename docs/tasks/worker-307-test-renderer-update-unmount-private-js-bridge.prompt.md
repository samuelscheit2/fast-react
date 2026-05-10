You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Extend the private react-test-renderer JS root bridge with update and unmount request records that match the accepted Rust `TestRendererRoot` lifecycle diagnostics. Keep public `update()` and `unmount()` methods fail-closed.

Write scope:
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-307-test-renderer-update-unmount-private-js-bridge.md`

Context to inspect:
Workers 234, 266, 304 if present, and Rust test-renderer root lifecycle tests.

Constraints:
- No native loading or Rust execution from JS.
- Public route availability flags remain false.
- Preserve update/unmount private route metadata accepted by worker 266.

Verification:
- `node --check` for touched JS files
- Focused react-test-renderer create routing gate
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
