# Worker 547: Controlled Restore Queue Write Execution Gate

## Objective

Add a private controlled restore queue write execution gate that consumes worker
533 write-preflight rows and records deterministic queue mutation intent without
flushing or invoking wrappers.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted controlled restore ordering, radio sibling props, and write
preflight diagnostics.

## Write Scope

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-547-controlled-restore-queue-write-execution-gate.md`

## Requirements

- Record restoreTarget versus restoreQueue write order, source preflight rows,
  target/control kind, and blocked flush/wrapper side effects.
- Do not invoke wrappers, read/write host values, query radio groups, or mutate
  live DOM controls.

## Verification

- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

