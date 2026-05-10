You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private DOM ref callback component-tree gate that validates accepted ref attach/detach metadata against component-tree mounted/latest-props maps without invoking callback refs, object refs, layout effects, DOM mutation, public roots, or compatibility claims.

Write scope:
- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/client/ref-callback-gate.js`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs` if adding gate coverage
- `worker-progress/worker-273-dom-ref-callback-component-tree-gate.md`

Context to inspect:
Workers 168, 214, 226, 245, 259.

Constraints:
- Private records only.
- Do not call user refs.
- Preserve package surface and public roots.

Verification:
- `node --check` for touched JS files
- `node tests/smoke/react-dom-component-tree-map-shell.mjs`
- Focused ref callback conformance tests if touched
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
