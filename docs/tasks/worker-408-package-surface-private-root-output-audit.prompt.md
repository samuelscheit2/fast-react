# Worker 408: Package Surface Private Root Output Audit

Objective: refresh the package-surface guard after accepted private root-output
facades so private files remain non-public and public export keys stay
React-shaped.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 165, 348, 378, 391, 392, 393, and 395
if present.

Write scope: `tests/smoke/package-surface-guard.mjs`,
`tests/smoke/package-surface-snapshot.json`, package entrypoint smoke tests,
and `worker-progress/worker-408-package-surface-private-root-output-audit.md`.

Do not expose private gates as public package exports.

Verification: run `npm run check:package-surface`, `node tests/smoke/import-entrypoints.mjs`,
workspace package checks as needed, and `git diff --check`.
