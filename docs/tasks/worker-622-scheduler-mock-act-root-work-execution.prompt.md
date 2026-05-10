# Worker 622: Scheduler Mock Act Root Work Execution

## Objective

Extend private scheduler mock diagnostics so an expired callback can hand off to
accepted act/root work metadata without flushing arbitrary renderer work.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 585 and earlier scheduler mock workers accepted expired-lane and act
queue diagnostics.

## Write Scope

- `packages/scheduler/cjs/scheduler-unstable_mock.*.js`
- `packages/scheduler/unstable_mock.js`
- Existing scheduler conformance tests
- `worker-progress/worker-622-scheduler-mock-act-root-work-execution.md`

Do not edit React DOM or Rust files.

## Requirements

- Add private scheduler mock metadata that links expired callback flushing to
  accepted root/act work records.
- Reject unbranded callbacks, stale act queues, and public compatibility claims.
- Keep public mock Scheduler behavior unchanged.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `npm run check --workspace scheduler`
- `git diff --check`
