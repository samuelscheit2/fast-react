# Worker 415: Ref Callback Cleanup Handle Store

Objective: add a private cleanup-return handle store so callback ref attach
returns can be recorded and later consumed by detach metadata without tests
passing cleanup functions directly.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 245, 340, 371, 385, and 398 if present.

Write scope: `packages/react-dom/src/client/ref-callback-gate.js`,
`packages/react-dom/src/client/root-bridge.js`, focused React DOM ref tests,
focused DOM ref conformance tests, and
`worker-progress/worker-415-ref-callback-cleanup-handle-store.md`.

Keep object refs, public root execution, and public React DOM ref compatibility
blocked.

Verification: run JS syntax checks for touched files, focused ref/root-bridge
tests, `npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
