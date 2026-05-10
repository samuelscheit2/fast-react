# Worker 420: Passive Effect Traversal From Fiber Effects

Objective: add a private passive effect traversal canary that consumes committed
fiber-owned effect records instead of caller-supplied passive handoff metadata.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 173, 225, 301, 349, 361, 362, 388, and
389 if present.

Write scope: `crates/fast-react-reconciler/src/passive_effects.rs`,
`crates/fast-react-reconciler/src/root_commit.rs`, focused passive/effect tests,
and `worker-progress/worker-420-passive-effect-traversal-from-fiber-effects.md`.

Do not change public effect dispatchers, Scheduler, React act, or renderer JS
gates.

Verification: run `cargo fmt --all --check`, focused passive effect tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
