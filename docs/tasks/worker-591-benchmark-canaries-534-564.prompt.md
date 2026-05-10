# Worker 591: Benchmark Canaries 534-564

## Objective

Refresh benchmark private canaries after queue 534-564 so new root, DOM, React,
Scheduler, and test-renderer diagnostics are represented without timing claims.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 554 and 591 area work should keep benchmark evidence private and
non-compatibility.

## Write Scope

- Existing benchmark manifest/canary files under `tests` or `benchmarks`
- Existing benchmark tests
- `worker-progress/worker-591-benchmark-canaries-534-564.md`

Do not edit runtime implementation files unless a benchmark manifest import path
must be corrected.

## Requirements

- Add or refresh private benchmark canary rows for accepted queue 534-564
  diagnostics.
- Keep all timing/performance compatibility claims false.
- Preserve package-surface privacy and import-smoke behavior.
- Reject stale worker ids or missing diagnostic files in the manifest.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- Run the existing benchmark check command from `package.json`.
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
