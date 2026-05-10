# Worker 615: React DOM Root Unmount Cleanup Admission

## Objective

Connect private React DOM root unmount diagnostics to accepted deletion cleanup
and fake-DOM container cleanup metadata without enabling public unmount.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Use accepted root unmount, deletion cleanup, and fake-DOM container cleanup
evidence.

## Write Scope

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/client/dom-container.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/test/*.test.js`
- `worker-progress/worker-615-react-dom-root-unmount-cleanup-admission.md`

Do not edit Rust crates.

## Requirements

- Add private unmount admission metadata that validates root ownership and
  container cleanup records.
- Reject stale root handles, already-unmounted roots, and portal containers.
- Keep public `root.unmount()` compatibility false.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/*.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
