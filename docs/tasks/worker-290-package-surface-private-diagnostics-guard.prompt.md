You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Tighten the package-surface guard so newly accepted private diagnostics for test-renderer, React DOM root bridge, scheduler mock, and React hook/act gates cannot leak as public package exports or physical public subpaths.

Write scope:
- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/import-entrypoints.mjs`
- package `package.json` files only if the guard reveals a real accepted surface mismatch
- `worker-progress/worker-290-package-surface-private-diagnostics-guard.md`

Context to inspect:
Workers 165, 202, 231, 254, 258, 266, 277-280.

Constraints:
- Prefer guard/test changes.
- Do not add public exports.
- Keep package entrypoint smoke stable.

Verification:
- `node --check tests/smoke/package-surface-guard.mjs tests/smoke/import-entrypoints.mjs`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
