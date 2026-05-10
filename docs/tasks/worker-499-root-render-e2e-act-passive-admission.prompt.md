# Worker 499: Root Render E2E Act/Passive Admission

Objective: add private root-render E2E admission rows for accepted act/passive
diagnostics while public root render and act compatibility remain blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 410, 441, 473, 474, 475, and 486 if
present.

Write scope: `tests/conformance/src/root-render-e2e-*`,
`tests/conformance/test/root-render-e2e-*.test.mjs`, focused root-render tests,
and `worker-progress/worker-499-root-render-e2e-act-passive-admission.md`.

Do not open public root render, `flushSync`, or `act` compatibility.

Verification: run focused root-render E2E conformance tests,
`npm run check --workspace @fast-react/conformance` if practical, and `git diff
--check`.
