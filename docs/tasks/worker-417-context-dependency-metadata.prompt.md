# Worker 417: Context Dependency Metadata

Objective: record private context dependency metadata for function-component
runtime reads so Provider/useContext diagnostics can prove dependency identity
without exposing renderer-visible propagation.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 180, 222, 300, 360, 386, 387, and 409
if present.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`crates/fast-react-reconciler/src/begin_work.rs`, focused context/function
component tests, context conformance gate expectations if needed, and
`worker-progress/worker-417-context-dependency-metadata.md`.

Do not wire public `React.useContext`, DOM/test-renderer output, or broad
provider traversal.

Verification: run `cargo fmt --all --check`, focused context/function component
tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
