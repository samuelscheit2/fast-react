# Worker 619: Hydration Recoverable Error Routing

## Objective

Add private hydration recoverable-error routing diagnostics that tie mismatch
metadata to root options without invoking public callbacks.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Use accepted hydration mismatch, replay error, and root option metadata.

## Write Scope

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/*.test.js`
- Relevant hydration conformance tests only if needed
- `worker-progress/worker-619-hydration-recoverable-error-routing.md`

Do not edit events or resource/form files.

## Requirements

- Add private metadata showing recoverable hydration errors can be associated
  with root option handles and mismatch rows.
- Reject stale root options, missing mismatch records, and callback execution.
- Keep public `onRecoverableError` invocation and hydration compatibility
  blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/*.test.js`
- Any focused hydration conformance test touched
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
