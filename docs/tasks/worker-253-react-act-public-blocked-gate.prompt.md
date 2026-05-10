You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add or tighten a public React `act` blocked gate that verifies current Fast React `act` behavior stays explicitly unsupported until reconciler act queue flushing, effect execution, and renderer roots are ready, without implementing public `act` compatibility.

Write scope:
- `tests/conformance/test/react-act-oracle.test.mjs`
- `tests/conformance/src/react-act-*`
- `packages/react/index.js` only if blocked metadata needs tightening
- `worker-progress/worker-253-react-act-public-blocked-gate.md`

Context to inspect:
Workers 086, 097, 176, 252, and React act oracle/generator files.

Constraints:
- You are not alone in the codebase. Worker 252 owns private reconciler act continuation metadata.
- This is a fail-closed gate unless a tiny placeholder metadata fix is necessary.
- Do not implement act flushing.

Verification:
- `node --check` for touched JS files
- Focused React act oracle/gate tests
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
