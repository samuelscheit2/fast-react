You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Tighten package-surface smoke coverage for `@fast-react/react-test-renderer` root, CJS, shallow, package metadata, placeholder errors, and physical no-exports subpaths without implementing new runtime behavior.

Write scope:
- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-258-react-test-renderer-package-surface-tightening.md`

Context to inspect:
Workers 083, 084, 087, 165, 202, 210, 231, 237, 255.

Constraints:
- You are not alone in the codebase. Workers 237 and 255 may change react-test-renderer package behavior; this worker should guard current accepted behavior.
- Snapshot updates must reflect actual current files.
- Do not implement runtime behavior.

Verification:
- `node --check tests/smoke/package-surface-guard.mjs`
- JSON parse check for `tests/smoke/package-surface-snapshot.json`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
