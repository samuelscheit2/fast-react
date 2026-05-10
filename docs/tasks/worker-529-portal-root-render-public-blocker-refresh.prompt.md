You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Refresh portal root-render public blocker diagnostics after accepted portal
mount, portal event ownership, and portal child reconciliation gates, ensuring
private portal metadata cannot promote public root rendering compatibility.

Write scope:
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-529-portal-root-render-public-blocker-refresh.md`

Constraints:
- Do not implement public portal rendering or event bubbling.
- Keep public root facade rows blocked.

Verification:
- Run private root bridge package tests.
- Run root-render E2E and public facade conformance.
- Run React DOM workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
