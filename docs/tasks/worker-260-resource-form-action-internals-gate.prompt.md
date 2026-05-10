You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private resource/form action internals gate that keeps accepted React DOM resource hint, singleton, form action, and controlled form behavior unsupported with deterministic metadata, without dispatching resources, submitting forms, tracking controls, public roots, or compatibility claims.

Write scope:
- `packages/react-dom/src/*resource*`
- `packages/react-dom/src/*form*`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- Focused conformance unsupported gate files if needed
- `worker-progress/worker-260-resource-form-action-internals-gate.md`

Context to inspect:
Workers 059, 060, 064, 172, 219, 231.

Constraints:
- You are not alone in the codebase. Keep this fail-closed and metadata-only.
- Do not implement resource side effects or form submission/reset behavior.
- Preserve public package placeholders unless tightening error metadata is necessary.

Verification:
- `node --check` for touched JS files
- `npm run check --workspace @fast-react/react-dom`
- Focused resource/form conformance tests if touched
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
