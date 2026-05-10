# Worker 406: React DOM Test Utils Act Private Root Output

Objective: make the React DOM test-utils act private gate recognize accepted
private root host-output diagnostics as blocked prerequisites without opening
public `react-dom/test-utils.act`.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 282, 322, 382, 390, and 405 if
present.

Write scope: `packages/react-dom/test-utils.js`,
`packages/react-dom/src/test-utils-act-gate.js`,
`tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`, focused
React DOM test-utils tests, and
`worker-progress/worker-406-react-dom-test-utils-act-private-root-output.md`.

Do not enable public act callback execution, effects, DOM mutation, or
compatibility claims.

Verification: run JS syntax checks, focused test-utils act tests,
`npm run check --workspace @fast-react/react-dom`, `npm run check:js`, and
`git diff --check`.
