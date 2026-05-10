# Worker 397: React DOM Event Invocation From Private Root Output

Objective: connect the private event listener invocation path to private root
host-output component-tree metadata so a fake click dispatch can prove capture
and bubble ordering without public event compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 170, 245, 293, 337, 370, and 395 if
present.

Write scope: `packages/react-dom/src/events/plugin-event-system.js`,
`packages/react-dom/src/events/root-listeners.js`,
`packages/react-dom/src/client/component-tree.js`, focused event tests, and
`worker-progress/worker-397-react-dom-event-invocation-from-private-root-output.md`.

Do not install public browser listeners or claim synthetic event compatibility.

Verification: run JS syntax checks, focused event delegation/plugin tests,
`node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
