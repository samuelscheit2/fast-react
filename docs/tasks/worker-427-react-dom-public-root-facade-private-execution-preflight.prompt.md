# Worker 427: React DOM Public Root Facade Private Execution Preflight

Objective: add a public-shaped React DOM root facade preflight that can route
createRoot/render/unmount calls into accepted private bridge diagnostics without
opening public compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 239, 240, 337, 367, 368, 369, 395, 410,
411, and 412 if present.

Write scope: `packages/react-dom/client.js`,
`packages/react-dom/src/client/root-bridge.js`, focused public-facade blocked
gate tests, package-surface snapshots if required, and
`worker-progress/worker-427-react-dom-public-root-facade-private-execution-preflight.md`.

Do not mutate real DOM, install public listeners, hydrate, or admit public root
compatibility.

Verification: run JS syntax checks for touched files, focused public facade
blocked tests, `npm run check --workspace @fast-react/react-dom`,
`npm run check:package-surface`, and `git diff --check`.
