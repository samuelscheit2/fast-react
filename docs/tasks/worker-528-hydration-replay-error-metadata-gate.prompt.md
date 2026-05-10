You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private hydration replay error metadata diagnostics that connect accepted
hydration replay target ownership/order records with root option error metadata
without replaying real browser events or enabling hydration compatibility.

Write scope:
- `packages/react-dom/src/client/root-bridge.js`
- hydration/event files under `packages/react-dom/src/`
- `packages/react-dom/test/*.test.js`
- focused hydration/event conformance tests
- `worker-progress/worker-528-hydration-replay-error-metadata-gate.md`

Constraints:
- Do not dispatch real events, hydrate real DOM, call public root callbacks, or
  report global errors.
- Keep records private and fail-closed for missing dehydrated ownership.

Verification:
- Run syntax checks.
- Run focused hydration replay and event conformance.
- Run React DOM workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
