# Worker 331: Sync Flush Passive Continuation Execution

Objective: implement the next private sync-flush post-passive continuation
step so accepted pending-passive metadata can request a deterministic follow-up
sync flush without public `act` or effect callback execution claims.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 179, 207, 252, 285, 303, and 326 if
present.

Write scope: `crates/fast-react-reconciler/src/sync_flush.rs`,
`crates/fast-react-reconciler/src/root_scheduler.rs`,
`crates/fast-react-reconciler/src/passive_effects.rs`, focused Rust tests, and
`worker-progress/worker-331-sync-flush-passive-continuation-execution.md`.

Keep React/React DOM public `act` surfaces blocked.

Verification: run `cargo fmt --all --check`, focused sync-flush/passive tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
