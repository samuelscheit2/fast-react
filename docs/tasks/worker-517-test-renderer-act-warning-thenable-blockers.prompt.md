You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Refresh private react-test-renderer act warning and thenable blocker
diagnostics so accepted act/passive/Scheduler metadata remains separated from
public async `act` compatibility.

Write scope:
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `tests/conformance/test/act-passive-local-gate.test.mjs`
- `worker-progress/worker-517-test-renderer-act-warning-thenable-blockers.md`

Constraints:
- Do not implement public act queue draining, Scheduler flushing, thenable
  awaiting, warning emission, root execution, or passive callback execution.
- Keep production/package-root behavior unchanged unless tests require a
  private blocked row.

Verification:
- Run syntax checks.
- Run react-test-renderer act oracle conformance.
- Run act/passive local gate.
- Run react-test-renderer workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
