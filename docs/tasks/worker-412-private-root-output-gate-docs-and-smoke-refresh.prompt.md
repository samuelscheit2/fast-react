# Worker 412: Private Root Output Gate Docs And Smoke Refresh

Objective: refresh focused gate documentation and smoke coverage for the newly
accepted private root-output pipeline so future workers can identify which
private rows are admitted and which public compatibility rows stay blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 353-411 that are present.

Write scope: `tests/smoke/*.mjs`, `tests/conformance/**/*.md` or focused gate
docs if present, `MASTER_PROGRESS.md` only for accepted factual clarifications,
and `worker-progress/worker-412-private-root-output-gate-docs-and-smoke-refresh.md`.

This is not a report-only task: add or update executable smoke/gate coverage if
documentation changes reveal stale assertions.

Verification: run focused smoke/conformance checks for touched files,
`npm run check:package-surface`, `npm run check:js`, and `git diff --check`.
