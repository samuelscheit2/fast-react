You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Extend private Scheduler `unstable_post_task` diagnostics for environment
capability, priority mapping, and abort/continuation metadata without changing
public Scheduler behavior or browser postTask compatibility claims.

Write scope:
- `packages/scheduler/*post*task*` or current scheduler postTask shim files
- `tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- scheduler workspace tests/smoke as needed
- `worker-progress/worker-523-scheduler-post-task-environment-diagnostics.md`

Constraints:
- Do not rely on real browser `scheduler.postTask`.
- Keep public exports and oracle byte comparisons stable unless deliberately
  refreshing accepted private rows.

Verification:
- Run scheduler post-task oracle tests.
- Run scheduler workspace check.
- Run oracle byte comparison/regeneration checks if the repo provides them.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
