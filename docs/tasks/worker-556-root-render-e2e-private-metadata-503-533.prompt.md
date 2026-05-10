# Worker 556: Root Render E2E Private Metadata 503-533

## Objective

Refresh root-render E2E private metadata admissions for accepted workers
503-533 while keeping public root render compatibility blocked.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted root-render E2E private gate patterns.

## Write Scope

- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-556-root-render-e2e-private-metadata-503-533.md`

## Requirements

- Admit only deterministic private metadata rows from the accepted batch.
- Keep public root rendering, hydration, resources, forms, events, controlled
  input, and compatibility claims false.

## Verification

- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- Root-render conformance npm scripts if present
- `git diff --check`

