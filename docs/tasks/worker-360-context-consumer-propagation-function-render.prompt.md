# Worker 360: Context Consumer Propagation Function Render

Objective: extend private context provider propagation so a function-component
consumer can read the nearest accepted provider value during render, with
fail-closed diagnostics for unsupported shapes.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 180, 249, 286, 329, 350, and 351 if
present.

Write scope: `crates/fast-react-reconciler/src/root_work_loop.rs`,
`crates/fast-react-reconciler/src/function_component.rs`,
`crates/fast-react-reconciler/src/begin_work.rs`, focused Rust tests, and
`worker-progress/worker-360-context-consumer-propagation-function-render.md`.

Do not wire public React context facade behavior or broad reconciliation.

Verification: run `cargo fmt --all --check`, focused context/root-work-loop
tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
