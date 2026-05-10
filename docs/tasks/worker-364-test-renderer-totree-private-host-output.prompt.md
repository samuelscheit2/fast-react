# Worker 364: Test Renderer ToTree Private Host Output

Objective: add private react-test-renderer `toTree` metadata for the accepted
minimal HostRoot -> HostComponent -> HostText shape, while public `toTree`
remains blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 178, 235, 265, 310, 333, and 334 if
present.

Write scope: `packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
`tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs`,
`tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`,
focused tests, and
`worker-progress/worker-364-test-renderer-totree-private-host-output.md`.

Do not create public TestRenderer tree objects or claim compatibility.

Verification: run JS syntax checks, focused serialization/create-routing tests,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
