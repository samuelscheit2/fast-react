You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Harden package-surface guards for new private gate/source files so private diagnostics, bridge, metadata, dispatcher, and gate modules remain direct-file-only test fixtures and are not exported through package maps or public runtime keys.

Write scope:
- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/import-entrypoints.mjs`
- `packages/react/package.json`
- `packages/react-dom/package.json`
- `packages/react-test-renderer/package.json`
- `bindings/node/package.json`
- `worker-progress/worker-321-package-surface-private-file-blocklist-hardening.md`

Context to inspect:
Workers 165, 258, 290, and accepted private files added by workers 277-320.

Constraints:
- Do not add private files to public exports.
- Preserve accepted runtime key snapshots.
- If direct private files are intentionally loadable for tests, prove they are blocked as package subpaths.

Verification:
- `node --check` for touched JS files
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
