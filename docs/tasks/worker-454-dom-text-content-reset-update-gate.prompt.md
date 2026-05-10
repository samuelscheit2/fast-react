# Worker 454: DOM Text-Content Reset/Update Gate

Objective: add a private fake-DOM gate for text-content reset and update
ordering when host children switch between text and element children.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 110, 152, 154, 323, 396, and 428 if
present.

Write scope: `packages/react-dom/src/dom-host/text-content.js`,
`packages/react-dom/src/dom-host/mutation.js`,
`tests/conformance/src/dom-text-content-local-gate.mjs`, focused tests, and
`worker-progress/worker-454-dom-text-content-reset-update-gate.md`.

Do not implement public DOM child diffing, browser DOM mutation, or public root
compatibility.

Verification: run `npm run dom-text-content:conformance --workspace
@fast-react/conformance` if available, focused React DOM text-content tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
