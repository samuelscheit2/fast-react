# Worker 368: React DOM Root Private Update Host Output

Objective: extend private React DOM root bridge host-output handoff to a narrow
update path that mutates fake-DOM props/text and publishes latest props only
after successful mutation.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 154, 168, 338, 352, 367 if present.

Write scope: `packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/src/dom-host/mutation.js`,
`packages/react-dom/src/client/component-tree.js`,
`packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`,
`tests/smoke/react-dom-mutation-adapter-shell.mjs`, focused tests, and
`worker-progress/worker-368-react-dom-root-private-update-host-output.md`.

Do not expose public render/update compatibility.

Verification: run JS syntax checks, focused root bridge/mutation/component-tree
tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
