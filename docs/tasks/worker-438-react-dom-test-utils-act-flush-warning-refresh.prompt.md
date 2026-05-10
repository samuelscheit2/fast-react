# Worker 438: React DOM Test-Utils Act Flush/Warning Refresh

Objective: refresh the private React DOM test-utils act gate so it recognizes
new private flushSync and warning-boundary root-output prerequisites without
opening public `react-dom/test-utils.act`.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 254, 322, 348, 382, 406, 410, 411, 412,
and 437 if present.

Write scope: `packages/react-dom/test-utils.js`,
`tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`, focused
test-utils act gates, package-surface snapshots if required, and
`worker-progress/worker-438-react-dom-test-utils-act-flush-warning-refresh.md`.

Do not open public React act, React DOM public root execution, or test-utils act
compatibility.

Verification: run JS syntax checks for touched files, focused test-utils act
tests, `npm run check --workspace @fast-react/react-dom`,
`npm run check:package-surface` if surfaces change, and `git diff --check`.
