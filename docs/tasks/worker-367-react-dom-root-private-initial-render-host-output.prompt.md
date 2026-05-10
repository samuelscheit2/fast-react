# Worker 367: React DOM Root Private Initial Render Host Output

Objective: add a private React DOM root bridge handoff that applies initial
fake-DOM HostComponent/HostText output after accepted create/render admission,
with explicit cleanup and no public root behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 167, 263, 337, 338, 342, 352, and 356
if present.

Write scope: `packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/src/dom-host/mutation.js`,
`packages/react-dom/src/client/component-tree.js`,
`packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`,
focused tests, and
`worker-progress/worker-367-react-dom-root-private-initial-render-host-output.md`.

Do not modify public `react-dom/client` entrypoints.

Verification: run JS syntax checks, focused private root bridge and mutation
adapter tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
