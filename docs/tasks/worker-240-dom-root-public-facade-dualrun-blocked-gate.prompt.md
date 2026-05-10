You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a fail-closed dual-run gate for public React DOM root facade behavior that compares accepted oracle prerequisites and current Fast React placeholder/root-bridge boundaries, while keeping `createRoot`, `hydrateRoot`, render, unmount, DOM mutation, listener setup, and compatibility claims blocked.

Write scope:
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- New/focused root facade blocked gate script/test if needed
- `tests/conformance/package.json` if adding a script
- `worker-progress/worker-240-dom-root-public-facade-dualrun-blocked-gate.md`

Context to inspect:
Workers 046, 054, 121, 122, 163, 167, 215, 239, 262.

Constraints:
- You are not alone in the codebase. This is a gate worker; do not implement runtime root behavior.
- Keep scenario admission explicit and compatibility false.
- Avoid editing package runtime files unless needed to expose current blocked metadata without behavior.

Verification:
- `node --check` for touched JS files
- Focused root facade gate command/test
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
