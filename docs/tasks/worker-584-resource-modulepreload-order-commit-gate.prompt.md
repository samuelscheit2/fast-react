# Worker 584: Resource Modulepreload Order Commit Gate

## Objective

Extend private resource-map commit diagnostics for modulepreload/preinitModule
ordering across preload, preinit, and script rows without DOM insertion.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 546 added script module preinit gates. This task should tighten ordering
evidence in the resource map commit gate.

## Write Scope

- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `worker-progress/worker-584-resource-modulepreload-order-commit-gate.md`

Avoid controlled input, events, root bridge, scheduler, native, and
test-renderer files.

## Requirements

- Record deterministic modulepreload/preinitModule/script resource map order and
  dedupe keys.
- Keep head insertion, fetch priority side effects, stylesheet/script execution,
  and compatibility claims blocked.
- Preserve existing preload/preinit/style/script tests.
- Reject malformed module resource rows and duplicate conflicting records.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
