# Worker 341: Hydration Marker Root Bridge Replay Boundary

Objective: refresh the private hydration marker/root bridge boundary so
hydrateRoot records carry marker parser evidence and event replay blockers
after accepted root and event gates, without opening public hydration.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 049, 169, 218, 246, 275, 314, 337,
and 339 if present.

Write scope: `packages/react-dom/src/client/hydration-boundary-gate.js`,
`packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/test/hydration-boundary.test.js`, focused tests, and
`worker-progress/worker-341-hydration-marker-root-bridge-replay-boundary.md`.

Do not implement public hydration or event replay.

Verification: run JS syntax checks, focused hydration boundary tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
