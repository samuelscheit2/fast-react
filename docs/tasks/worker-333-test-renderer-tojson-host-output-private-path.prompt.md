# Worker 333: Test Renderer toJSON Host Output Private Path

Objective: advance the private `toJSON` facade so it can serialize accepted
minimal committed host-output diagnostics from Rust canaries while public
serialization compatibility remains blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 178, 208, 234, 236, 291, 305, and
309.

Write scope: `packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
`tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`,
focused tests, and
`worker-progress/worker-333-test-renderer-tojson-host-output-private-path.md`.

Do not claim public `toJSON` compatibility.

Verification: run JS syntax checks, focused serialization local gate tests,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
