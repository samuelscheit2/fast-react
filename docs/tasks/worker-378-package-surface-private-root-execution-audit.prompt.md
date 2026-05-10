# Worker 378: Package Surface Private Root Execution Audit

Objective: audit package-surface guards after the new private root/host-output
gates and harden snapshots so private implementation files remain non-public
unless explicitly intended.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 165, 321, 346, 352, 367, 368, 369, and
376 if present.

Write scope: `tests/smoke/package-surface-guard.mjs`,
`tests/smoke/package-surface-snapshot.json`, package `package.json` files only
if needed, focused tests, and
`worker-progress/worker-378-package-surface-private-root-execution-audit.md`.

Do not widen public package exports to make tests pass.

Verification: run `npm run check:package-surface`, relevant workspace checks if
package metadata changes, `npm run check:js`, and `git diff --check`.
