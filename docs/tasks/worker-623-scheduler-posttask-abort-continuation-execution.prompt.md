# Worker 623: Scheduler postTask Abort Continuation Execution

## Objective

Extend private postTask diagnostics to cover abort ordering around one accepted
root continuation without exposing browser postTask compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 586 and 551 added postTask root continuation and abort diagnostics.

## Write Scope

- `packages/scheduler/cjs/scheduler-unstable_post_task.*.js`
- `packages/scheduler/unstable_post_task.js`
- Existing scheduler postTask conformance tests
- `worker-progress/worker-623-scheduler-posttask-abort-continuation-execution.md`

Do not add tests under `packages/scheduler/test`; keep conformance tests outside
the package physical surface.

## Requirements

- Add private postTask metadata for signal validation, abort ordering, and
  continuation fallback around one accepted root continuation record.
- Reject missing signals, stale continuations, unsupported priority records, and
  public compatibility claims.
- Keep package public exports unchanged.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `git diff --check`
