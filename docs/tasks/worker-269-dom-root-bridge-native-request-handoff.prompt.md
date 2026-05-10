You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private React DOM root bridge handoff record that can mirror create/render/unmount request metadata into the accepted native root request record shape without invoking N-API, reconciler execution, DOM mutation, listeners, hydration, or public root behavior.

Write scope:
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `packages/react-dom/src/client/root-bridge-native.js` if adding a new private module
- `worker-progress/worker-269-dom-root-bridge-native-request-handoff.md`

Context to inspect:
Workers 167, 215, 239, 256, 262.

Constraints:
- Private JS records only; do not load native artifacts.
- Keep public `react-dom/client` placeholders inert.
- Hidden payloads must remain non-enumerable/non-serializing.

Verification:
- `node --check` for touched JS files
- Focused root-bridge smoke tests
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
