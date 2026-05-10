# Worker 588: React Transition Dispatcher Routing

## Objective

Add a private React dispatcher diagnostic for `startTransition` routing to
accepted transition-lane metadata without enabling public transition behavior.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 557 refreshed hook dispatcher transition blockers. Build the next
package-private routing record.

## Write Scope

- `packages/react/hook-dispatcher.js`
- `packages/react/test` or existing React conformance tests for hook dispatcher
- `tests/conformance/test` only for a focused React hook/transition gate if one
  already exists
- `worker-progress/worker-588-react-transition-dispatcher-routing.md`

Avoid React DOM, scheduler package, native, and Rust files.

## Requirements

- Record transition action identity, lane metadata, pending-state tuple shape,
  and blocked scheduler/root execution.
- Keep public `startTransition`, `useTransition`, root scheduling, and
  compatibility claims blocked.
- Preserve existing dispatcher-null and hook-order error behavior.
- Reject missing dispatcher context, stale transition metadata, and unsupported
  callback inputs.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `npm run check --workspace @fast-react/react`
- Focused hook/transition tests you add or touch
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
