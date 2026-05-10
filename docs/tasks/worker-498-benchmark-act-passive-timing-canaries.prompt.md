# Worker 498: Benchmark Act/Passive Timing Canaries

Objective: add benchmark manifest/test canaries for private act passive-drain
and passive effect timing diagnostics while keeping all public timing claims
blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 407, 439, 472, 473, 474, and 475 if
present.

Write scope: `tests/benchmarks/manifests/`, `tests/benchmarks/test/`, benchmark
docs if needed, and
`worker-progress/worker-498-benchmark-act-passive-timing-canaries.md`.

Do not add result artifacts or claim comparable performance.

Verification: run `npm run check:benchmarks`, focused benchmark tests if added,
`npm run check:js` if manifests change broadly, and `git diff --check`.
