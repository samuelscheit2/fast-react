# Worker 586: Scheduler PostTask Root Continuation Link

## Objective

Link private Scheduler postTask delay/abort diagnostics to a root continuation
metadata row without executing renderer work.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 551 refreshed postTask delay/abort behavior. This task should add a
private root-continuation-facing row.

## Write Scope

- `packages/scheduler/src/scheduler-post-task.js`
- `packages/scheduler/test/scheduler-post-task.test.js`
- `tests/conformance/test/scheduler-variant-oracle.test.mjs` only for focused
  metadata assertions
- `worker-progress/worker-586-scheduler-posttask-root-continuation-link.md`

Avoid React DOM, test-renderer, native, and Rust files.

## Requirements

- Record delay, abort signal, continuation id, priority label, and blocked root
  execution metadata.
- Preserve existing abort-before-run and delay ordering behavior.
- Keep public scheduler compatibility claims false.
- Reject missing signal, stale continuation, and unsupported priority records.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `npm run check --workspace @fast-react/scheduler`
- `node --test packages/scheduler/test/scheduler-post-task.test.js`
- `git diff --check`
