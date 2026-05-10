# Worker 550: Scheduler Mock Frame Budget Gate

## Objective

Add private `scheduler/unstable_mock` frame-budget diagnostics for
`unstable_shouldYield`, `unstable_requestPaint`, and yield log ordering without
claiming public Scheduler timing compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted scheduler mock continuation, yield/paint, flush-helper, and
expired-work diagnostics.

## Write Scope

- `packages/scheduler/unstable_mock.js`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-act-oracle.test.mjs` only if act
  diagnostics need to recognize the new private record
- `worker-progress/worker-550-scheduler-mock-frame-budget-gate.md`

## Requirements

- Record virtual time, requested paint, yield log state, frame budget decision,
  and no task execution side effects.
- Keep public Scheduler timing and React act compatibility claims false.

## Verification

- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `npm run check --workspace scheduler`
- `git diff --check`

