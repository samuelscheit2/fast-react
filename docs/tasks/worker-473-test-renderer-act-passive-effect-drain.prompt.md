# Worker 473: Test Renderer Act Passive-Effect Drain Gate

Objective: replace stale worker 466 by adding private react-test-renderer act
diagnostics that consume accepted pending-passive flush metadata without opening
public act compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 405, 422, 437, 449, 451, and 466 if
present.

Write scope: `packages/react-test-renderer/cjs/react-test-renderer.development.js`,
`packages/react-test-renderer/cjs/react-test-renderer.production.js`,
`crates/fast-react-test-renderer/src/lib.rs`,
`tests/conformance/src/react-test-renderer-act-oracle.mjs`, focused tests, and
`worker-progress/worker-473-test-renderer-act-passive-effect-drain.md`.

Do not open public `act`, run arbitrary JS effect callbacks, or claim
react-test-renderer act compatibility.

Verification: run focused react-test-renderer act tests, `cargo test -p
fast-react-test-renderer --all-features`, focused act conformance tests if
touched, and `git diff --check`.
