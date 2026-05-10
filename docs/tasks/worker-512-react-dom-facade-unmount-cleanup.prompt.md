You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add a private React DOM client facade unmount cleanup diagnostic that routes an
accepted fake-DOM host-output cleanup through the private bridge without
opening public root unmount compatibility.

Write scope:
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-512-react-dom-facade-unmount-cleanup.md`

Constraints:
- Keep the adapter private/symbol-only.
- Do not remove real browser DOM nodes or schedule public roots.
- Preserve accepted event, resource, form, and host-output diagnostics.

Verification:
- Run syntax checks.
- Run private root bridge package tests.
- Run public facade blocked-gate conformance.
- Run React DOM workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
