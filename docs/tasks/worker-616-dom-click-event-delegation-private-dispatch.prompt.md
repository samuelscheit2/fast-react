# Worker 616: DOM Click Event Delegation Private Dispatch

## Objective

Add a private click-event delegation dispatch gate that can route one accepted
listener record without opening public DOM event compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Use accepted listener registry, event priority, and portal owner-root blocker
metadata.

## Write Scope

- `packages/react-dom/src/events/*.js`
- `packages/react-dom/test/*.test.js`
- `tests/conformance/test/dom-event-delegation-oracle.test.mjs` if present
- `worker-progress/worker-616-dom-click-event-delegation-private-dispatch.md`

Do not edit controlled input or hydration files.

## Requirements

- Add private dispatch metadata for one click listener path from root listener
  to plugin extraction and listener invocation record.
- Reject portal owner mismatch, stale listener records, and unsupported event
  phases before callback invocation.
- Keep public event delegation compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/*.test.js`
- Any focused DOM event conformance test touched
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
