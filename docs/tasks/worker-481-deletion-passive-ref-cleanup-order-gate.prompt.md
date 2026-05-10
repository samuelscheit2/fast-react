# Worker 481: Deletion Passive/Ref Cleanup Order Gate

Objective: add private deletion cleanup diagnostics proving ref cleanup returns
and passive destroy metadata are ordered deterministically for removed host
subtrees.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 414, 415, 444, 449, 474, and 476 if
present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-test-renderer/src/lib.rs`, focused deletion/ref/passive
tests, and
`worker-progress/worker-481-deletion-passive-ref-cleanup-order-gate.md`.

Do not mutate real DOM, execute public effects, or expose public ref/effect
compatibility.

Verification: run focused root-commit and test-renderer deletion tests,
`cargo test -p fast-react-reconciler -p fast-react-test-renderer --all-features`,
`cargo fmt --all --check`, and `git diff --check`.
