You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Wire the private DOM mutation adapter to the component-tree latest-props map through a data-only commit handoff. Prove ordinary admitted property payloads update latest props only after successful mutation records.

Write scope:
- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `worker-progress/worker-311-dom-component-tree-latest-props-mutation-handoff.md`

Context to inspect:
Workers 168, 259, 271, 272, and 274.

Constraints:
- No public React DOM root or event dispatch behavior.
- Failed/unsupported payloads must not update latest props.
- Keep controlled/form/resource props unsupported.

Verification:
- `node --check` for touched JS files
- Focused component-tree, mutation adapter, and property payload tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
