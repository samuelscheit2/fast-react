You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Connect the private DOM event dispatch skeleton to component-tree target normalization records so dispatch can identify mounted host nodes in diagnostics while staying inert: no plugin event queue execution, no listener invocation, no hydration replay, no controlled restore, and no public root behavior.

Write scope:
- `packages/react-dom/src/events/dispatch.js`
- `packages/react-dom/src/client/component-tree.js`
- `tests/conformance/test/react-dom-event-delegation-oracle.test.mjs`
- `worker-progress/worker-274-dom-event-dispatch-component-tree-target-gate.md`

Context to inspect:
Workers 168, 214, 216, 244, 259.

Constraints:
- Private diagnostics only.
- No native event side effects.
- Preserve listener wrapper priority metadata.

Verification:
- `node --check` for touched JS files
- Focused event delegation/dispatch tests
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
