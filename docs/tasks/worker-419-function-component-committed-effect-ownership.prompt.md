# Worker 419: Function Component Committed Effect Ownership

Objective: persist accepted function-component effect queue records on committed
fibers so later passive traversal can discover effects without caller-provided
handoff metadata.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 157, 224, 279, 301, 349, 361, 362, and
388 if present.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`crates/fast-react-reconciler/src/root_commit.rs`, focused hook/effect tests,
and `worker-progress/worker-419-function-component-committed-effect-ownership.md`.

Do not implement passive flushing, scheduler integration, public effects, or
React act behavior.

Verification: run `cargo fmt --all --check`, focused function-component/effect
tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
