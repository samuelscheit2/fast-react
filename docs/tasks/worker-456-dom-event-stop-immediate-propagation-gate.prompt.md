# Worker 456: DOM Event Stop-Immediate-Propagation Gate

Objective: add private event diagnostics for stopPropagation and native
stopImmediatePropagation interactions across same-target and ancestor listener
queues.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 170, 370, 397, 429, 430, and 455 if
present.

Write scope: `packages/react-dom/src/events/dispatch.js`,
`packages/react-dom/src/events/listener-registry.js`,
`packages/react-dom/src/events/plugin-event-system.js`, focused event tests,
and `worker-progress/worker-456-dom-event-stop-immediate-propagation-gate.md`.

Do not install public listeners, dispatch browser events, or claim event
compatibility.

Verification: run focused React DOM event tests, focused event conformance
tests if touched, `npm run check --workspace @fast-react/react-dom`, and `git
diff --check`.
