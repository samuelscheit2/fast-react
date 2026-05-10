# Worker 457: DOM Portal Event Owner-Root Gate

Objective: add a private portal event ownership gate that records how portal
children attach to an owner root for event path diagnostics without enabling
public portal bubbling.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 181, 344, 373, 402, 430, and 434 if
present.

Write scope: `packages/react-dom/src/shared/create-portal.js`,
`packages/react-dom/src/events/plugin-event-system.js`,
`packages/react-dom/src/client/root-bridge.js`, focused portal/event tests, and
`worker-progress/worker-457-dom-portal-event-owner-root-gate.md`.

Do not enable public `createPortal` rendering, browser event bubbling, or DOM
compatibility claims.

Verification: run focused React DOM portal/event tests, `npm run check
--workspace @fast-react/react-dom`, focused portal conformance tests if touched,
and `git diff --check`.
