# Worker 424: Test Renderer toJSON Broader Host Shapes

Objective: extend private `toJSON` diagnostics beyond the current minimal
canary to cover multiple host children, text siblings, prop elision, and empty
roots while keeping the public facade blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 236, 265, 333, 363, 391, and 412 if
present.

Write scope: `crates/fast-react-test-renderer`, `packages/react-test-renderer`,
`tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`,
focused serialization tests, and
`worker-progress/worker-424-test-renderer-tojson-broader-host-shapes.md`.

Do not modify TestInstance query behavior, `toTree`, act, or public
compatibility claims.

Verification: run `cargo fmt --all --check`, focused Rust test-renderer tests,
focused serialization gate tests, `npm run check --workspace
@fast-react/react-test-renderer`, and `git diff --check`.
