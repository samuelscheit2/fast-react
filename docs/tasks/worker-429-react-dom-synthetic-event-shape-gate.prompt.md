# Worker 429: React DOM SyntheticEvent Shape Gate

Objective: add a private SyntheticEvent shape gate for root-output event
diagnostics, covering target/currentTarget/defaultPrevented fields without
broad dispatch queue processing.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 170, 339, 370, 397, and 401 if present.

Write scope: `packages/react-dom/src/events`,
`packages/react-dom/src/client/root-bridge.js`, focused event tests, focused
event conformance gates if needed, and
`worker-progress/worker-429-react-dom-synthetic-event-shape-gate.md`.

Do not change propagation stop, listener error routing, hydration replay, portal
retargeting, or public event compatibility.

Verification: run JS syntax checks for touched files, focused React DOM event
tests, `npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
