# Worker 581: DOM Change Event Controlled Restore Link

## Objective

Link private input/change event extraction preflight records to controlled
restore queue preflight metadata without dispatching events or mutating DOM.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 543, 547, and 548 added input/change extraction and controlled restore
write/flush blockers. This task should connect those metadata gates.

## Write Scope

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/events-private.test.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-581-dom-change-event-controlled-restore-link.md`

Avoid React core, scheduler, native, and test-renderer files.

## Requirements

- Record a private bridge row from input/change extraction to controlled restore
  latest-props evidence.
- Keep event dispatch, value tracker writes, restore queue writes/flushes, and
  DOM mutation blocked.
- Preserve existing focus/blur, portal, and controlled restore tests.
- Reject foreign event records, unsupported input types, and stale restore queue
  preflights.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/events-private.test.js`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
