# Worker 336: Test Renderer Error Surface Public Blockers Refresh

Objective: refresh the react-test-renderer error-surface local gate after the
new private root, TestInstance, serialization, and act work, admitting only
private diagnostics and keeping every public error-surface scenario blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 210, 267, 268, 291, 309, 332, 333,
334, and 335 if present.

Write scope: `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`,
`tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`,
react-test-renderer JS gate metadata if required, and
`worker-progress/worker-336-test-renderer-error-surface-public-blockers-refresh.md`.

Do not implement public error behavior.

Verification: run focused error-surface/create-routing tests,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
