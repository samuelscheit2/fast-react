# Worker 372: Hydration Marker Replay Queue Private

Objective: add private hydration marker replay-queue diagnostics tied to root
bridge marker/listener state, preserving fail-closed public `hydrateRoot` and
event replay behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 169, 244, 272, 314, 341, 352, and 367
if present.

Write scope: `packages/react-dom/src/client/hydration-boundary-gate.js`,
`packages/react-dom/src/client/hydration-marker-parser.js`,
`packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/test/hydration-boundary.test.js`,
`tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`, focused
tests, and
`worker-progress/worker-372-hydration-marker-replay-queue-private.md`.

Do not implement public hydration or event replay.

Verification: run JS syntax checks, focused hydration/root bridge tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
