# Worker 370: React DOM Event Listener Invocation Private

Objective: extend private React DOM event dispatch diagnostics from target path
and listener metadata to a controlled single-listener invocation canary, keeping
SyntheticEvent and public dispatch blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 170, 171, 239, 270, 311, 339, and 367
if present.

Write scope: `packages/react-dom/src/events/plugin-event-system.js`,
`packages/react-dom/src/events/dispatch.js`,
`packages/react-dom/src/events/root-listeners.js`,
`tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`,
focused tests, and
`worker-progress/worker-370-react-dom-event-listener-invocation-private.md`.

Do not claim browser DOM event compatibility or implement full SyntheticEvent.

Verification: run JS syntax checks, focused event/root-listener tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
