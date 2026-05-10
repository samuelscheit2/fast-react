# Worker 563: Master Docs Accepted History Compaction

## Objective

Compact accepted-history documentation for older worker batches without moving
current/future planning out of `MASTER_PLAN.md` or losing recent queue 503-533
acceptance facts.

## Context

Read `WORKER_BRIEF.md`, `ORCHESTRATOR.md`, `MASTER_PLAN.md`, and
`MASTER_PROGRESS.md` first. This is documentation cleanup only.

## Write Scope

- `MASTER_PROGRESS.md`
- `MASTER_PLAN.md` only if stale current/future wording is discovered
- `worker-progress/worker-563-master-docs-accepted-history-compaction.md`

## Requirements

- Keep durable policy out of master docs.
- Keep current/future queue data in `MASTER_PLAN.md` only.
- Preserve recent accepted queue 503-533 summary and verification.
- Do not edit implementation code.

## Verification

- Manual checklist mapping ORCHESTRATOR planning/progress doc policy to the
  resulting files
- `git diff --check`

