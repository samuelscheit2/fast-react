# Worker 337: React DOM Root Private Create/Render Admission

Objective: add a private React DOM root admission path that combines accepted
createRoot mark/listen records with private root bridge create/render records
without exposing public root objects or mutating real DOM.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 167, 215, 239, 240, 269, 310, 315,
and 318.

Write scope: `packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/src/client/dom-container.js`,
`packages/react-dom/src/client/root-markers.js`, focused tests, and
`worker-progress/worker-337-react-dom-root-private-create-render-admission.md`.

Do not change public `react-dom/client` export behavior.

Verification: run JS syntax checks, focused React DOM root/private bridge
tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
