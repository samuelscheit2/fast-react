# Worker 340: DOM Ref Callback Private Invocation Gate

Objective: extend the private DOM ref callback attach/detach gate to record
controlled callback invocation attempts and cleanup returns under fake host
nodes, preserving public ref compatibility blockers.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 066, 174, 245, 273, 313, and 338 if
present.

Write scope: `packages/react-dom/src/client/ref-callback-gate.js`,
`packages/react-dom/src/client/component-tree.js`,
focused conformance tests, and
`worker-progress/worker-340-dom-ref-callback-private-invocation-gate.md`.

Do not wire public root commit ref invocation.

Verification: run JS syntax checks, focused DOM ref callback tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
