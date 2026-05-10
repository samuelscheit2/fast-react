# Worker 421: Passive Effect Error Capture Root Record

Objective: add private root error capture records for passive create/destroy
failures so the reconciler can prove scheduled error metadata before invoking
public root error callbacks.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 161, 173, 225, 301, 349, 361, 362, and
389 if present.

Write scope: `crates/fast-react-reconciler/src/passive_effects.rs`,
`crates/fast-react-reconciler/src/root_scheduler.rs`,
`crates/fast-react-reconciler/src/root_commit.rs`, focused passive/root error
tests, and `worker-progress/worker-421-passive-effect-error-capture-root-record.md`.

Do not invoke renderer callbacks, public effects, public act, or React DOM error
facades.

Verification: run `cargo fmt --all --check`, focused passive/root error tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
