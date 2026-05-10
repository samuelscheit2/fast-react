# Worker 617: DOM Input Change Restore Execution

## Objective

Connect private input/change extraction to controlled restore queue execution
for one text input or checkbox fake-DOM path, without public controlled input
compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 581 and 582 accepted input/change bridge and wrapper mutation intent
metadata.

## Write Scope

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/src/events/*.js`
- `packages/react-dom/test/*.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs` if present
- `worker-progress/worker-617-dom-input-change-restore-execution.md`

Do not edit root bridge or resource/form files.

## Requirements

- Add a private gate that records event extraction, latest-props validation,
  restore queue write, flush intent, and wrapper mutation execution evidence.
- Reject stale latest props, radio group ambiguity, and unsupported live DOM
  nodes before mutation.
- Keep public controlled input compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/*.test.js`
- Any focused controlled-input conformance test touched
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
