# Worker 338: DOM Mutation Latest Props Commit Handoff

Objective: connect private DOM property payload mutation application to the
component-tree latest-props handoff for admitted fake-DOM rows, with rollback
on unsupported payloads and no public root compatibility claim.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 186, 238, 271, 272, 292, and 311.

Write scope: `packages/react-dom/src/dom-host/mutation.js`,
`packages/react-dom/src/dom-host/property-payload.js`,
`packages/react-dom/src/client/component-tree.js`, focused tests, and
`worker-progress/worker-338-dom-mutation-latest-props-commit-handoff.md`.

Do not touch public React DOM client facades.

Verification: run JS syntax checks, focused DOM property/mutation smoke tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
