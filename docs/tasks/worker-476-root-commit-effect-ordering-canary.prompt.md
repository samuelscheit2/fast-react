# Worker 476: Root Commit Effect Ordering Canary

Objective: add private commit-order diagnostics proving layout, ref, passive,
callback, and deletion metadata are observed in deterministic commit order for a
minimal host-output tree.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 413, 414, 415, 443, 444, 448, 449,
450, and 451 if present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`, focused
root-commit tests, and
`worker-progress/worker-476-root-commit-effect-ordering-canary.md`.

Do not execute public effects or mutate real host containers beyond accepted
private canaries.

Verification: run focused root-commit tests, `cargo test -p
fast-react-reconciler --all-features`, `cargo fmt --all --check`, and
`git diff --check`.
