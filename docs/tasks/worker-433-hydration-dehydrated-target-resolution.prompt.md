# Worker 433: Hydration Dehydrated Target Resolution Gate

Objective: add a private hydration target-resolution gate that records
dehydrated root/boundary ownership and hydratable event target lookup without
draining replay queues.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 169, 218, 246, 341, 372, and 401 if
present.

Write scope: `packages/react-dom/src/client`,
`packages/react-dom/src/events`, focused hydration tests, focused conformance
gates if needed, and
`worker-progress/worker-433-hydration-dehydrated-target-resolution.md`.

Do not enable public `hydrateRoot`, execute replay queues, mutate DOM, or claim
hydration compatibility.

Verification: run JS syntax checks for touched files, focused hydration tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
