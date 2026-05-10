# Worker 339: DOM Event Plugin Target Dispatch Path

Objective: advance the private event plugin skeleton so admitted fake DOM
events can resolve component-tree targets and record listener dispatch metadata
without public event compatibility or browser DOM claims.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 065, 170, 171, 274, 312, and 338 if
present.

Write scope: `packages/react-dom/src/events/plugin-event-system.js`,
`packages/react-dom/src/events/root-listeners.js`,
`packages/react-dom/src/client/component-tree.js`, focused tests, and
`worker-progress/worker-339-dom-event-plugin-target-dispatch-path.md`.

Keep public React DOM root/event behavior blocked.

Verification: run JS syntax checks, focused event dispatch/plugin tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
