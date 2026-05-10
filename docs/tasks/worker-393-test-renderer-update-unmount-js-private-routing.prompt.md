# Worker 393: Test Renderer Update/Unmount JS Private Routing

Objective: extend the react-test-renderer JS facade routing gate so private
update and unmount requests can consume accepted Rust lifecycle diagnostics
without changing public create/update/unmount behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 307, 363, 364, 366, 391, and 392 if
present.

Write scope: `packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
`tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`,
focused react-test-renderer tests, and
`worker-progress/worker-393-test-renderer-update-unmount-js-private-routing.md`.

Do not expose new public package keys or claim public root lifecycle
compatibility.

Verification: run JS syntax checks, focused react-test-renderer create/routing
and serialization tests, `npm run check --workspace @fast-react/react-test-renderer`,
`npm run check:package-surface`, and `git diff --check`.
