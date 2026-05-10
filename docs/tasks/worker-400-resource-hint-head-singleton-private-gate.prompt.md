# Worker 400: Resource Hint Head Singleton Private Gate

Objective: extend resource hint private fake-DOM diagnostics to cover a
head-singleton insertion/update boundary while keeping public resource and
singleton behavior blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 172, 260, 316, 374, and 375 if
present.

Write scope: `packages/react-dom/src/resource-form-gates.js`,
`packages/react-dom/src/resource-form-internals-gate.js`,
`packages/react-dom/test/resource-form-unsupported-gates.test.js`,
`tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`, and
`worker-progress/worker-400-resource-hint-head-singleton-private-gate.md`.

Do not dispatch public resource hints, mutate real documents, or claim
compatibility.

Verification: run JS syntax checks, focused resource/form and resource-hint
tests, `npm run check --workspace @fast-react/react-dom`, and
`git diff --check`.
