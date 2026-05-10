# Worker 551: Scheduler postTask Delay Abort Refresh

## Objective

Refresh private `scheduler/unstable_post_task` diagnostics for delay plus abort
ordering in controlled shim environments without claiming browser postTask
compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted postTask priority, abort, and environment diagnostics.

## Write Scope

- `packages/scheduler/unstable_post_task.js`
- Scheduler postTask conformance tests
- `worker-progress/worker-551-scheduler-post-task-delay-abort-refresh.md`

## Requirements

- Record delay, priority, abort signal state, continuation status, and fallback
  environment classification.
- Keep browser scheduler execution and compatibility claims blocked.

## Verification

- Focused scheduler postTask conformance tests
- `npm run check --workspace scheduler`
- `git diff --check`

