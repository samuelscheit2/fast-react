# Worker 550 Scheduler Mock Frame Budget Gate

## Goal

- Active goal status from `get_goal`: `active`
- Objective: Add private `scheduler/unstable_mock` frame-budget diagnostics for `unstable_shouldYield`, `unstable_requestPaint`, and yield log ordering without claiming public Scheduler timing compatibility.

## Summary

- Added private frame-budget diagnostics to `packages/scheduler/unstable_mock.js`.
- New diagnostics expose a branded frozen `fast-react.scheduler.mock-frame-budget-diagnostics` record through the existing private flush-helper diagnostics object.
- The diagnostic records virtual mock time, requested-paint state, yield-log values and ordering, pending task summaries, and the derived mock `unstable_shouldYield` decision.
- The `unstable_shouldYield` decision is derived from private mock state instead of invoking `unstable_shouldYield`, avoiding its `didStop` mutation side effect.
- `requestPaintFrameBudgetForDiagnostics()` invokes `unstable_requestPaint` through the existing private request-paint diagnostic path and records that no Scheduler tasks or React act queues were drained.
- Public Scheduler timing, frame interval, wall-clock timing, and React act compatibility claims remain false.

## Changed Files

- `packages/scheduler/unstable_mock.js`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `worker-progress/worker-550-scheduler-mock-frame-budget-gate.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Confirmed the local React reference mock uses deterministic mock state for `shouldYieldToHost`: expected yield count gates or `shouldYieldForPaint && needsPaint`; it is not a public frame-interval timing model.
- Confirmed `unstable_requestPaint` sets the mock `needsPaint` flag and does not execute scheduled work.
- Confirmed `unstable_shouldYield` can set `didStop` when it returns true, so the new diagnostic derives the decision without invoking it.
- Existing private yield/paint diagnostics from worker 493 are preserved and extended only at the top-level `unstable_mock.js` wrapper.

## Commands Run

- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `npm run check --workspace scheduler`
- `git diff --check`

## Verification Result

- Focused scheduler mock oracle: passed.
- Scheduler workspace check: passed.
- Whitespace check: passed.

## Risks Or Blockers

- No blockers.
- The new yield-log ordering tracker is wrapper-local. It records logs made through the public `scheduler/unstable_mock` wrapper, which is the private diagnostic surface under test.
- A nested explorer was spawned for reference checking but did not return usable content; conclusions are based on direct inspection of `/Users/user/Developer/Developer/react-reference/packages/scheduler/src/forks/SchedulerMock.js`.

## Recommended Next Tasks

- Keep public Scheduler timing compatibility blocked until the root Scheduler timing behavior is explicitly admitted.
- If react-test-renderer later routes this frame-budget record, add an act-side recognition gate for `fast-react.scheduler.mock-frame-budget-diagnostics`.
