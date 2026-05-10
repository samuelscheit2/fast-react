# Worker 585 Scheduler Mock Expired Lane Flush

## Goal

- Active goal status from `get_goal`: `active`
- Objective: Add Scheduler mock diagnostics that tie expired callback flushing to accepted lane-priority/root-scheduler metadata without running renderer work publicly.

## Scope Notes

- The prompt names `packages/scheduler/src/scheduler-mock.js` and
  `packages/scheduler/test/scheduler-mock.test.js`. This checkout has no
  scheduler `src/` file; the accepted mock implementation lives at
  `packages/scheduler/unstable_mock.js`, matching prior scheduler mock workers.
- The package workspace name is `scheduler`, not `@fast-react/scheduler`.
- No nested managed agents were spawned.

## Summary

- Added private expired-lane flush diagnostics to the top-level
  `scheduler/unstable_mock` wrapper without adding public module export keys.
- The existing private `drainExpiredMockSchedulerWork` helper now accepts
  branded lane-priority/root-scheduler metadata as an optional private argument;
  the no-argument path still delegates to the accepted expired-work drain.
- Accepted metadata records scheduler priority, callback priority level, virtual
  time, frame-budget decision, lane label, root/lane metadata kind, and callback
  handle identity before draining the expired mock callback.
- The metadata drain rejects unsupported priority levels, stale/cancelled
  callback handles, unbranded expired callbacks, ambiguous expired callback
  sets, public compatibility claims, and renderer-work execution claims before
  any callback runs.
- Added package-local tests for development and production mock entrypoints.

## Changed Files

- `packages/scheduler/unstable_mock.js`
- `packages/scheduler/test/scheduler-mock.test.js`
- `worker-progress/worker-585-scheduler-mock-expired-lane-flush.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 535, 550, 518, 469, and 280 to align with accepted lane
  scheduling, frame-budget, expired-work, and package-surface constraints.
- Confirmed worker 535 accepted distinct sync/default lane-priority metadata
  while callback execution and public batching compatibility remained blocked.
- Confirmed the current scheduler mock wrapper is the active implementation
  surface for private diagnostics and already carries expired-work and
  frame-budget diagnostics from prior workers.

## Commands Run

- `node --check packages/scheduler/unstable_mock.js` - passed.
- `node --check packages/scheduler/test/scheduler-mock.test.js` - passed.
- `node --test packages/scheduler/test/scheduler-mock.test.js` - passed,
  3 tests.
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` -
  passed, 19 tests.
- `npm run check --workspace scheduler` - passed.
- `git diff --cached --check` - passed after staging accepted files.
- `git diff --check` - passed.
- `npm run check --workspace @fast-react/scheduler` - failed because no
  workspace with that name exists in this checkout.
- `npm run check:package-surface` - extra check, failed on unrelated tracked
  React DOM inventory drift: `packages/react-dom/src/shared/form-actions.js`.

## Risks Or Blockers

- No blocker remains in this worker scope.
- The new private drain path executes only accepted branded internal test
  callbacks. Public renderer callback execution, public act draining, Scheduler
  timing compatibility, and root scheduler compatibility claims remain false.
- The broader package-surface failure is outside this worker's write scope and
  was not changed.

## Recommended Next Tasks

- Add a producer-side bridge later if root scheduler JS metadata begins
  emitting the same branded expired-lane flush metadata shape.
- Keep public scheduler/act compatibility blocked until renderer roots and
  public work draining have separate accepted gates.
