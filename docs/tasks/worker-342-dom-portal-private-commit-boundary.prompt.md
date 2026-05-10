# Worker 342: DOM Portal Private Commit Boundary

Objective: advance private portal boundary records toward a fake-DOM commit
handoff that validates portal container ownership and blocked listener/resource
side effects while preserving public portal mounting blockers.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 181, 189, 276, 315, 337, and 338 if
present.

Write scope: `packages/react-dom/src/resource-form-gates.js`,
`packages/react-dom/src/client/root-bridge.js`,
`tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`, focused
tests, and `worker-progress/worker-342-dom-portal-private-commit-boundary.md`.

Do not alter public `createPortal` object shape.

Verification: run JS syntax checks, focused portal/root bridge tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
