# Worker 428: React DOM Root Commit Update Handoff

Objective: add a private React DOM handoff that consumes accepted root commit
HostComponent update metadata from the reconciler-shaped records and applies it
through the existing fake-DOM mutation/latest-props helpers.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 238, 263, 311, 338, 368, 383, 396, and
413 if present.

Write scope: `packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/src/dom-host`, focused React DOM mutation/root bridge tests,
focused conformance gates if needed, and
`worker-progress/worker-428-react-dom-root-commit-update-handoff.md`.

Do not change event dispatch, refs, controlled inputs, resources, hydration, or
public React DOM root behavior.

Verification: run JS syntax checks for touched files, focused root bridge and
mutation tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
