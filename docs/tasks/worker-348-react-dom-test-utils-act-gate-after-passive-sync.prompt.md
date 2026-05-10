# Worker 348: React DOM Test Utils Act Gate After Passive Sync

Objective: refresh the React DOM `test-utils.act` private routing gate after
new sync-flush/passive-effect work, recording newly present private
prerequisites while public test-utils `act` remains fail-closed.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, worker reports 253, 254, 277, 285, 303, 322, 326, and
331 if present.

Write scope: `packages/react-dom/src/test-utils-act-gate.js`,
`packages/react-dom/test-utils.js` only if metadata wiring requires it,
`tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`,
`tests/conformance/test/react-act-oracle.test.mjs`, and
`worker-progress/worker-348-react-dom-test-utils-act-gate-after-passive-sync.md`.

Do not delegate to public `React.act`.

Verification: run JS syntax checks, focused React act and React DOM test-utils
act tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
