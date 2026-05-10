# Worker 553: Package Surface Private Audit 503-533

## Objective

Refresh package-surface and import-smoke private inventories for accepted
workers 503-533 without changing public exports.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. This
is an audit/update worker for package surface guard data after the accepted
batch.

## Write Scope

- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/import-entrypoints.mjs`
- Any checked package-surface snapshot files already used by those scripts
- `worker-progress/worker-553-package-surface-private-audit-503-533.md`

## Requirements

- Add only accepted private files/symbols needed for 503-533.
- Prove public exports and entrypoint shapes remain unchanged.
- Do not modify implementation behavior.

## Verification

- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- Relevant package workspace checks if snapshots change
- `git diff --check`

