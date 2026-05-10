# Worker 493: Scheduler Mock Yield/Paint Gate

Objective: add private Scheduler mock diagnostics for yielded values,
`unstable_requestPaint`, and continuation ordering while keeping public mock
compatibility scoped to existing accepted behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 404, 436, 469, and scheduler mock
oracle reports if present.

Write scope: `packages/scheduler/src/unstable_mock.js`,
`packages/scheduler/unstable_mock-flush-helpers.js`, focused scheduler tests,
conformance scheduler mock gates if needed, and
`worker-progress/worker-493-scheduler-mock-yield-paint-gate.md`.

Do not broaden public Scheduler mock compatibility claims.

Verification: run focused scheduler tests, `npm run check --workspace
scheduler`, focused scheduler conformance tests if touched, and `git diff
--check`.
