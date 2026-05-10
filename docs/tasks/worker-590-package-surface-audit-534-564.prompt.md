# Worker 590: Package Surface Audit 534-564

## Objective

Refresh package-surface privacy guards after accepted queue 534-564 so new
private diagnostics remain inaccessible from public package exports.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Queue 534-564 added new private files and diagnostics in React, React DOM,
test-renderer, Scheduler, and native surfaces.

## Write Scope

- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/package-surface-snapshot.json`
- Existing package `package.json` export maps only if a real privacy leak is
  found and must be blocked
- `worker-progress/worker-590-package-surface-audit-534-564.md`

Do not implement feature behavior in React DOM, scheduler, test-renderer, or
Rust. This is a guard/hardening task, not a broad report.

## Requirements

- Audit all files added by workers 534-564 for public export exposure.
- Update package-surface snapshots only for intentional private-file inventory
  changes.
- Add explicit blocked probes for any new private entrypoints that could be
  imported directly.
- Keep public compatibility claims unchanged and false.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `npm run package-surface:check`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
