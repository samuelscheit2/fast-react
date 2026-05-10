# Worker 442: DOM Root Marker/Listener Public-Facade Preflight

Objective: add a public-facade preflight gate that proves root marker and root
listener setup/cleanup prerequisites for future public React DOM root execution
without installing public behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 122, 167, 170, 171, 337, 367, 395, 412,
and 427 if present.

Write scope: `packages/react-dom/src/client/root-markers.js`,
`packages/react-dom/src/events`, `packages/react-dom/src/client/root-bridge.js`,
focused public facade/root marker tests, focused conformance tests if needed,
and `worker-progress/worker-442-dom-root-marker-listener-public-facade-preflight.md`.

Do not execute public roots, hydrate, mutate browser DOM, dispatch events, or
claim public compatibility.

Verification: run JS syntax checks for touched files, focused marker/listener
and public facade tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
