# Worker 362: Passive Effect Unmount Destroy Order Private

Objective: strengthen private passive destroy execution so multiple unmount
records execute in React-like deterministic order before mount creates, with
errors recorded without stopping later eligible records.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 157, 173, 326, 331, 349, and 361 if
present.

Write scope: `crates/fast-react-reconciler/src/passive_effects.rs`,
focused Rust tests, and
`worker-progress/worker-362-passive-effect-unmount-destroy-order-private.md`.

Do not add public passive-effect or scheduler compatibility claims.

Verification: run `cargo fmt --all --check`, focused passive-effects tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
