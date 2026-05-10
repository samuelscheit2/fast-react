# Worker 392: Test Renderer Public toTree Private Facade

Objective: add a narrowly gated private `toTree` facade path for
react-test-renderer that consumes accepted Rust private tree metadata without
opening public `toTree` compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 235, 293, 364, 391, and related
serialization gate reports if present.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`,
`packages/react-test-renderer/index.js`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`, focused
toTree/serialization tests, and
`worker-progress/worker-392-test-renderer-public-totree-private-facade.md`.

Keep public TestRenderer compatibility and unsupported composite trees blocked.

Verification: run `cargo fmt --all --check`,
`cargo test -p fast-react-test-renderer --all-features`, focused
react-test-renderer toTree/serialization tests,
`npm run check --workspace @fast-react/react-test-renderer`, and
`git diff --check`.
