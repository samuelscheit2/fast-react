# Worker 470: Scheduler postTask Priority Diagnostics

Objective: add scheduler `unstable_post_task` priority diagnostics for shimmed
TaskController scheduling, cancellation, and continuation fallbacks while
keeping compatibility claims scoped.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 125, 164, 469, and scheduler oracle
reports if present.

Write scope: `packages/scheduler/cjs/scheduler-unstable_post_task.development.js`,
`packages/scheduler/cjs/scheduler-unstable_post_task.production.js`,
`tests/conformance/src/scheduler-post-task-oracle.mjs`, focused scheduler tests,
and `worker-progress/worker-470-scheduler-post-task-priority-diagnostics.md`.

Do not change default scheduler root behavior or claim browser postTask
compatibility beyond checked diagnostics.

Verification: run focused scheduler post-task tests, `npm run check --workspace
scheduler`, focused post-task conformance tests if touched, and `git diff
--check`.
