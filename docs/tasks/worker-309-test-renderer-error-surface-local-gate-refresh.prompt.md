You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Refresh the react-test-renderer error-surface local gate after accepted create/update/unmount, serialization, TestInstance, and act private gates. Admit only private diagnostic rows and keep public error behavior compatibility blocked.

Write scope:
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `worker-progress/worker-309-test-renderer-error-surface-local-gate-refresh.md`

Context to inspect:
Workers 265, 267, 268, 291, 304-308 if present.

Constraints:
- Do not regenerate checked React oracles unless the test explicitly proves byte-stable output.
- No public compatibility claims.
- Keep public shallow/test instance error surfaces blocked.

Verification:
- Focused react-test-renderer error, create routing, and serialization tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
