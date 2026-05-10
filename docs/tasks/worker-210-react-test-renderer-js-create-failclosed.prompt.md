# Worker 210: React Test Renderer JS Create Fail-Closed Surface

Objective: tighten the `@fast-react/react-test-renderer` placeholder package so
`create`, root update/unmount entrypoints, and related CJS surfaces fail loudly
and deterministically against the accepted package shape, without wiring Rust
test-renderer behavior, serialization, `act`, or React DOM.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 083, 084, 085, 087, 178, and 202.
- Inspect `packages/react-test-renderer/**`, package-surface smoke tests, and
  relevant conformance oracles.

## Write Scope

- Primary: `packages/react-test-renderer/**`.
- Secondary: package-surface smoke tests/snapshots if the exported surface changes.
- Report: `worker-progress/worker-210-react-test-renderer-js-create-failclosed.md`.
- Do not edit Rust crates, React DOM, Scheduler, or master docs.

## Verification

- `node --check` for touched JS files.
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- Focused react-test-renderer smoke/conformance tests touched by this change.
- `npm run check:js`
- `git diff --check`
