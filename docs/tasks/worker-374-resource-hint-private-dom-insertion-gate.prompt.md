# Worker 374: Resource Hint Private DOM Insertion Gate

Objective: extend private resource-hint dispatcher diagnostics with a
fake-DOM insertion gate for one explicitly admitted preload/preconnect-style
record, keeping public resource side effects blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 172, 316, 343, 344, and 373 if present.

Write scope: `packages/react-dom/src/resource-form-internals-gate.js`,
`packages/react-dom/src/resource-form-gates.js`,
`packages/react-dom/test/resource-form-unsupported-gates.test.js`,
`tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`, focused
tests, and `worker-progress/worker-374-resource-hint-private-dom-insertion-gate.md`.

Do not mutate real browser documents or claim public resource hint behavior.

Verification: run JS syntax checks, focused resource/form tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
