# Worker 440: Package-Surface Private Facade Audit

Objective: audit and tighten package-surface guards around the private runtime
facades added for react-test-renderer, React act, React DOM root output, and
Scheduler diagnostics.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 258, 290, 321, 346, 378, 408, 391, 392,
393, 395, 437, and 438 if present.

Write scope: `tests/smoke/package-surface-guard.mjs`,
`tests/smoke/import-entrypoints.mjs`, `tests/smoke/package-surface-snapshot.json`,
private facade tests if needed, and
`worker-progress/worker-440-package-surface-private-facade-audit.md`.

Do not remove accepted private facade markers or change public export keys
unless the guard proves the current snapshot is stale.

Verification: run `npm run check:package-surface`, `node tests/smoke/import-entrypoints.mjs`,
`npm run check:js` if the guard or snapshot changes substantially, and
`git diff --check`.
