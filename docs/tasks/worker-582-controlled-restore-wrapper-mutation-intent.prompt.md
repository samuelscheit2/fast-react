# Worker 582: Controlled Restore Wrapper Mutation Intent

## Objective

Add private controlled input wrapper mutation-intent diagnostics after accepted
restore write execution and flush blocker records, without real wrapper writes.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 547 and 548 created write-execution and flush-blocker records. This
task should model the next host wrapper intent boundary.

## Write Scope

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-582-controlled-restore-wrapper-mutation-intent.md`

Do not edit events, root bridge, scheduler, native, or test-renderer files.

## Requirements

- Consume accepted write-execution and flush-blocker records.
- Record wrapper operation name, target/control metadata, intended value/checked
  update, and blocked side effects.
- Keep live DOM reads/writes, value tracker writes, radio group lookup, queue
  flushes, and compatibility claims blocked.
- Reject stale, foreign, or unsupported wrapper intent records.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
