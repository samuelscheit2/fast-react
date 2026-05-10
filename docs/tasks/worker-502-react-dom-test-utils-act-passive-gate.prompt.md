# Worker 502: React DOM Test Utils Act Passive Gate

Objective: add private `react-dom/test-utils.act` diagnostics that recognize
accepted passive and root-output metadata while public test-utils act stays
blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 406, 438, 473, 474, 475, and 486 if
present.

Write scope: `packages/react-dom/test-utils.js`,
`packages/react-dom/src/test-utils-act-gate.js`, focused React DOM test-utils
tests, conformance test-utils act gates if needed, and
`worker-progress/worker-502-react-dom-test-utils-act-passive-gate.md`.

Do not open public `react-dom/test-utils.act` compatibility.

Verification: run focused React DOM test-utils tests,
`npm run check --workspace @fast-react/react-dom`, focused test-utils act
conformance tests if touched, and `git diff --check`.
