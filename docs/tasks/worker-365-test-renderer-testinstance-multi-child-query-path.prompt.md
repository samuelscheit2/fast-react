# Worker 365: Test Renderer TestInstance Multi Child Query Path

Objective: broaden private TestInstance query-path metadata from a single host
component to a deterministic multi-child host tree, preserving skipped text
records and public `.root` blockers.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 235, 267, 310, 334, 350, and 354 if
present.

Write scope: `packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
`tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`,
`tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`,
focused tests, and
`worker-progress/worker-365-test-renderer-testinstance-multi-child-query-path.md`.

Do not expose public ReactTestInstance objects.

Verification: run JS syntax checks, focused TestInstance/create-routing tests,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
