# Worker 379: Benchmark Private Host Output Admissions Refresh

Objective: refresh benchmark manifests after accepted private host-output/root
diagnostics so benchmark rows remain diagnostic, fail-closed, and linked to
green conformance gates.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 162, 320, 347, 352, 367, 368, 369, and
378 if present.

Write scope: `tests/benchmarks/manifests/*.json`,
`tests/benchmarks/src/benchmark-gate.mjs`,
`tests/benchmarks/test/benchmark-gate.test.mjs`, focused tests, and
`worker-progress/worker-379-benchmark-private-host-output-admissions-refresh.md`.

Do not add performance claims or timing pass criteria for unproven public
compatibility.

Verification: run `npm run check:benchmarks`, relevant focused conformance
checks for referenced gates, `npm run check:js`, and `git diff --check`.
