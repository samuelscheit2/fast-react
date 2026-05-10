# Worker 583: Hydration Replay Target Dispatch Link

## Objective

Connect hydration replay target-resolution diagnostics to private event dispatch
path metadata while replay and dispatch remain blocked.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 545 and earlier hydration/event workers accepted replay ownership and
event target records. This task should add a bridge diagnostic.

## Write Scope

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/test/hydration-private.test.js`
- `tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `worker-progress/worker-583-hydration-replay-target-dispatch-link.md`

Avoid controlled input, resource/form, test-renderer, scheduler, and native
files.

## Requirements

- Record hydratable target lookup, owner boundary, event path, and dispatch
  blocker metadata for one replay candidate.
- Keep replay queue draining, event dispatch, hydration mutation, and public
  compatibility blocked.
- Reject stale replay queue entries, missing dehydrated ownership, and foreign
  dispatch path records.
- Preserve existing hydration replay ordering tests.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/hydration-private.test.js`
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
