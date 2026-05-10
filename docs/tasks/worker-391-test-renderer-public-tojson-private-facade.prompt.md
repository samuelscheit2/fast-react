# Worker 391: Test Renderer Public toJSON Private Facade

Objective: allow the JS react-test-renderer facade to expose a narrowly gated
private `toJSON` diagnostic result when backed by accepted Rust host-output
serialization evidence, while public compatibility stays blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 178, 235, 265, 293, 363, 366, and 382
if present.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`,
`packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`, focused
serialization tests, and
`worker-progress/worker-391-test-renderer-public-tojson-private-facade.md`.

Do not claim public React Test Renderer serialization compatibility.

Verification: run `cargo fmt --all --check`,
`cargo test -p fast-react-test-renderer --all-features`, focused
react-test-renderer serialization tests,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
