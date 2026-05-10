# Worker 230: DOM Text Dual-Run Conformance Gate

Objective: add a fail-closed dual-run conformance gate around the accepted DOM
text-content oracle so Fast React can compare only implemented private
text-content behavior and explicitly skip unsupported DOM mutation/root paths.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 106, 121, 137, 163, and 201.
- Inspect DOM text-content oracle/generator/local gate files and existing
  dual-run conformance gate scripts.

## Write Scope

- Primary: `tests/conformance/**` DOM text-content gate files.
- Secondary: package scripts only if needed to expose the focused gate.
- Report: `worker-progress/worker-230-dom-text-dual-run-conformance-gate.md`.
- Do not edit React DOM implementation, Rust crates, benchmark files, or master docs.

## Verification

- `node --check` for touched JS files.
- Focused DOM text-content oracle and dual-run gate tests.
- `npm run test:conformance`
- `npm run check:js`
- `git diff --check`
