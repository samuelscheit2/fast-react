# Worker 497: Package Surface Private Facade Audit

Objective: audit and refresh package-surface/private-file guards for workers
473-496 after their reports land, keeping new diagnostics private and
non-enumerable.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, worker reports 471 and 473-496 if present.

Write scope: `tests/smoke/package-surface-snapshot.json`,
`tests/smoke/package-surface-guard.mjs`, `tests/smoke/import-entrypoints.mjs`,
package `package.json` files only if needed, and
`worker-progress/worker-497-package-surface-private-facade-audit.md`.

Do not expose private diagnostics through public package exports.

Verification: run `npm run check:package-surface`, `node
tests/smoke/import-entrypoints.mjs`, `npm run check:js` if snapshots change
broadly, and `git diff --check`.
