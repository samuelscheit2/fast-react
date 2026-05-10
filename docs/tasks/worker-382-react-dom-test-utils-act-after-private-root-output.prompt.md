# Worker 382: React DOM Test Utils Act After Private Root Output

Objective: refresh the React DOM `test-utils` act private gate after new
private root output, sync-flush, passive, and scheduler evidence, while keeping
public `act` and public root execution blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 176, 252, 285, 322, 331, 348, 357, 361,
362, 367, 368, and 369 if present.

Write scope: `packages/react-dom/src/test-utils-act-gate.js`,
`packages/react-dom/test-utils.js`,
`tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`,
focused tests, and
`worker-progress/worker-382-react-dom-test-utils-act-after-private-root-output.md`.

Do not expose public act compatibility or execute public React DOM roots.

Verification: run JS syntax checks, focused react-dom test-utils act tests,
`npm run check --workspace @fast-react/react-dom`, `npm run check:js`, and
`git diff --check`.
