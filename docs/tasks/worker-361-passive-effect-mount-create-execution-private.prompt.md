# Worker 361: Passive Effect Mount Create Execution Private

Objective: add a private passive-effect mount execution canary that invokes
accepted create callback handles after commit under explicit test control,
records errors, and preserves scheduler/public effect blockers.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 157, 173, 285, 326, 331, 349, and 357
if present.

Write scope: `crates/fast-react-reconciler/src/passive_effects.rs`,
focused Rust tests, and
`worker-progress/worker-361-passive-effect-mount-create-execution-private.md`.

Do not enable scheduler-driven passive execution or public `act` behavior.

Verification: run `cargo fmt --all --check`, focused passive-effects tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
