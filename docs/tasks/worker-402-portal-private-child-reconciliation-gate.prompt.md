# Worker 402: Portal Private Child Reconciliation Gate

Objective: add a private portal child reconciliation diagnostic that can admit
one fake-DOM HostComponent update inside an accepted portal boundary while
public portal mounting remains blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 181, 342, 373, 380, and 381 if
present.

Write scope: `packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/src/shared/create-portal.js`,
`packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`,
`tests/conformance/test/react-dom-create-portal-local-gate.test.mjs`, and
`worker-progress/worker-402-portal-private-child-reconciliation-gate.md`.

Do not claim public portal mounting, listener setup, DOM mutation, or root
compatibility.

Verification: run JS syntax checks, focused portal/root bridge tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
