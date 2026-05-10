You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Integrate the private hydration container marker parser with the React DOM root marker/listener guard diagnostics so hydrateRoot remains unsupported but container marker evidence is deterministic and fail-closed.

Write scope:
- `packages/react-dom/src/client/root-listener.js`
- `packages/react-dom/src/client/hydration-boundary.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`
- `worker-progress/worker-275-hydration-marker-root-bridge-gate.md`

Context to inspect:
Workers 122, 169, 218, 246.

Constraints:
- Do not implement hydrateRoot.
- No DOM mutation or event replay.
- Keep public compatibility false.

Verification:
- `node --check` for touched JS files
- Focused hydration/root marker tests
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
