You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private React DOM root bridge gate that can mark containers and register root listeners for private createRoot records while public `react-dom/client` root APIs remain placeholders.

Write scope:
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/client/root-markers.js`
- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-310-dom-root-private-create-mark-listen-gate.md`

Context to inspect:
Workers 122, 167, 269, 270, and 275.

Constraints:
- Public createRoot/hydrateRoot remain blocked.
- Private marker/listener side effects must be explicit, reversible, and validated.
- No reconciler execution or DOM child mutation.

Verification:
- `node --check` for touched JS files
- Focused private root bridge and public facade tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
