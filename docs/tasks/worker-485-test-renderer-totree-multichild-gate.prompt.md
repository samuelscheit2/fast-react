# Worker 485: Test Renderer toTree Multi-Child Gate

Objective: extend private `toTree` diagnostics to minimal multi-child and
composite-above-host shapes while keeping stale snapshots and public `toTree`
blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 424, 425, 463, 464, and 465 if
present.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`,
`packages/react-test-renderer/cjs/react-test-renderer.development.js`,
serialization conformance gates if needed, focused tests, and
`worker-progress/worker-485-test-renderer-totree-multichild-gate.md`.

Do not claim public `toTree`, TestInstance, or renderer compatibility.

Verification: run focused test-renderer serialization tests,
`cargo test -p fast-react-test-renderer --all-features`, focused
serialization conformance tests if touched, and `git diff --check`.
