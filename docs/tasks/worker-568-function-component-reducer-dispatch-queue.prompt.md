# Worker 568: Function Component Reducer Dispatch Queue

## Objective

Add a private `useReducer` dispatch queue diagnostic that mirrors accepted
`useState` and dispatcher lane metadata without claiming public hook execution.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Recent workers added hook dispatcher blockers, `useCallback`, and update-lane
metadata. Build a narrow reducer dispatch queue record beside those paths.

## Write Scope

- `crates/fast-react-reconciler/src/function_component.rs`
- `packages/react/hook-dispatcher.js` only if a matching JS private gate is
  already required by local tests
- Focused Rust/JS tests for the touched module(s)
- `worker-progress/worker-568-function-component-reducer-dispatch-queue.md`

Avoid React DOM, scheduler, test-renderer, native, and package-surface edits.

## Requirements

- Record reducer action handle, queue identity, render lane, eager-state blocker,
  and dispatch non-execution metadata.
- Preserve existing `useState`, `useCallback`, `useMemo`, and transition
  dispatcher behavior.
- Reject dispatch outside an accepted private render/dispatcher context.
- Keep public hook compatibility and actual reducer execution blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-reconciler --all-features function_component -- --nocapture`
- If JS is touched: `npm run check --workspace @fast-react/react`
- `cargo fmt --all --check`
- `git diff --check`
