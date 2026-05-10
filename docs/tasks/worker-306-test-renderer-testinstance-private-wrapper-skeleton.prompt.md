You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private ReactTestInstance wrapper skeleton backed by committed fiber inspection metadata. It should expose deterministic private records for root/type/props/children queries while public `renderer.root` and query methods remain blocked.

Write scope:
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `worker-progress/worker-306-test-renderer-testinstance-private-wrapper-skeleton.md`

Context to inspect:
Workers 235, 267, 291, and `private_fiber_inspection` Rust tests.

Constraints:
- No public TestInstance object yet.
- No compatibility claim and no native bridge loading.
- Keep package surface keys stable.

Verification:
- `node --check` for touched JS files
- Focused react-test-renderer create routing and serialization gate tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
