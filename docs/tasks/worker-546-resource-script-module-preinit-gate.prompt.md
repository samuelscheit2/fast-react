# Worker 546: Resource Script Module Preinit Gate

## Objective

Add private resource diagnostics for script/modulepreload/preinit metadata,
dedupe, and fake-head ordering without dispatching public resource work.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted resource dispatcher, fake-DOM insertion, resource-map commit, and
stylesheet state diagnostics.

## Write Scope

- `packages/react-dom/src/shared/resource-hints.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `worker-progress/worker-546-resource-script-module-preinit-gate.md`

## Requirements

- Record normalized script/modulepreload/preinit rows, dedupe keys, fake-head
  order, and blocked public dispatch flags.
- Keep network fetches, DOM insertion outside fake-head diagnostics, load/error
  execution, and compatibility claims blocked.

## Verification

- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

