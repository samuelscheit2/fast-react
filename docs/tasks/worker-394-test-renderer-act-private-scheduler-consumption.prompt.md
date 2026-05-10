# Worker 394: Test Renderer Act Private Scheduler Consumption

Objective: make the private react-test-renderer act gate consume accepted
Scheduler/React act queue diagnostics without executing public act callbacks or
claiming public compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 255, 280, 308, 331, 366, 377, and 390
if present.

Write scope: `packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
`tests/conformance/test/react-test-renderer-act-oracle.test.mjs`, focused act
tests, and
`worker-progress/worker-394-test-renderer-act-private-scheduler-consumption.md`.

Keep public `act` and renderer effect execution blocked.

Verification: run JS syntax checks, focused react-test-renderer act tests,
`node --test tests/conformance/test/scheduler-mock-oracle.test.mjs`,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
