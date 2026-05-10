# Worker 486: React DOM Root Render Private Host Output

Objective: add a private React DOM root facade diagnostic that routes an
accepted host-output render through the bridge and fake-DOM mutation adapter
without opening public root compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 368, 395, 410, 427, 428, 442, and 454
if present.

Write scope: `packages/react-dom/client.js`,
`packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/src/dom-host/`, focused React DOM root tests, conformance
root-render gates if needed, and
`worker-progress/worker-486-react-dom-root-render-private-host-output.md`.

Do not make public `createRoot().render` compatible or mutate real DOM.

Verification: run focused React DOM root/fake-DOM tests,
`npm run check --workspace @fast-react/react-dom`, focused root-render
conformance tests if touched, and `git diff --check`.
