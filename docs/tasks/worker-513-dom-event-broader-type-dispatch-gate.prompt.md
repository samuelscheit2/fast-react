You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private DOM event dispatch canaries for a small set of additional event
types beyond click, proving priority/listener metadata selection while keeping
SyntheticEvent, browser dispatch, hydration replay, and public event
compatibility blocked.

Write scope:
- `packages/react-dom/src/events/*`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` only if
  root bridge fixtures are needed
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `tests/conformance/test/react-dom-event-priority-shell.test.mjs`
- `worker-progress/worker-513-dom-event-broader-type-dispatch-gate.md`

Constraints:
- Do not install real browser listeners or dispatch real native events.
- Keep event records private and metadata-only.
- Preserve existing click, portal, propagation, preventDefault, and error
  routing diagnostics.

Verification:
- Run syntax checks for touched JS/MJS.
- Run focused event dispatch and event priority conformance.
- Run React DOM workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
