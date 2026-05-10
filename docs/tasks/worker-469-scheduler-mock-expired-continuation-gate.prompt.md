# Worker 469: Scheduler Mock Expired Continuation Gate

Objective: extend scheduler mock private diagnostics so expired callbacks and
continuations drain in React-observed order while cancelled tombstones and
priority context remain deterministic.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 120, 164, 377, 404, 436, and 449 if
present.

Write scope: `packages/scheduler/cjs/scheduler-unstable_mock.development.js`,
`packages/scheduler/cjs/scheduler-unstable_mock.production.js`,
`tests/conformance/src/scheduler-mock-oracle.mjs`, focused scheduler tests, and
`worker-progress/worker-469-scheduler-mock-expired-continuation-gate.md`.

Do not claim broad scheduler compatibility or change root scheduler Rust
behavior.

Verification: run focused scheduler mock tests, `npm run check --workspace
scheduler`, focused scheduler mock conformance tests if touched, and `git diff
--check`.
