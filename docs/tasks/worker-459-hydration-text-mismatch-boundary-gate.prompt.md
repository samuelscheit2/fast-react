# Worker 459: Hydration Text Mismatch Boundary Gate

Objective: add private hydration text-mismatch boundary diagnostics that record
expected/actual text rows and recoverable-error metadata without mutating DOM or
hydrating public roots.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 169, 401, 433, 445, and 458 if
present.

Write scope: `packages/react-dom/src/client/hydration-boundary-gate.js`,
`packages/react-dom/src/client/root-bridge.js`, focused hydration tests, focused
conformance tests if needed, and
`worker-progress/worker-459-hydration-text-mismatch-boundary-gate.md`.

Do not implement DOM hydration, public recoverable-error callbacks, or public
hydrateRoot compatibility.

Verification: run focused React DOM hydration tests, `npm run check --workspace
@fast-react/react-dom`, focused conformance tests if touched, and `git diff
--check`.
