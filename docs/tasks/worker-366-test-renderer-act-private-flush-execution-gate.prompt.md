# Worker 366: Test Renderer Act Private Flush Execution Gate

Objective: refresh the react-test-renderer private act gate after accepted
sync-flush/passive/root-output diagnostics, admitting only private flush
execution metadata while keeping public `act` blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 176, 252, 277, 285, 331, 335, 348,
357, 361, and 362 if present.

Write scope: `packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
`tests/conformance/test/react-test-renderer-act-oracle.test.mjs`,
focused tests, and
`worker-progress/worker-366-test-renderer-act-private-flush-execution-gate.md`.

Do not execute public Scheduler tasks or claim public act compatibility.

Verification: run JS syntax checks, focused act/create-routing tests,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
