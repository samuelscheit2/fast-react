# Worker 434: Portal preparePortalMount Listener Gate

Objective: add a private `preparePortalMount` listener admission gate that
records portal container listener intent without enabling public portal mount
behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 181, 315, 342, 373, 402, and 412 if
present.

Write scope: `packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/src/events`, focused portal/root bridge tests, focused
portal conformance gates if needed, and
`worker-progress/worker-434-portal-prepare-mount-listener-gate.md`.

Do not mutate real portal containers, reconcile portal children broadly, or
claim public portal compatibility.

Verification: run JS syntax checks for touched files, focused portal/root
bridge tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
