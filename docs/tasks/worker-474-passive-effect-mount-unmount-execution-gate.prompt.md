# Worker 474: Passive Effect Mount/Unmount Execution Gate

Objective: add a private reconciler gate that executes accepted passive create
and destroy callbacks from committed effect metadata under explicit test-only
controls.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 326, 361, 388, 419, 420, 421, 449,
and 451 if present.

Write scope: `crates/fast-react-reconciler/src/passive_effects.rs`,
`crates/fast-react-reconciler/src/root_commit.rs`,
focused reconciler tests, and
`worker-progress/worker-474-passive-effect-mount-unmount-execution-gate.md`.

Do not wire public React/renderer act behavior or execute callbacks outside the
private test gate.

Verification: run focused passive-effect/root-commit tests,
`cargo test -p fast-react-reconciler --all-features`, `cargo fmt --all --check`,
and `git diff --check`.
