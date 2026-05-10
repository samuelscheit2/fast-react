You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Refresh Scheduler native entry and package guard diagnostics after accepted
mock/postTask work so native/server/browser variant entrypoints remain explicit
and public behavior unchanged.

Write scope:
- `packages/scheduler/**`
- `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `tests/smoke/import-entrypoints.mjs` only if guard inventory changes
- `worker-progress/worker-531-scheduler-native-entry-guard-refresh.md`

Constraints:
- Do not change public Scheduler export keys.
- Keep mock/postTask diagnostics private and variant-scoped.

Verification:
- Run scheduler native entry oracle and scheduler mock/postTask checks if
  touched.
- Run scheduler workspace check.
- Run import smoke and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
