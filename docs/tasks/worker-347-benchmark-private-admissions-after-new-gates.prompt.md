# Worker 347: Benchmark Private Admissions After New Gates

Objective: refresh benchmark private diagnostic admissions after any accepted
new private gates in this queue, keeping all public timing and compatibility
rows blocked unless matching conformance evidence is green.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, worker reports 162, 257, 289, 320, and any new reports
323-346 present in the branch.

Write scope: `tests/benchmarks/manifests/*.json`,
`tests/benchmarks/src/benchmark-gate.mjs`,
`tests/benchmarks/test/benchmark-gate.test.mjs`, and
`worker-progress/worker-347-benchmark-private-admissions-after-new-gates.md`.

Do not add result artifacts or green timing claims.

Verification: run `node --check` on touched JS, `npm run check:benchmarks`,
`npm run check:js`, and `git diff --check`.
