# Worker 416: Ref Callback Error Routing Private Records

Objective: add private root error routing records for callback ref attach and
cleanup-return exceptions, proving captured error metadata without invoking
public root error callbacks.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 161, 245, 313, 340, 371, 385, and 398
if present.

Write scope: `packages/react-dom/src/client/ref-callback-gate.js`,
`packages/react-dom/src/client/root-bridge.js`, focused React DOM ref/root error
tests, focused conformance tests, and
`worker-progress/worker-416-ref-callback-error-routing-private.md`.

Do not alter cleanup handle storage, public root callbacks, or public React DOM
compatibility.

Verification: run JS syntax checks for touched files, focused ref/root-bridge
tests, `npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
