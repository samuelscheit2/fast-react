# Worker 396: React DOM Host Output Attribute Update Gate

Objective: extend the private React DOM host-output update handoff to cover
ordinary attribute/style update and removal rows backed by property-payload
evidence, not just the current narrow text canary.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 186, 213, 271, 337, 368, and 375 if
present.

Write scope: `packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/src/dom-host/property-payload.js`,
`packages/react-dom/src/dom-host/mutation.js`,
`packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`, focused
property/mutation tests, and
`worker-progress/worker-396-react-dom-host-output-attribute-update-gate.md`.

Keep browser DOM compatibility, events, refs, hydration, and public roots
blocked.

Verification: run JS syntax checks, focused React DOM root bridge and
property-payload tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
