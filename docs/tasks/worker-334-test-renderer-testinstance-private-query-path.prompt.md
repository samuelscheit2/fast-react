# Worker 334: Test Renderer TestInstance Private Query Path

Objective: extend the private TestInstance wrapper skeleton with deterministic
query metadata over accepted committed fiber inspection records, keeping public
`.root`, `find*`, and serialization behavior fail-closed.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 235, 267, 291, 306, and 309.

Write scope: `packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
focused conformance tests, and
`worker-progress/worker-334-test-renderer-testinstance-private-query-path.md`.

Do not add public TestInstance compatibility claims.

Verification: run JS syntax checks, focused TestInstance/create routing tests,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
