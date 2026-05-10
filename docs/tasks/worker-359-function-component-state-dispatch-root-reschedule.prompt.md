# Worker 359: Function Component State Dispatch Root Reschedule

Objective: add a private canary showing a function-component `useState`
dispatch records a lane-backed root reschedule request after initial render,
without public hook or event integration.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 124, 128, 155, 158, 159, 327, 328, and
330 if present.

Write scope: `crates/fast-react-reconciler/src/function_component.rs`,
`crates/fast-react-reconciler/src/root_scheduler.rs`,
`crates/fast-react-reconciler/src/concurrent_updates.rs`, focused Rust tests,
and `worker-progress/worker-359-function-component-state-dispatch-root-reschedule.md`.

Do not claim public `useState` compatibility or wire JS event handlers.

Verification: run `cargo fmt --all --check`, focused function-component and
root-scheduler tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
