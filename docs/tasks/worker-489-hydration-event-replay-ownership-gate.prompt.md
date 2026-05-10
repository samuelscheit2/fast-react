# Worker 489: Hydration Event Replay Ownership Gate

Objective: extend private hydration replay diagnostics to prove blocked event
targets retain root and dehydrated boundary ownership through drain ordering.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 401, 433, 458, and 459 if present.

Write scope: `packages/react-dom/src/client/hydration-boundary-gate.js`,
focused hydration tests, hydration conformance gates if needed, and
`worker-progress/worker-489-hydration-event-replay-ownership-gate.md`.

Do not claim public hydration or event replay compatibility.

Verification: run focused React DOM hydration tests,
`npm run check --workspace @fast-react/react-dom`, focused hydration
conformance tests if touched, and `git diff --check`.
