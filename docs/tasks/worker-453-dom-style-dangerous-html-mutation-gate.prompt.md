# Worker 453: DOM Style and dangerousHTML Mutation Gate

Objective: extend the private DOM mutation adapter so admitted style and
`dangerouslySetInnerHTML` property payload rows can mutate fake DOM records with
rollback diagnostics while public DOM behavior remains blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 186, 324, 396, 428, and 440 if
present.

Write scope: `packages/react-dom/src/dom-host/property-payload.js`,
`packages/react-dom/src/dom-host/mutation.js`, focused React DOM mutation tests,
focused conformance tests if needed, and
`worker-progress/worker-453-dom-style-dangerous-html-mutation-gate.md`.

Do not mutate real browser DOM, open public root rendering, or claim style/HTML
compatibility.

Verification: run focused React DOM property/mutation tests, `npm run check
--workspace @fast-react/react-dom`, focused conformance tests if touched, and
`git diff --check`.
