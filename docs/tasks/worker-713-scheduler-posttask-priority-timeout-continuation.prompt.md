# Worker 713: Scheduler postTask Priority Timeout Continuation

Objective: add private Scheduler postTask evidence for priority, timeout, delayed continuation, and abort ordering that can be consumed by act/root handoff metadata without broad browser compatibility claims.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `packages/scheduler/cjs/scheduler-unstable_post_task.development.js`, `packages/scheduler/cjs/scheduler-unstable_post_task.production.js` only if parity is required, scheduler postTask conformance tests, and `worker-progress/worker-713-scheduler-posttask-priority-timeout-continuation.md`.

Constraints: do not edit React DOM, test-renderer, or reconciler Rust. Preserve current public scheduler/postTask package shape.

Verification: focused scheduler postTask conformance, `npm run check --workspace scheduler`, `npm run check:package-surface` if exports/surface change, conflict-marker scan, and `git diff --check`.
