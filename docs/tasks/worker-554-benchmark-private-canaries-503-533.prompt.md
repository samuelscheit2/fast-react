# Worker 554: Benchmark Private Canaries 503-533

## Objective

Refresh benchmark manifests with private diagnostic canaries for accepted
workers 503-533 while keeping all comparable/public performance claims blocked.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on existing benchmark private diagnostic canary patterns.

## Write Scope

- `tests/benchmarks/`
- `worker-progress/worker-554-benchmark-private-canaries-503-533.md`

## Requirements

- Add manifest rows for representative private diagnostics from 503-533.
- Keep scenario status diagnostic-only and reject claim-capable/comparable
  timing for blocked public behavior.
- Do not add result artifacts.

## Verification

- `npm run check:benchmarks`
- `git diff --check`

