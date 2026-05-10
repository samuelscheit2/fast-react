# Worker 407: Benchmark Private Root Output Timing Canaries

Objective: add benchmark manifest and gate coverage for private root host-output
timing canaries that remain diagnostic-only until public compatibility gates
are green.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 162, 289, 379, 380, and 381 if
present.

Write scope: `tests/benchmarks/manifests/*.json`,
`tests/benchmarks/test/*.test.mjs`,
`tests/benchmarks/scripts/*.mjs`, focused benchmark tests, and
`worker-progress/worker-407-benchmark-private-root-output-timing-canaries.md`.

Do not add green timing or performance claims for public root behavior.

Verification: run `npm run check:benchmarks`, relevant root-render conformance
checks, `npm run check:js`, and `git diff --check`.
