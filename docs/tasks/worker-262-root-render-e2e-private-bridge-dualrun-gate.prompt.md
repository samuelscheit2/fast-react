You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a root render E2E private-bridge dual-run gate that records which accepted root render/update/unmount oracle rows remain blocked versus which private root-bridge request rows can be compared, without enabling public `createRoot`, DOM mutation, listener installation, hydration, or compatibility claims.

Write scope:
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/scripts/check-react-dom-root-render-e2e-conformance.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`
- `tests/conformance/package.json` if adding script metadata
- `worker-progress/worker-262-root-render-e2e-private-bridge-dualrun-gate.md`

Context to inspect:
Workers 121, 163, 167, 215, 239, 240.

Constraints:
- You are not alone in the codebase. Worker 239 owns private bridge metadata and worker 240 owns public facade blocked gating.
- Keep admitted rows private and explicit; public compatibility remains false.
- Do not implement root rendering.

Verification:
- `node --check` for touched JS files
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
- Focused root render oracle tests
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
