# Worker 491: Resource Stylesheet Precedence Gate

Objective: add private resource hint diagnostics for stylesheet precedence,
dedupe, and singleton ordering while keeping public resource dispatch blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 400, 432, 460, and resource/form
oracle reports if present.

Write scope: `packages/react-dom/src/resource-form-gates.js`,
`packages/react-dom/src/resource-form-internals-gate.js`, focused resource
tests, conformance resource gates if needed, and
`worker-progress/worker-491-resource-stylesheet-precedence-gate.md`.

Do not dispatch real resource hints or claim resource compatibility.

Verification: run focused React DOM resource/form tests,
`npm run check --workspace @fast-react/react-dom`, focused resource conformance
tests if touched, and `git diff --check`.
