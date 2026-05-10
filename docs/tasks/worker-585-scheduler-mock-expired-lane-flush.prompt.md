# Worker 585: Scheduler Mock Expired Lane Flush

## Objective

Add Scheduler mock diagnostics that tie expired callback flushing to accepted
lane-priority/root-scheduler metadata without running renderer work publicly.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 550 and 535 refreshed mock frame-budget and lane priority diagnostics.
This task should connect expired task flushing to lane metadata.

## Write Scope

- `packages/scheduler/src/scheduler-mock.js`
- `packages/scheduler/test/scheduler-mock.test.js`
- `tests/conformance/test/scheduler-variant-oracle.test.mjs` only if the
  existing oracle gate needs a narrow metadata assertion
- `worker-progress/worker-585-scheduler-mock-expired-lane-flush.md`

Avoid React DOM, React core, test-renderer, native, and Rust files.

## Requirements

- Record expired callback priority, virtual time, frame budget, and lane label
  metadata for the private mock flush helper.
- Keep actual renderer work, public act drain, and compatibility claims blocked.
- Preserve existing postTask/mock/yield/paint tests.
- Reject unsupported priority levels and stale callback handles.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `npm run check --workspace @fast-react/scheduler`
- `node --test packages/scheduler/test/scheduler-mock.test.js`
- `git diff --check`
