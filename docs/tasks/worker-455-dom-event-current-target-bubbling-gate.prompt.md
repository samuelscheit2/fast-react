# Worker 455: DOM Event currentTarget Bubbling Gate

Objective: extend private event dispatch diagnostics so capture/bubble
listeners observe React-shaped `currentTarget` progression and post-dispatch
reset on fake DOM nodes.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 170, 370, 397, 429, and 430 if
present.

Write scope: `packages/react-dom/src/events/dispatch.js`,
`packages/react-dom/src/events/plugin-event-system.js`,
`packages/react-dom/src/events/react-dom-event-listener.js`, focused event
tests, and
`worker-progress/worker-455-dom-event-current-target-bubbling-gate.md`.

Do not install browser listeners, dispatch real DOM events, or claim public
event compatibility.

Verification: run focused React DOM event tests, focused event conformance
tests if touched, `npm run check --workspace @fast-react/react-dom`, and `git
diff --check`.
