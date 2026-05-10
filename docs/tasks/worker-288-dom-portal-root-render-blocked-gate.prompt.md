You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a React DOM portal root-render blocked gate that ties accepted `createPortal` object behavior and reconciler portal fail-closed diagnostics to the root render E2E oracle while portal mounting, listener setup, DOM mutation, and compatibility remain blocked.

Write scope:
- `tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`
- `worker-progress/worker-288-dom-portal-root-render-blocked-gate.md`

Context to inspect:
Workers 181, 189, 217, 243, 247, 262.

Constraints:
- Do not implement portal mounting.
- Keep portal rows blocked and separate from public root compatibility.
- Preserve accepted portal object shape.

Verification:
- `node --check` for touched JS files
- Focused createPortal/root-render tests
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
