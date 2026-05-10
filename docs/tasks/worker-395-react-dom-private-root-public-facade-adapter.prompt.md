# Worker 395: React DOM Private Root Public Facade Adapter

Objective: add an explicitly private adapter behind `react-dom/client` that can
route createRoot/render/unmount calls to existing private root bridge records
for tests, while default public placeholders remain fail-closed.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 167, 310, 337, 367, 368, 369, 380,
and 381 if present.

Write scope: `packages/react-dom/client.js`,
`packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`,
`tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`,
and `worker-progress/worker-395-react-dom-private-root-public-facade-adapter.md`.

Do not make default public `createRoot` or `hydrateRoot` compatible.

Verification: run JS syntax checks, focused React DOM root bridge/public facade
tests, `npm run root-public-facade:conformance --workspace @fast-react/conformance`,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
