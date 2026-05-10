# Worker 389: Passive Effects Error Propagation Private

Objective: extend private passive effect create/destroy execution diagnostics
to preserve error ordering and blocked root-error propagation evidence across
mixed unmount and mount records.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 326, 331, 349, 361, 362, and 388 if
present.

Write scope: `crates/fast-react-reconciler/src/passive_effects.rs`,
`crates/fast-react-reconciler/src/root_scheduler.rs`, focused passive tests,
and `worker-progress/worker-389-passive-effects-error-propagation-private.md`.

Keep public `act`, renderer error callbacks, DOM mutation, and compatibility
claims blocked.

Verification: run `cargo fmt --all --check`, focused `passive_effects` and
`root_scheduler` passive tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
