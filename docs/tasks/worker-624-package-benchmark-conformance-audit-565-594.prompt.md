# Worker 624: Package Benchmark Conformance Audit 565-594

## Objective

Refresh package-surface, benchmark, and private-admission guards for accepted
queue 565-594 so new private diagnostics stay blocked from public promotion.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Queue 565-594 is accepted on `main`; this is a guard update with concrete
tests, not a broad report.

## Write Scope

- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `tests/benchmarks/**`
- `tests/conformance/**`
- `worker-progress/worker-624-package-benchmark-conformance-audit-565-594.md`

Do not edit runtime implementation files unless a real privacy leak must be
blocked.

## Requirements

- Audit files added by workers 565-594 for accidental public package exposure.
- Add or update benchmark/private-admission rows for the accepted private gates.
- Add negative tests preventing public compatibility or comparable timing
  promotion from private diagnostics.
- Keep public compatibility claims unchanged and false.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `npm run check:package-surface`
- `npm run check:benchmarks`
- `npm run check --workspace @fast-react/conformance`
- `git diff --check`
