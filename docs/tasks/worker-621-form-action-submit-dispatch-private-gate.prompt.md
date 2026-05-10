# Worker 621: Form Action Submit Dispatch Private Gate

## Objective

Add private form submit/action diagnostics that connect event extraction,
FormData blockers, and reset queue metadata without public form actions.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Use accepted form action/reset dispatcher and FormData blocker diagnostics.

## Write Scope

- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/src/shared/form-actions.js`
- `packages/react-dom/test/*.test.js`
- Relevant form conformance tests only if needed
- `worker-progress/worker-621-form-action-submit-dispatch-private-gate.md`

Do not edit resource stylesheet code.

## Requirements

- Add private metadata linking submit extraction, action identity, FormData
  blocker rows, and reset queue intent.
- Reject live forms, unsupported submitters, and callback dispatch execution.
- Keep public form action compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/*.test.js`
- Any focused form conformance test touched
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
