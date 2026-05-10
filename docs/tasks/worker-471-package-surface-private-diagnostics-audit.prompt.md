# Worker 471: Package-Surface Private Diagnostics Audit

Objective: refresh package-surface and import-entrypoint guards for new private
diagnostic files/symbols from queue 443-470 while keeping public export keys
unchanged.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, worker reports 408, 440, and any completed 443-470
reports present when this worker starts.

Write scope: `tests/smoke/package-surface-snapshot.json`,
`tests/smoke/import-entrypoints.mjs`, focused package-surface tests, and
`worker-progress/worker-471-package-surface-private-diagnostics-audit.md`.

Do not add public exports, hide private files from the guard, or weaken
snapshot validation.

Verification: run `npm run check:package-surface`, `node
tests/smoke/import-entrypoints.mjs`, `npm run check:js` if package surface
changes are broad, and `git diff --check`.
