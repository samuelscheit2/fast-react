# Worker 344: Controlled Input Private Wrapper Metadata Gate

Objective: extend controlled input value-tracker metadata into a private
wrapper gate for input/select/textarea property payload rows, including
post-event restore blockers and no live tracker side effects.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 064, 172, 219, 271, 317, 338, and
339 if present.

Write scope: `packages/react-dom/src/resource-form-internals-gate.js`,
`packages/react-dom/src/dom-host/property-payload.js`,
`packages/react-dom/test/resource-form-unsupported-gates.test.js`,
`tests/conformance/test/dom-property-payload-helper.test.mjs`, focused tests,
and `worker-progress/worker-344-controlled-input-private-wrapper-metadata-gate.md`.

Do not implement live controlled value tracking.

Verification: run JS syntax checks, focused controlled input/resource-form and
property payload tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
