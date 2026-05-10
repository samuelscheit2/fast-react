You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private `toJSON` serialization facade gate for react-test-renderer JS that recognizes the accepted Rust private JSON diagnostics but does not expose public serialization or claim compatibility.

Write scope:
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `worker-progress/worker-305-test-renderer-tojson-private-serialization-facade.md`

Context to inspect:
Workers 265, 267, 291, and Rust private JSON serialization canary tests.

Constraints:
- Public `create().toJSON` still throws.
- No native bridge or Rust execution from JS.
- Keep local gate ready for private diagnostics but public compatibility blocked.

Verification:
- `node --check` for touched JS files
- Focused serialization local gate tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
