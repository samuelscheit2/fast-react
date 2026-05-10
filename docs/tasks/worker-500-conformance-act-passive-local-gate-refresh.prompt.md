# Worker 500: Conformance Act/Passive Local Gate Refresh

Objective: refresh conformance local gates so accepted private act/passive
diagnostics from this queue are recognized without broad compatibility claims.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 473-475, 482, 483, and 498 if present.

Write scope: `tests/conformance/src/`, `tests/conformance/test/`, focused
conformance tests, and
`worker-progress/worker-500-conformance-act-passive-local-gate-refresh.md`.

Do not regenerate React oracle artifacts unless required and documented.

Verification: run focused conformance tests, `npm run check --workspace
@fast-react/conformance` if practical, and `git diff --check`.
