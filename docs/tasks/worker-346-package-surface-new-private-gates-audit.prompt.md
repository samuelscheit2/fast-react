# Worker 346: Package Surface New Private Gates Audit

Objective: audit the package-surface and import-entrypoint guards against the
new private gates from workers 323-345, adding exact blocklist/allowlist tests
only where new private files or accepted diagnostic exports require them.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 165, 231, 258, 290, 321, plus any
new reports 323-345 present in the branch.

Write scope: `tests/smoke/package-surface-guard.mjs`,
`tests/smoke/import-entrypoints.mjs`, package metadata only if a guard proves
it necessary, and
`worker-progress/worker-346-package-surface-new-private-gates-audit.md`.

Do not loosen private diagnostic guard patterns broadly; use exact exceptions
with rationale.

Verification: run JS syntax checks, `npm run check:package-surface`,
`node tests/smoke/import-entrypoints.mjs`, `npm run check:js`, and
`git diff --check`.
