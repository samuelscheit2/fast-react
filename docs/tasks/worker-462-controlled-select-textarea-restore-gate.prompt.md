# Worker 462: Controlled Select/Textarea Restore Gate

Objective: extend controlled-input private restore diagnostics to cover select
and textarea restore intent after events using fake DOM records and latest props
metadata.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 375, 399, 431, and 454 if present.

Write scope: `packages/react-dom/src/client/controlled-restore-queue.js`,
`tests/conformance/src/dom-controlled-input-unsupported-gates.mjs`, focused
controlled input tests, and
`worker-progress/worker-462-controlled-select-textarea-restore-gate.md`.

Do not mutate real form controls, dispatch public change events, or claim
controlled component compatibility.

Verification: run focused controlled-input tests, focused controlled conformance
tests, `npm run check --workspace @fast-react/react-dom`, and `git diff
--check`.
