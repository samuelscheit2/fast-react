You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private DOM ref callback attach/detach gate that uses component-tree host node records and root commit ref metadata to produce deterministic callback/object-ref records without invoking user refs.

Write scope:
- `packages/react-dom/src/client/ref-callback-gate.js`
- `packages/react-dom/src/client/component-tree.js`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `worker-progress/worker-313-dom-ref-callback-private-attach-detach-gate.md`

Context to inspect:
Workers 174, 245, 273, and root commit ref tests.

Constraints:
- Do not call callback refs or mutate object refs.
- Preserve attach/detach ordering metadata and error propagation as blocked.
- No public root commit integration.

Verification:
- `node --check` for touched JS files
- Focused DOM ref callback oracle and component-tree smoke tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
