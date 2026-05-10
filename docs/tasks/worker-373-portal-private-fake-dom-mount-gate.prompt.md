# Worker 373: Portal Private Fake DOM Mount Gate

Objective: extend the private portal commit boundary from metadata-only to a
fake-DOM mount diagnostic for an explicit portal HostComponent/HostText child,
while keeping public portal mounting blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 181, 315, 342, 352, and 367 if present.

Write scope: `packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/src/shared/create-portal.js`,
`packages/react-dom/src/resource-form-gates.js`,
`packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`,
`tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`, focused
tests, and `worker-progress/worker-373-portal-private-fake-dom-mount-gate.md`.

Do not claim public `createPortal` render compatibility.

Verification: run JS syntax checks, focused portal/root bridge/resource tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
