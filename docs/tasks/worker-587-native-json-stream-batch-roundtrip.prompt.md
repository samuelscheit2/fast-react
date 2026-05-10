# Worker 587: Native JSON Stream Batch Roundtrip

## Objective

Extend native JSON transport diagnostics with a streaming batch-response
roundtrip sequence while keeping native execution compatibility blocked.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 552 added native JSON batch response sequencing. This task should cover
chunked/streaming response ordering and teardown.

## Write Scope

- `packages/native`
- `bindings`
- `tests` under native transport/smoke areas touched by existing worker 552
  diagnostics
- `worker-progress/worker-587-native-json-stream-batch-roundtrip.md`

Avoid React DOM, scheduler JS, test-renderer JS, and Rust reconciler unless a
native binding test requires a narrow metadata constant.

## Requirements

- Record request id, chunk order, batch sequence, response assembly, and teardown
  blockers.
- Keep native renderer execution, cross-environment handle reuse, and public
  compatibility blocked.
- Reject out-of-order, duplicate, missing, and post-teardown chunks.
- Preserve existing native import smoke and package-surface guard behavior.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- Run the focused native/package checks already used by worker 552 reports.
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
