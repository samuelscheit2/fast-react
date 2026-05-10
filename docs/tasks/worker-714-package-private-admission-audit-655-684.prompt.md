# Worker 714: Package Private Admission Audit 655-684

Objective: refresh package-surface and private-admission guards for all accepted queue 655-684 private diagnostics, ensuring no private execution helpers leak through public exports and all new accepted rows stay explicitly blocked from compatibility claims.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: package-surface guard data/tests, `tests/conformance/src/private-admission-*` or a new focused private-admission gate for queue 655-684, focused conformance guard tests, and `worker-progress/worker-714-package-private-admission-audit-655-684.md`.

Constraints: this is a guard task, not a broad product implementation task. Do not refactor product code unless a guard failure proves a real leak; document any leak precisely.

Verification: `npm run check:package-surface`, focused private-admission/conformance guard tests, relevant import-smoke/workspace checks for touched packages, conflict-marker scan, and `git diff --check`.
