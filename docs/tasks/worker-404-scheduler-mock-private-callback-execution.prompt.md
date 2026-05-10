# Worker 404: Scheduler Mock Private Callback Execution

Objective: extend the private Scheduler mock act queue diagnostic so it can
execute only branded internal test callbacks and record continuations without
changing public Scheduler timing behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 120, 255, 377, and 390 if present.

Write scope: `packages/scheduler/cjs/scheduler-unstable_mock.development.js`,
`packages/scheduler/cjs/scheduler-unstable_mock.production.js`,
`packages/react/private-act-dispatcher-gate.js`,
`tests/conformance/test/scheduler-mock-oracle.test.mjs`, and
`worker-progress/worker-404-scheduler-mock-private-callback-execution.md`.

Do not add public Scheduler export keys or claim host timing compatibility.

Verification: run JS syntax checks, focused scheduler mock and React act tests,
`npm run check:js`, and `git diff --check`.
