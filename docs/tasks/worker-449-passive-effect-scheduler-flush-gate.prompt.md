# Worker 449: Passive Effect Scheduler Flush Gate

Objective: add a private gate that turns pending passive commit metadata into a
deterministic scheduler flush request and records execution ordering without
running public effects.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 389, 390, 420, 421, and 422 if
present.

Write scope: `crates/fast-react-reconciler/src/passive_effects.rs`,
`crates/fast-react-reconciler/src/root_scheduler.rs`,
`crates/fast-react-reconciler/src/scheduler_bridge.rs`, focused Rust tests, and
`worker-progress/worker-449-passive-effect-scheduler-flush-gate.md`.

Do not run JS effect callbacks, open public `act`, or change Scheduler package
behavior.

Verification: run focused passive_effects/root_scheduler/scheduler_bridge
tests, `cargo test -p fast-react-reconciler --all-features`, `cargo fmt --all
--check`, and `git diff --check`.
