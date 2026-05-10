You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Close or explicitly justify the private `shouldSetTextContent` predicate gaps currently skipped by the DOM text dual-run gate, especially BigInt, `textarea`, and `noscript`, using accepted React DOM oracle evidence while keeping public roots, server rendering, HostText commit, DOM mutation, and compatibility claims blocked.

Write scope:
- `packages/react-dom/src/dom-host/text-content.js`
- `tests/conformance/src/dom-text-content-conformance-gate.mjs`
- `tests/conformance/test/dom-text-content-oracle.test.mjs`
- `worker-progress/worker-241-dom-text-content-private-predicate-gaps.md`

Context to inspect:
Workers 110, 154, 201, 211, 230, and React source `ReactFiberConfigDOM.js` text-content logic.

Constraints:
- You are not alone in the codebase. Worker 261 may add HostText commit gates; keep this predicate-focused.
- Admit rows only when local behavior actually matches the checked oracle.
- Keep public compatibility false.

Verification:
- `node --check` for touched JS files
- `npm run dom-text-content:conformance --workspace @fast-react/conformance`
- `node --test tests/conformance/test/dom-text-content-oracle.test.mjs`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
