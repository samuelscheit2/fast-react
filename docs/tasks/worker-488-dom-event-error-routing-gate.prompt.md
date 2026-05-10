# Worker 488: DOM Event Error Routing Gate

Objective: add private diagnostics for event listener errors flowing to accepted
root option callback records without invoking public root callbacks.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 416, 430, 445, 455, 456, and 457 if
present.

Write scope: `packages/react-dom/src/events/`,
`packages/react-dom/src/client/root-bridge.js`, focused event/root tests,
conformance event gates if needed, and
`worker-progress/worker-488-dom-event-error-routing-gate.md`.

Do not expose public DOM event or root error callback compatibility.

Verification: run focused React DOM event/root tests,
`npm run check --workspace @fast-react/react-dom`, focused event conformance
tests if touched, and `git diff --check`.
