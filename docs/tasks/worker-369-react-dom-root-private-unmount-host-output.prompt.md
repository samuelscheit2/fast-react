# Worker 369: React DOM Root Private Unmount Host Output

Objective: add private React DOM root bridge unmount host-output cleanup that
clears fake-DOM children, detaches component-tree metadata, and reverts root
marker/listener side effects deterministically.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 168, 325, 338, 342, 352, 367, and 368
if present.

Write scope: `packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/src/client/component-tree.js`,
`packages/react-dom/src/dom-host/mutation.js`,
`packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`,
focused tests, and
`worker-progress/worker-369-react-dom-root-private-unmount-host-output.md`.

Do not claim public unmount behavior.

Verification: run JS syntax checks, focused root bridge/component-tree/mutation
tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
