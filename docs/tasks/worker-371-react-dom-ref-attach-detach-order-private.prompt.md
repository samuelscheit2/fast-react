# Worker 371: React DOM Ref Attach Detach Order Private

Objective: add private React DOM ref attach/detach ordering diagnostics across
host-output update/unmount canaries, proving callback identity and cleanup
without public root execution.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 174, 245, 271, 340, 367, 368, and 369
if present.

Write scope: `packages/react-dom/src/client/ref-callback-gate.js`,
`packages/react-dom/src/client/root-bridge.js`,
`tests/conformance/test/react-dom-ref-callback-oracle.test.mjs`,
focused tests, and
`worker-progress/worker-371-react-dom-ref-attach-detach-order-private.md`.

Do not expose public ref callback invocation through `react-dom/client`.

Verification: run JS syntax checks, focused ref/root bridge tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
