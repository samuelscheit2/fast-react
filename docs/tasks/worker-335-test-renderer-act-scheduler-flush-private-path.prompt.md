# Worker 335: Test Renderer Act Scheduler Flush Private Path

Objective: refresh the private react-test-renderer `act` gate after accepted
scheduler, sync-flush, passive, and root metadata so it can record the next
private flush prerequisites without opening public `act`.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 176, 255, 268, 277, 285, 303, 308,
322, and 331 if present.

Write scope: `packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
`tests/conformance/test/react-test-renderer-act-oracle.test.mjs`, focused
tests, and
`worker-progress/worker-335-test-renderer-act-scheduler-flush-private-path.md`.

Keep public act compatibility and scheduler flushing claims false.

Verification: run JS syntax checks, focused react-test-renderer act tests,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
