# Worker 426: Test Renderer TestInstance Bridge Query

Objective: route private TestInstance query diagnostics through accepted bridge
metadata from the test-renderer root instead of standalone test-authored
wrappers.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 235, 267, 306, 334, 365, 393, and 423
if present.

Write scope: `crates/fast-react-test-renderer`, `packages/react-test-renderer`,
focused TestInstance/error-surface tests, and
`worker-progress/worker-426-test-renderer-testinstance-bridge-query.md`.

Do not change serialization, act, or public TestInstance compatibility.

Verification: run `cargo fmt --all --check`, focused Rust test-renderer tests,
focused JS TestInstance tests, `npm run check --workspace
@fast-react/react-test-renderer`, and `git diff --check`.
