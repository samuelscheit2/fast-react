# Worker 494: Scheduler postTask Abort Diagnostics

Objective: extend private `unstable_post_task` diagnostics for TaskController
abort ordering and continuation fallback metadata without claiming browser
postTask compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 470 plus scheduler post-task oracle
reports if present.

Write scope: `packages/scheduler/unstable_post_task.js`,
focused scheduler post-task tests, conformance post-task gates if needed, and
`worker-progress/worker-494-scheduler-post-task-abort-diagnostics.md`.

Do not claim native browser scheduler compatibility.

Verification: run focused scheduler tests, `npm run check --workspace
scheduler`, focused post-task conformance tests if touched, and `git diff
--check`.
