You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private Scheduler mock expired-work act-route diagnostics that build on
workers 469 and 482, proving expired mock Scheduler metadata can be recognized
by the private react-test-renderer act scheduler gate without running public
Scheduler flush behavior.

Write scope:
- `packages/scheduler/unstable_mock.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-518-scheduler-mock-expired-act-route.md`

Constraints:
- Do not execute public Scheduler tasks or public test-renderer act queues.
- Keep route private/diagnostic and CJS-development scoped unless existing
  tests prove another private scope is needed.
- Preserve accepted mock continuation/yield/paint diagnostics.

Verification:
- Run syntax checks.
- Run Scheduler mock oracle, react-test-renderer act oracle, and
  create-routing conformance.
- Run scheduler and react-test-renderer workspace checks.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
