You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Wire the private DOM ordinary property payload helper into the private fake-DOM mutation adapter for admitted attribute/property rows, preserving deterministic ordering and fail-closed unsupported records without public roots, events, hydration, controlled forms, resources, or compatibility claims.

Write scope:
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/dom-host/property-payload.js`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `worker-progress/worker-271-dom-property-payload-mutation-adapter.md`

Context to inspect:
Workers 154, 186, 212, 238, 242, 259, 261.

Constraints:
- Private fake-DOM only.
- Unsupported style/controlled/resource records must still fail closed unless already admitted.
- No public root rendering.

Verification:
- `node --check` for touched JS files
- `node tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
