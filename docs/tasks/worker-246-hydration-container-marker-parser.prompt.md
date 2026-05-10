You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private hydration container marker parser/diagnostic gate for accepted React DOM hydration marker evidence, keeping `hydrateRoot`, event replay, DOM mutation, Suspense hydration, root scheduling, and compatibility claims unsupported.

Write scope:
- `packages/react-dom/src/client/*hydration*` or new private hydration helper
- `tests/conformance/src/react-dom-hydration-boundary-*`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-246-hydration-container-marker-parser.md`

Context to inspect:
Workers 049, 088, 122, 169, 218, and hydration marker oracle files.

Constraints:
- You are not alone in the codebase. Keep parser read-only and private.
- Do not implement public `hydrateRoot` behavior or mutate containers.
- Preserve existing fail-closed invalid-container behavior.

Verification:
- `node --check` for touched JS files
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
