# Worker 229: Benchmark Root Render Manifest Gate

Objective: extend the benchmark manifest gate for the next minimal root
render/update/unmount milestones, adding schema-backed status coverage without
claiming runtime performance, running browser benchmarks, or touching source
implementation.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 074, 137, 146, 162, and benchmark gate files.
- Inspect `tests/benchmarks/**`.

## Write Scope

- Primary: `tests/benchmarks/**`.
- Report: `worker-progress/worker-229-benchmark-root-render-manifest-gate.md`.
- Do not edit Rust crates, JS packages, conformance tests outside benchmark
  references, or master docs.

## Verification

- `node --check tests/benchmarks/scripts/check-benchmark-manifests.mjs`
- `npm run check:benchmarks` or the closest focused benchmark manifest check.
- `npm run check:js`
- `git diff --check`
