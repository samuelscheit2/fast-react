# Worker 484: TestInstance findBy Private Query Gate

Objective: add private TestInstance `findByType` and `findByProps` diagnostics
that build on accepted `findAll` metadata without exposing public query
compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 426, 463, 464, and 465 if present.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`,
focused tests, and
`worker-progress/worker-484-test-instance-find-by-private-query-gate.md`.

Do not claim public TestInstance query compatibility.

Verification: run focused test-renderer TestInstance tests,
`cargo test -p fast-react-test-renderer --all-features`, focused
serialization/query conformance tests if touched, and `git diff --check`.
