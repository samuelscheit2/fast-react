You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Refresh the DOM HostText dual-run admission gate after accepted private text-content, mutation adapter, and HostText commit slices, admitting only rows that are fully proven by private fake-DOM behavior and keeping public roots, server rendering, hydration, and compatibility blocked.

Write scope:
- `tests/conformance/src/dom-text-content-conformance-gate.mjs`
- `tests/conformance/test/dom-host-text-commit-conformance-gate.test.mjs`
- `tests/conformance/test/dom-text-content-oracle.test.mjs`
- `worker-progress/worker-292-dom-host-text-dual-run-admission-refresh.md`

Context to inspect:
Workers 201, 211, 212, 230, 241, 261, 271, 272.

Constraints:
- Admit only private rows with matching local and React oracle evidence.
- Public root compatibility remains false.
- Do not implement DOM roots or server rendering.

Verification:
- `node --check` for touched JS files
- `npm run dom-text-content:conformance --workspace @fast-react/conformance`
- Focused DOM HostText/text-content tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
