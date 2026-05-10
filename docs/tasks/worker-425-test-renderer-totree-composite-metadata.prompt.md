# Worker 425: Test Renderer toTree Composite Metadata

Objective: extend private `toTree` diagnostics with composite/function
component metadata above committed host output while keeping the public `toTree`
facade blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 236, 267, 334, 364, 392, and 424 if
present.

Write scope: `crates/fast-react-test-renderer`, `packages/react-test-renderer`,
`tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`,
focused serialization tests, and
`worker-progress/worker-425-test-renderer-totree-composite-metadata.md`.

Do not modify `toJSON`, TestInstance query routing, act, or public
compatibility claims.

Verification: run `cargo fmt --all --check`, focused Rust test-renderer tests,
focused serialization gate tests, `npm run check --workspace
@fast-react/react-test-renderer`, and `git diff --check`.
