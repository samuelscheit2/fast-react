# Worker 613: React DOM Root Render Native Handoff

## Objective

Add a private React DOM root render handoff that consumes accepted root facade,
root work-loop, and fake-DOM metadata without enabling public root rendering.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 578 and 593 connected React DOM root facade metadata to real root
handoff evidence.

## Write Scope

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/client.js` or existing client facade file only if needed
- `packages/react-dom/test/*.test.js`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `worker-progress/worker-613-react-dom-root-render-native-handoff.md`

Do not edit Rust crates.

## Requirements

- Add private root render handoff metadata that validates facade ownership,
  accepted root work-loop evidence, and fake-DOM admission.
- Reject stale root records, hydrate roots, and unsupported child shapes before
  mutation.
- Keep public `createRoot().render` compatibility false.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/*.test.js`
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
