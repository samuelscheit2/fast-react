You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Bridge admitted private DOM HostText commit gate rows into the private fake-DOM mutation adapter for create/update/delete/insert/reset text operations, without public roots, hydration, event replay, attribute payloads, or compatibility claims.

Write scope:
- `packages/react-dom/src/dom-host/mutation.js`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `tests/conformance/test/dom-host-text-commit-conformance-gate.test.mjs`
- `worker-progress/worker-272-dom-host-text-commit-to-mutation-adapter.md`

Context to inspect:
Workers 201, 211, 212, 230, 241, 261, 271.

Constraints:
- Compare only admitted private rows.
- Keep public render and HostText compatibility false.
- Do not implement root rendering.

Verification:
- `node --check` for touched JS files
- `node tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `node --test tests/conformance/test/dom-host-text-commit-conformance-gate.test.mjs`
- `npm run dom-text-content:conformance --workspace @fast-react/conformance`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
