# Worker 684: Package Surface Private Admission Refresh

Objective: refresh package-surface/private-admission guards for the newly accepted queue 625-654 private diagnostics, ensuring no private execution helpers leak through public package exports.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: package-surface guard data/tests, private-admission or conformance guard files, docs only if needed for accepted private rows, and `worker-progress/worker-684-package-surface-private-admission-refresh.md`.

This is a guard/update task, not a broad implementation task. Do not refactor product code unless a guard failure proves a real leak.

Verification: `npm run check:package-surface`, relevant import-smoke/workspace checks for touched packages, focused conformance guard tests, conflict-marker scan, and `git diff --check`.
