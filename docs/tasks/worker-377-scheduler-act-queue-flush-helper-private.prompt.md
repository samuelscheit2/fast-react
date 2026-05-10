# Worker 377: Scheduler Act Queue Flush Helper Private

Objective: add private Scheduler/act queue flush helper diagnostics that drain
only accepted internal test queues, with explicit blockers for public Scheduler
timing and public React act behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 120, 125, 126, 164, 176, 277, 335, and
366 if present.

Write scope: `packages/scheduler/unstable_mock.js`,
`packages/scheduler/cjs/scheduler-unstable_mock.development.js`,
`packages/scheduler/cjs/scheduler-unstable_mock.production.js`,
`packages/react/private-act-dispatcher-gate.js`,
`tests/conformance/test/scheduler-mock-oracle.test.mjs`,
`tests/conformance/test/react-act-oracle.test.mjs`, focused tests, and
`worker-progress/worker-377-scheduler-act-queue-flush-helper-private.md`.

Do not claim public Scheduler or React `act` compatibility.

Verification: run JS syntax checks, focused scheduler/react-act tests,
`npm run check:js`, and `git diff --check`.
