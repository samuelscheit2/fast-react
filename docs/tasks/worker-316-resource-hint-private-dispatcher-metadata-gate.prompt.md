You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private resource hint dispatcher metadata gate for React DOM resource APIs. It should validate preload/preinit/preconnect request shapes and keep all resource dispatch side effects blocked.

Write scope:
- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `worker-progress/worker-316-resource-hint-private-dispatcher-metadata-gate.md`

Context to inspect:
Workers 172, 260, 276, and resource hint oracle tests.

Constraints:
- Public resource APIs keep accepted shape but do not dispatch.
- No document/head mutation, stylesheet precedence, or Fizz integration.
- Keep source adapter blockers explicit.

Verification:
- `node --check` for touched JS files
- Focused resource/form unsupported gate tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
