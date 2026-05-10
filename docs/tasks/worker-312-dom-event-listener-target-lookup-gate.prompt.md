You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private DOM event listener target lookup gate that combines component-tree host instance lookup, latest props, and event dispatch skeleton records without installing public listeners or dispatching real synthetic events.

Write scope:
- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/events/dispatch.js`
- `packages/react-dom/src/events/plugin-event-system.js`
- `tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `worker-progress/worker-312-dom-event-listener-target-lookup-gate.md`

Context to inspect:
Workers 168, 244, 259, 274, and 311 if present.

Constraints:
- No public event listener installation or real dispatch.
- Invalid/wrong-node lookups must fail before side effects.
- Keep event priority and plugin extraction metadata deterministic.

Verification:
- `node --check` for touched JS files
- Focused event dispatch and component-tree smoke tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
