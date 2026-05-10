You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Audit and refresh package-surface, private-file, and import-smoke guards for
the accepted 480-492 batch. Ensure newly accepted private diagnostics remain
private and no public exports or importable implementation files leaked.

Write scope:
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/test/package-surface-*.mjs`
- package files only if a guard proves the accepted inventory is stale
- `worker-progress/worker-519-package-surface-private-audit-480-492.md`

Constraints:
- Do not add public exports.
- Do not remove accepted private diagnostics.
- Prefer refreshing guard inventories over broad refactors.

Verification:
- Run package-surface/import-smoke checks you update.
- Run `npm run check:js` if available and scoped checks are green.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
