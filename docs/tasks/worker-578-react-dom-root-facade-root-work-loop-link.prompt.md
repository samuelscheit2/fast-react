# Worker 578: React DOM Root Facade Root Work Loop Link

## Objective

Connect the private React DOM root facade render diagnostic to accepted root
work-loop finished-work metadata while public `createRoot` remains a placeholder.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 542 and 556 refreshed root facade diagnostics; worker 565 is advancing
root work-loop commit metadata. This task is JS facade metadata only.

## Write Scope

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-578-react-dom-root-facade-root-work-loop-link.md`

Avoid Rust, test-renderer, scheduler, native, and unrelated React DOM resource
or event files.

## Requirements

- Add a private root facade row that references root work-loop finished-work
  handoff metadata for one HostComponent/HostText render.
- Keep public createRoot/render/hydrateRoot compatibility false.
- Preserve initial, update, nested update, and unmount facade diagnostics.
- Reject stale or foreign root work-loop metadata.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
