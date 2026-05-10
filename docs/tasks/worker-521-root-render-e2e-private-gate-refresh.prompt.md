You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Refresh root-render E2E private gate admissions for accepted React DOM
host-output, event, resource, form, and controlled metadata from workers
486-492 while keeping public root rendering blocked.

Write scope:
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/src/*root*render*`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-521-root-render-e2e-private-gate-refresh.md`

Constraints:
- Do not mark public root rendering, hydration, events, resources, forms, or
  controlled inputs compatible.
- Only admit private metadata rows with explicit accepted evidence.

Verification:
- Run focused root-render E2E and public facade conformance.
- Run `npm run root-public-facade:conformance --workspace @fast-react/conformance`.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
