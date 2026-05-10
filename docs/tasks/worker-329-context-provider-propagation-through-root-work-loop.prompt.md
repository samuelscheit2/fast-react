# Worker 329: Context Provider Propagation Through Root Work Loop

Objective: turn accepted context-provider begin-work canaries into a root
work-loop handoff that propagates nested provider values through a narrow
function-component child render, with deterministic unwind on errors.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 180, 194, 222, 247, 298, and 329
dependencies in current source.

Write scope: `crates/fast-react-reconciler/src/begin_work.rs`,
`crates/fast-react-reconciler/src/root_work_loop.rs`,
`crates/fast-react-reconciler/src/function_component.rs`, focused Rust tests,
and `worker-progress/worker-329-context-provider-propagation-through-root-work-loop.md`.

Do not change public `createContext` JS behavior.

Verification: run `cargo fmt --all --check`, focused context/root-work-loop
tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
