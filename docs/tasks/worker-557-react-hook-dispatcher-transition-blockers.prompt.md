# Worker 557: React Hook Dispatcher Transition Blockers

## Objective

Add private React hook dispatcher blocker diagnostics for `useTransition` and
`useDeferredValue` without implementing public transition behavior.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted hook dispatcher public blocker refreshes.

## Write Scope

- `packages/react/src/react-hooks.js`
- `tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `worker-progress/worker-557-react-hook-dispatcher-transition-blockers.md`

## Requirements

- Record hook name, expected public shape blocker, missing scheduler/root lane
  prerequisites, and compatibility false flags.
- Do not execute transition scheduling or deferred value behavior.

## Verification

- Focused React hook dispatcher conformance tests
- `npm run check --workspace @fast-react/react`
- `git diff --check`

