# Worker 423: Test Renderer Native Root Execution Bridge

Objective: replace record-only react-test-renderer create/update/unmount
diagnostics with a private bridge shape that can call the Rust test renderer
root execution boundary while preserving public fail-closed behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 153, 304, 307, 363, 393, 391, and 392
if present.

Write scope: `crates/fast-react-test-renderer`, `crates/fast-react-napi`,
`packages/react-test-renderer`, focused test-renderer bridge tests, and
`worker-progress/worker-423-test-renderer-native-root-execution-bridge.md`.

Do not claim public create/update/unmount, serialization, TestInstance, or act
compatibility.

Verification: run `cargo fmt --all --check`, focused Rust test-renderer/N-API
tests, focused JS react-test-renderer tests, `npm run check --workspace
@fast-react/react-test-renderer`, and `git diff --check`.
