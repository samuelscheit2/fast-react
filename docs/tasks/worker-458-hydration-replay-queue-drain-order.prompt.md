# Worker 458: Hydration Replay Queue Drain-Order Gate

Objective: add private hydration replay queue drain-order diagnostics that keep
blocked events ordered by dehydrated target/root metadata without replaying
public events.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 169, 372, 401, 433, and 442 if
present.

Write scope: `packages/react-dom/src/client/hydration-boundary-gate.js`,
`packages/react-dom/src/client/hydration-marker-parser.js`,
`packages/react-dom/src/events/plugin-event-system.js`, focused hydration
tests, and `worker-progress/worker-458-hydration-replay-queue-drain-order.md`.

Do not hydrate real DOM, replay real events, or claim hydration compatibility.

Verification: run focused React DOM hydration tests, `npm run check --workspace
@fast-react/react-dom`, focused hydration conformance tests if touched, and
`git diff --check`.
