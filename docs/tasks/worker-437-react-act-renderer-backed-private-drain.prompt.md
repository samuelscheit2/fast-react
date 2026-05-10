# Worker 437: React Act Renderer-Backed Private Drain

Objective: add a private React act gate that can consume renderer-backed act
drain diagnostics from Scheduler/reconciler metadata without opening public
`React.act`.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 176, 253, 277, 390, 404, 405, 422, and
436 if present.

Write scope: `packages/react`, `tests/conformance/test/react-act-oracle.test.mjs`,
focused act tests, package-surface snapshots if required, and
`worker-progress/worker-437-react-act-renderer-backed-private-drain.md`.

Do not change react-test-renderer act, React DOM test-utils act, public
thenable/warning behavior, or public act compatibility.

Verification: run JS syntax checks for touched files, focused React act tests,
`npm run check --workspace @fast-react/react`, `npm run check:package-surface`
if surfaces change, and `git diff --check`.
