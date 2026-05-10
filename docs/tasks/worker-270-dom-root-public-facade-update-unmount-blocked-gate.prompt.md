You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Tighten the React DOM public root facade blocked gate for update and unmount rows after accepted private bridge/request metadata, proving public `createRoot().render` and `unmount` remain placeholder-blocked with no DOM mutation, listener installation, or compatibility claim.

Write scope:
- `tests/conformance/scripts/check-react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `worker-progress/worker-270-dom-root-public-facade-update-unmount-blocked-gate.md`

Context to inspect:
Workers 121, 163, 239, 240, 262, 269.

Constraints:
- Public rows stay blocked.
- Private rows must remain separate from public compatibility evidence.
- Do not implement `createRoot`.

Verification:
- `node --check` for touched JS files
- Focused root public facade and root render E2E tests
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
