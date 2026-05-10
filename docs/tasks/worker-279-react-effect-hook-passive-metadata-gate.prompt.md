You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Tighten the public React effect-hook private dispatcher gate with passive/layout/insertion metadata names aligned to accepted reconciler effect registration and passive handoff records, without executing effects, scheduling public act, or claiming compatibility.

Write scope:
- `packages/react/hook-dispatcher.js`
- `packages/react/index.js`
- `tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `worker-progress/worker-279-react-effect-hook-passive-metadata-gate.md`

Context to inspect:
Workers 157, 173, 197, 224, 225, 250, 251.

Constraints:
- Effect callbacks must never execute.
- Preserve useContext/useState private dispatcher markers.
- No DOM/test-renderer behavior changes.

Verification:
- `node --check` for touched JS files
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
