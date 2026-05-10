# Worker 472: Root Update Benchmark Timing Canaries

Objective: add diagnostic-only benchmark timing canaries for private root
update, text reset, event dispatch, and passive flush gates while public timing
comparability remains blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 407, 439, 441, 449, 453, 454, and 455
if present.

Write scope: `tests/benchmarks`, focused benchmark tests, and
`worker-progress/worker-472-benchmark-root-update-timing-canaries.md`.

Do not claim comparable public performance, write result artifacts, or promote
blocked scenarios to green compatibility.

Verification: run `npm run check:benchmarks`, focused benchmark tests, `npm run
check:js` if manifests change broadly, and `git diff --check`.
