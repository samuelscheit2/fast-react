# Worker 543: DOM Input Change Event Extraction Preflight

## Objective

Add private React DOM input/change event extraction preflight diagnostics for
text input and checkbox targets without dispatching synthetic events.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted event plugin extraction, controlled restore, and broader event type
dispatch diagnostics.

## Write Scope

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/test/events-private.test.js` or the nearest existing
  focused event test
- `tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `worker-progress/worker-543-dom-input-change-event-extraction-preflight.md`

## Requirements

- Record event type, target tag/type, controlled metadata availability, and
  blocked dispatch/default behavior.
- Keep browser listener installation, SyntheticEvent dispatch, controlled
  restoration, and compatibility claims blocked.

## Verification

- Focused package event tests
- Focused DOM event conformance tests
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

