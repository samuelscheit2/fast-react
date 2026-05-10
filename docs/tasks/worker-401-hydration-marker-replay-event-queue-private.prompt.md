# Worker 401: Hydration Marker Replay Event Queue Private

Objective: add a private hydration marker replay queue diagnostic that records
blocked event replay targets and ordering without hydrating host instances or
installing public event replay behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 169, 275, 341, 372, and 397 if
present.

Write scope: `packages/react-dom/src/client/hydration-boundary-gate.js`,
`packages/react-dom/src/events/plugin-event-system.js`,
`packages/react-dom/test/hydration-boundary.test.js`,
`tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`, and
`worker-progress/worker-401-hydration-marker-replay-event-queue-private.md`.

Do not implement public `hydrateRoot`, DOM hydration, Suspense hydration, or
event replay compatibility.

Verification: run JS syntax checks, focused hydration boundary/replay tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
